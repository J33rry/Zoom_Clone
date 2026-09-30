from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import utcnow

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import MeetingParticipant


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    participant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meeting_participants.id", ondelete="CASCADE")
    )
    # NULL = sent to "Meeting Group Chat" (everyone); otherwise a direct message.
    recipient_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("meeting_participants.id", ondelete="CASCADE")
    )
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meeting: Mapped["Meeting"] = relationship(back_populates="chat_messages")
    participant: Mapped["MeetingParticipant"] = relationship(
        back_populates="chat_messages", foreign_keys=[participant_id]
    )
    recipient: Mapped["MeetingParticipant | None"] = relationship(foreign_keys=[recipient_id])
