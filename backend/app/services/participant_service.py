"""Joining, leaving and host actions on the people inside a meeting."""
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Meeting, MeetingParticipant, MeetingStatus, ParticipantRole, User
from app.models.mixins import utcnow
from app.schemas.meeting import JoinRequest
from app.services.errors import ForbiddenError, NotFoundError, ValidationError
from app.services.meeting_service import ensure_joinable


def join_meeting(
    db: Session, meeting: Meeting, request: JoinRequest, user: User, *, locked: bool = False
) -> MeetingParticipant:
    """`locked` is the live "Lock Meeting" host setting: no new participants may join."""
    ensure_joinable(meeting)

    is_host = request.as_host and meeting.host_id == user.id
    if request.as_host and not is_host:
        raise ForbiddenError("Only the host can start this meeting.")
    if locked and not is_host:
        raise ForbiddenError("This meeting has been locked by the host.")

    if not is_host and meeting.passcode_enabled and meeting.passcode:
        if (request.passcode or "").strip() != meeting.passcode:
            raise ValidationError("Incorrect meeting passcode.")

    if is_host and meeting.status != MeetingStatus.LIVE:
        meeting.status = MeetingStatus.LIVE
        meeting.started_at = utcnow()
        meeting.ended_at = None

    participant = MeetingParticipant(
        meeting=meeting,
        user_id=user.id if is_host else None,
        display_name=request.display_name,
        role=ParticipantRole.HOST if is_host else ParticipantRole.PARTICIPANT,
        is_audio_muted=request.audio_muted,
        is_video_on=request.video_on,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def get_active_participant(db: Session, participant_id: str, meeting_id: int) -> MeetingParticipant:
    participant = db.get(MeetingParticipant, participant_id)
    if participant is None or participant.meeting_id != meeting_id or not participant.is_active:
        raise NotFoundError("Participant session is not valid")
    return participant


def resume_session(db: Session, participant_id: str, meeting_id: int) -> MeetingParticipant:
    """Validate a WebSocket session; a participant who dropped (e.g. refreshed) may reconnect."""
    participant = db.get(MeetingParticipant, participant_id)
    if (
        participant is None
        or participant.meeting_id != meeting_id
        or participant.removed_by_host
        or participant.meeting.status == MeetingStatus.ENDED
    ):
        raise NotFoundError("Participant session is not valid")
    if participant.left_at is not None:
        participant.left_at = None
        db.commit()
    return participant


def active_participants(db: Session, meeting_id: int) -> list[MeetingParticipant]:
    return list(
        db.scalars(
            select(MeetingParticipant).where(
                MeetingParticipant.meeting_id == meeting_id,
                MeetingParticipant.left_at.is_(None),
                MeetingParticipant.removed_by_host.is_(False),
            )
        )
    )


def mark_left(db: Session, participant_id: str) -> None:
    participant = db.get(MeetingParticipant, participant_id)
    if participant is not None and participant.left_at is None:
        participant.left_at = utcnow()
        db.commit()


def set_media_state(db: Session, participant_id: str, *, audio_muted: bool, video_on: bool) -> None:
    participant = db.get(MeetingParticipant, participant_id)
    if participant is not None:
        participant.is_audio_muted = audio_muted
        participant.is_video_on = video_on
        db.commit()


def mute_participants(db: Session, meeting_id: int, participant_ids: list[str]) -> None:
    if not participant_ids:
        return
    db.execute(
        update(MeetingParticipant)
        .where(MeetingParticipant.meeting_id == meeting_id, MeetingParticipant.id.in_(participant_ids))
        .values(is_audio_muted=True)
    )
    db.commit()


def stop_video(db: Session, meeting_id: int, participant_ids: list[str]) -> None:
    if not participant_ids:
        return
    db.execute(
        update(MeetingParticipant)
        .where(MeetingParticipant.meeting_id == meeting_id, MeetingParticipant.id.in_(participant_ids))
        .values(is_video_on=False)
    )
    db.commit()


def rename_participant(db: Session, participant_id: str, name: str) -> None:
    participant = db.get(MeetingParticipant, participant_id)
    if participant is not None:
        participant.display_name = name
        db.commit()


def remove_participant(db: Session, meeting_id: int, participant_id: str) -> None:
    participant = get_active_participant(db, participant_id, meeting_id)
    if participant.role == ParticipantRole.HOST:
        raise ValidationError("The host cannot be removed.")
    participant.removed_by_host = True
    participant.left_at = utcnow()
    db.commit()


def end_meeting(db: Session, meeting: Meeting) -> None:
    """Close the meeting and every open participant session."""
    now = utcnow()
    meeting.status = MeetingStatus.ENDED
    meeting.ended_at = now
    db.execute(
        update(MeetingParticipant)
        .where(MeetingParticipant.meeting_id == meeting.id, MeetingParticipant.left_at.is_(None))
        .values(left_at=now)
    )
    db.commit()


def attendees(db: Session, meeting: Meeting) -> list[tuple[MeetingParticipant, bool]]:
    """Everyone who has joined `meeting`, one entry per person (not per join session).

    Account users are grouped by user id, guests by display name. Returns each person's first
    session paired with whether they are in the meeting right now; the host comes first.
    """
    sessions = db.scalars(
        select(MeetingParticipant)
        .where(MeetingParticipant.meeting_id == meeting.id)
        .order_by(MeetingParticipant.joined_at)
    ).all()
    live = meeting.status == MeetingStatus.LIVE
    people: dict[tuple[str, object], tuple[MeetingParticipant, bool]] = {}
    for session in sessions:
        key = ("user", session.user_id) if session.user_id is not None else ("guest", session.display_name.casefold())
        first, present = people.get(key, (session, False))
        people[key] = (first, present or (live and session.is_active))
    return sorted(people.values(), key=lambda entry: entry[0].role != ParticipantRole.HOST)
