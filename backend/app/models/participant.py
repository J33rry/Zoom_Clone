import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ParticipantRole
from app.models.mixins import utcnow

if TYPE_CHECKING:
    from app.models.chat_message import ChatMessage
    from app.models.meeting import Meeting
    from app.models.user import User


GUEST_COLORS = ["#0E72ED", "#E8710A", "#1E8E3E", "#D93025", "#A142F4", "#12B5CB", "#6E1E9A"]


class MeetingParticipant(Base):
    """One row per join session. The id doubles as the session token for the WebSocket."""

    __tablename__ = "meeting_participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    # Null for guests who join through an invite link without an account.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    display_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[ParticipantRole] = mapped_column(
        Enum(ParticipantRole, values_callable=lambda e: [m.value for m in e], native_enum=False),
        default=ParticipantRole.PARTICIPANT,
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    left_at: Mapped[datetime | None] = mapped_column(DateTime)
    is_audio_muted: Mapped[bool] = mapped_column(Boolean, default=True)
    is_video_on: Mapped[bool] = mapped_column(Boolean, default=False)
    removed_by_host: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
    user: Mapped["User | None"] = relationship()
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="participant", foreign_keys="ChatMessage.participant_id"
    )

    @property
    def is_active(self) -> bool:
        return self.left_at is None and not self.removed_by_host

    @property
    def avatar_color(self) -> str:
        """Account users keep their colour; guests get a stable colour from their session id."""
        if self.user is not None:
            return self.user.avatar_color
        return GUEST_COLORS[sum(map(ord, self.id)) % len(GUEST_COLORS)]
