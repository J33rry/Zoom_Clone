from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import MeetingStatus, MeetingType
from app.models.mixins import utcnow

if TYPE_CHECKING:
    from app.models.chat_message import ChatMessage
    from app.models.participant import MeetingParticipant
    from app.models.user import User


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (Index("ix_meetings_host_start", "host_id", "start_time"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # Public, human-facing Meeting ID (e.g. "81360004521"). Unique across all meetings.
    # NULL when the meeting runs in the host's Personal Meeting Room (use_pmi=True);
    # SQLite allows many NULLs under a UNIQUE constraint.
    meeting_code: Mapped[str | None] = mapped_column(String(11), unique=True, index=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    topic: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    meeting_type: Mapped[MeetingType] = mapped_column(
        Enum(MeetingType, values_callable=lambda e: [m.value for m in e], native_enum=False)
    )
    use_pmi: Mapped[bool] = mapped_column(Boolean, default=False)

    # UTC start time; instant meetings start "now".
    start_time: Mapped[datetime] = mapped_column(DateTime)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=40)
    # IANA zone the host scheduled in; used for display and the invitation text.
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")

    passcode: Mapped[str | None] = mapped_column(String(10))
    passcode_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    waiting_room_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    host_video_on: Mapped[bool] = mapped_column(Boolean, default=True)
    participant_video_on: Mapped[bool] = mapped_column(Boolean, default=True)

    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus, values_callable=lambda e: [m.value for m in e], native_enum=False),
        default=MeetingStatus.SCHEDULED,
        index=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    host: Mapped["User"] = relationship(back_populates="hosted_meetings")
    participants: Mapped[list["MeetingParticipant"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", passive_deletes=True
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def join_code(self) -> str:
        """The Meeting ID people actually dial: the host's PMI for PMI meetings."""
        if self.use_pmi:
            return self.host.personal_meeting_id
        assert self.meeting_code is not None
        return self.meeting_code

    @property
    def end_time(self) -> datetime:
        return self.start_time + timedelta(minutes=self.duration_minutes)
