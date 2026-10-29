import uuid
from enum import Enum
from typing import List, Optional, Dict, Any
from sqlalchemy import String, Text, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, TimestampMixin

class AnswerabilityStatus(str, Enum):
    ANSWERED_WITH_EVIDENCE = "answered_with_evidence"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    CLARIFICATION_NEEDED = "clarification_needed"
    OUT_OF_SCOPE = "out_of_scope"
    ERROR = "error"

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), default="New Conversation")
    preferred_language: Mapped[str] = mapped_column(String(16), default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
        lazy="selectin"
    )

class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # NLP & Grounding Metadata
    query_language: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    response_language: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    question_category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    answerability_status: Mapped[str] = mapped_column(
        String(32),
        default=AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value
    )
    
    # Citations & Evidence
    citations: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    suggested_followups: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # Diagnostics & Tracing
    retrieval_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latency_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    execution_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    feedbacks: Mapped[List["Feedback"]] = relationship(
        "Feedback",
        back_populates="message",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
