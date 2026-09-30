"""Invite links and the plain-text invitation shown in the Meetings tab."""
from urllib.parse import quote
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.models import Meeting, MeetingType
from app.services.id_generator import format_meeting_id
from app.services.timezones import zone_label


def build_invite_link(meeting: Meeting) -> str:
    base = get_settings().frontend_url.rstrip("/")
    link = f"{base}/j/{meeting.join_code}"
    if meeting.passcode_enabled and meeting.passcode:
        link += f"?pwd={quote(meeting.passcode)}"
    return link


def build_invitation(meeting: Meeting) -> str:
    host_name = meeting.host.name
    lines: list[str] = []
    if meeting.meeting_type == MeetingType.SCHEDULED:
        local_start = meeting.start_time.replace(tzinfo=ZoneInfo("UTC")).astimezone(
            ZoneInfo(meeting.timezone)
        )
        lines += [
            f"{host_name} is inviting you to a scheduled Zoom meeting.",
            "",
            f"Topic: {meeting.topic}",
            f"Time: {local_start.strftime('%b %d, %Y %I:%M %p')} {zone_label(meeting.timezone)}",
        ]
    else:
        lines.append(f"{host_name} is inviting you to a Zoom meeting.")
    lines += [
        "",
        "Join Zoom Meeting",
        build_invite_link(meeting),
        "",
        f"Meeting ID: {format_meeting_id(meeting.join_code)}",
    ]
    if meeting.passcode_enabled and meeting.passcode:
        lines.append(f"Passcode: {meeting.passcode}")
    return "\n".join(lines)
