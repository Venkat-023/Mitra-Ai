import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, TimestampMixin

class FeedbackRating(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"

class FeedbackTag(str, Enum):
    ACCURATE = "accurate"
    INACCURATE = "inaccurate"
    MISSING_CITATION = "missing_citation"
    LANGUAGE_ERROR = "language_error"
    OUTDATED = "outdated"
    HELPFUL = "helpful"
    OTHER = "other"

class Feedback(Base, TimestampMixin):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    message_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rating: Mapped[str] = mapped_column(String(16), nullable=False)
    feedback_tag: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Administrative triage
    escalation_required: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    message: Mapped["Message"] = relationship("Message", back_populates="feedbacks")
