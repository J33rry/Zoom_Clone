"""Business rules for creating, listing, editing and resolving meetings."""
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Meeting, MeetingStatus, MeetingType, User
from app.models.mixins import utcnow
from app.schemas.meeting import MeetingCreate, MeetingUpdate
from app.services.errors import ForbiddenError, MeetingEndedError, NotFoundError, ValidationError
from app.services.id_generator import generate_passcode, generate_unique_code

MEETING_CODE_LENGTH = 11
# Allow a small grace period so a form opened a few minutes ago can still be saved.
PAST_START_GRACE = timedelta(minutes=5)
RECENT_LIMIT = 10


def _code_taken(db: Session, code: str) -> bool:
    return (
        db.scalar(select(Meeting.id).where(Meeting.meeting_code == code)) is not None
        or db.scalar(select(User.id).where(User.personal_meeting_id == code)) is not None
    )


def _new_meeting_code(db: Session) -> str:
    return generate_unique_code(MEETING_CODE_LENGTH, lambda code: _code_taken(db, code))


def _base_query():
    return select(Meeting).options(joinedload(Meeting.host))


# ---------------------------------------------------------------- queries


def get_meeting(db: Session, meeting_id: int) -> Meeting:
    meeting = db.scalar(_base_query().where(Meeting.id == meeting_id))
    if meeting is None:
        raise NotFoundError("Meeting not found")
    return meeting


def get_owned_meeting(db: Session, meeting_id: int, user: User) -> Meeting:
    meeting = get_meeting(db, meeting_id)
    if meeting.host_id != user.id:
        raise ForbiddenError("Only the host can modify this meeting")
    return meeting


def list_meetings_between(db: Session, user: User, start: datetime, end: datetime) -> list[Meeting]:
    """Scheduled meetings whose start falls in [start, end) — the Home calendar's day view."""
    return list(
        db.scalars(
            _base_query()
            .where(
                Meeting.host_id == user.id,
                Meeting.meeting_type == MeetingType.SCHEDULED,
                Meeting.start_time >= start,
                Meeting.start_time < end,
            )
            .order_by(Meeting.start_time)
        )
    )


def list_upcoming(db: Session, user: User) -> list[Meeting]:
    """Scheduled meetings that have not ended and whose time slot is not yet over."""
    now = utcnow()
    candidates = db.scalars(
        _base_query()
        .where(
            Meeting.host_id == user.id,
            Meeting.meeting_type == MeetingType.SCHEDULED,
            Meeting.status != MeetingStatus.ENDED,
            # Longest allowed duration is 24h, so this bound never drops a running meeting.
            Meeting.start_time >= now - timedelta(hours=24),
        )
        .order_by(Meeting.start_time)
    )
    return [meeting for meeting in candidates if meeting.end_time >= now]


def list_recent(db: Session, user: User, limit: int = RECENT_LIMIT) -> list[Meeting]:
    """Meetings that were actually held (started at least once), most recent first."""
    return list(
        db.scalars(
            _base_query()
            .where(Meeting.host_id == user.id, Meeting.started_at.is_not(None))
            .order_by(Meeting.started_at.desc())
            .limit(limit)
        )
    )


def resolve_code(db: Session, code: str) -> Meeting:
    """Find the meeting a dialled Meeting ID refers to (a normal meeting or someone's PMI room)."""
    code = "".join(ch for ch in code if ch.isdigit())
    if not code:
        raise NotFoundError("Invalid meeting ID")

    meeting = db.scalar(_base_query().where(Meeting.meeting_code == code))
    if meeting is not None:
        return meeting

    owner = db.scalar(select(User).where(User.personal_meeting_id == code))
    if owner is not None:
        return get_or_create_personal_room(db, owner)
    raise NotFoundError("This meeting ID is not valid. Please check and try again.")


def ensure_joinable(meeting: Meeting) -> None:
    # Instant meetings are one-off: once ended they cannot be rejoined.
    # Scheduled meetings and personal rooms can be started again.
    if meeting.meeting_type == MeetingType.INSTANT and meeting.status == MeetingStatus.ENDED:
        raise MeetingEndedError("This meeting has been ended by host.")


# ---------------------------------------------------------------- commands


def get_or_create_personal_room(db: Session, user: User) -> Meeting:
    room = db.scalar(
        _base_query().where(Meeting.host_id == user.id, Meeting.meeting_type == MeetingType.PERSONAL)
    )
    if room is None:
        room = Meeting(
            meeting_code=user.personal_meeting_id,
            host=user,
            topic=f"{user.name}'s Personal Meeting Room",
            meeting_type=MeetingType.PERSONAL,
            start_time=utcnow(),
            duration_minutes=60,
            timezone=user.timezone,
            passcode=generate_passcode(),
            status=MeetingStatus.ENDED,
        )
        db.add(room)
        db.commit()
        db.refresh(room)
    return room


def create_instant_meeting(db: Session, user: User, *, use_pmi: bool, video_on: bool) -> Meeting:
    if use_pmi:
        room = get_or_create_personal_room(db, user)
        room.host_video_on = video_on
        db.commit()
        return room

    meeting = Meeting(
        meeting_code=_new_meeting_code(db),
        host=user,
        topic=f"{user.name}'s Zoom Meeting",
        meeting_type=MeetingType.INSTANT,
        start_time=utcnow(),
        duration_minutes=60,
        timezone=user.timezone,
        passcode=generate_passcode(),
        host_video_on=video_on,
        status=MeetingStatus.SCHEDULED,  # becomes LIVE when the host actually joins
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def _apply_settings(db: Session, meeting: Meeting, host: User, data: MeetingCreate | MeetingUpdate) -> None:
    meeting.topic = data.topic
    meeting.description = (data.description or "").strip() or None
    meeting.start_time = data.start_time
    meeting.duration_minutes = data.duration_minutes
    meeting.timezone = data.timezone
    meeting.waiting_room_enabled = data.waiting_room_enabled
    meeting.host_video_on = data.host_video_on
    meeting.participant_video_on = data.participant_video_on

    if data.use_pmi:
        # Runs in the host's personal room, so it shares that room's ID and passcode.
        room = get_or_create_personal_room(db, host)
        meeting.use_pmi = True
        meeting.meeting_code = None
        meeting.passcode_enabled = room.passcode_enabled
        meeting.passcode = room.passcode
    else:
        meeting.use_pmi = False
        if meeting.meeting_code is None:
            meeting.meeting_code = _new_meeting_code(db)
        meeting.passcode_enabled = data.passcode_enabled
        if data.passcode_enabled:
            meeting.passcode = data.passcode or meeting.passcode or generate_passcode()


def _validate_start(start_time: datetime) -> None:
    if start_time < utcnow() - PAST_START_GRACE:
        raise ValidationError("The meeting cannot be scheduled in the past.")


def schedule_meeting(db: Session, user: User, data: MeetingCreate) -> Meeting:
    _validate_start(data.start_time)
    # host_id (not host=) keeps the half-built meeting out of the session until it is complete.
    meeting = Meeting(host_id=user.id, meeting_type=MeetingType.SCHEDULED, status=MeetingStatus.SCHEDULED)
    _apply_settings(db, meeting, user, data)
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def update_meeting(db: Session, meeting: Meeting, data: MeetingUpdate) -> Meeting:
    if meeting.meeting_type != MeetingType.SCHEDULED:
        raise ValidationError("Only scheduled meetings can be edited.")
    if data.start_time != meeting.start_time:
        _validate_start(data.start_time)
    _apply_settings(db, meeting, meeting.host, data)
    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting: Meeting) -> None:
    if meeting.meeting_type == MeetingType.PERSONAL:
        raise ValidationError("The Personal Meeting Room cannot be deleted.")
    db.delete(meeting)
    db.commit()
