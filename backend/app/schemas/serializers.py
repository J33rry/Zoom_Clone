"""Build response models that need computed fields (invite link, invitation text)."""
from app.models import Meeting
from app.schemas.meeting import MeetingLookup, MeetingOut
from app.schemas.user import UserBrief
from app.services.invitation import build_invitation, build_invite_link


def meeting_out(meeting: Meeting) -> MeetingOut:
    return MeetingOut(
        id=meeting.id,
        join_code=meeting.join_code,
        topic=meeting.topic,
        description=meeting.description,
        meeting_type=meeting.meeting_type,
        use_pmi=meeting.use_pmi,
        start_time=meeting.start_time,
        end_time=meeting.end_time,
        duration_minutes=meeting.duration_minutes,
        timezone=meeting.timezone,
        passcode=meeting.passcode if meeting.passcode_enabled else None,
        passcode_enabled=meeting.passcode_enabled,
        waiting_room_enabled=meeting.waiting_room_enabled,
        host_video_on=meeting.host_video_on,
        participant_video_on=meeting.participant_video_on,
        status=meeting.status,
        started_at=meeting.started_at,
        ended_at=meeting.ended_at,
        host=UserBrief.model_validate(meeting.host),
        invite_link=build_invite_link(meeting),
        invitation=build_invitation(meeting),
    )


def meeting_lookup(meeting: Meeting) -> MeetingLookup:
    return MeetingLookup(
        id=meeting.id,
        join_code=meeting.join_code,
        topic=meeting.topic,
        host_name=meeting.host.name,
        status=meeting.status,
        requires_passcode=bool(meeting.passcode_enabled and meeting.passcode),
        participant_video_on=meeting.participant_video_on,
    )
