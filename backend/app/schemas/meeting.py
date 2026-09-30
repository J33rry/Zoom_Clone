from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import MeetingStatus, MeetingType, ParticipantRole
from app.schemas.common import UTCDateTime, to_naive_utc
from app.schemas.user import UserBrief
from app.services.timezones import is_valid_timezone

PASSCODE_PATTERN = r"^[A-Za-z0-9]{1,10}$"


class MeetingSettings(BaseModel):
    """Fields shared by the Schedule and Edit forms."""

    topic: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    start_time: datetime
    duration_minutes: int = Field(ge=15, le=24 * 60)
    timezone: str = "Asia/Kolkata"
    use_pmi: bool = False
    passcode_enabled: bool = True
    passcode: str | None = Field(default=None, pattern=PASSCODE_PATTERN)
    waiting_room_enabled: bool = False
    host_video_on: bool = True
    participant_video_on: bool = True

    @field_validator("topic")
    @classmethod
    def _strip_topic(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Topic is required")
        return value

    @field_validator("start_time")
    @classmethod
    def _normalise_start(cls, value: datetime) -> datetime:
        return to_naive_utc(value)

    @field_validator("timezone")
    @classmethod
    def _check_timezone(cls, value: str) -> str:
        if not is_valid_timezone(value):
            raise ValueError("Unknown time zone")
        return value


class MeetingCreate(MeetingSettings):
    pass


class MeetingUpdate(MeetingSettings):
    pass


class InstantMeetingCreate(BaseModel):
    use_pmi: bool = False
    video_on: bool = True


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    join_code: str
    topic: str
    description: str | None
    meeting_type: MeetingType
    use_pmi: bool
    start_time: UTCDateTime
    end_time: UTCDateTime
    duration_minutes: int
    timezone: str
    passcode: str | None
    passcode_enabled: bool
    waiting_room_enabled: bool
    host_video_on: bool
    participant_video_on: bool
    status: MeetingStatus
    started_at: UTCDateTime | None
    ended_at: UTCDateTime | None
    host: UserBrief
    invite_link: str
    invitation: str


class MeetingLookup(BaseModel):
    """What the Join flow learns about a meeting before asking for a display name."""

    id: int
    join_code: str
    topic: str
    host_name: str
    status: MeetingStatus
    requires_passcode: bool
    participant_video_on: bool


class JoinRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    passcode: str | None = None
    # True when the signed-in user presses Start on their own meeting.
    as_host: bool = False
    audio_muted: bool = True
    video_on: bool = False

    @field_validator("display_name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Display name is required")
        return value


class MeetingAttendee(BaseModel):
    """A person who joined the meeting, shown in the meeting details panel."""

    name: str
    avatar_color: str
    role: ParticipantRole
    # Joined without an account ("External" in Zoom).
    is_guest: bool
    in_meeting: bool


class JoinResponse(BaseModel):
    participant_id: str
    role: ParticipantRole
    meeting: MeetingOut
