import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from sqlalchemy import String, Text, Integer, ForeignKey, JSON, Enum as SAEnum, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, TimestampMixin

class ApprovalStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"

class DocumentCategory(str, Enum):
    ACADEMIC = "academic"
    EXAMINATION = "examination"
    ADMISSIONS = "admissions"
    SCHOLARSHIPS = "scholarships"
    ADMINISTRATION = "administration"
    HOSTEL_TRANSPORT = "hostel_transport"
    STUDENT_WELFARE = "student_welfare"
    GENERAL = "general"

class LanguageCode(str, Enum):
    EN = "en"
    HI = "hi"
    KN = "kn"
    MULTILINGUAL = "multilingual"

class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default=DocumentCategory.GENERAL.value, index=True)
    source_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(32), default="pdf")
    language: Mapped[str] = mapped_column(String(16), default=LanguageCode.EN.value, index=True)
    version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    
    # Validity window
    effective_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    effective_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Governance & Approval
    approval_status: Mapped[str] = mapped_column(
        String(32),
        default=ApprovalStatus.PENDING_APPROVAL.value,
        index=True,
        nullable=False
    )
    approved_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Content metadata
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    total_pages: Mapped[int] = mapped_column(Integer, default=1)
    doc_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    # Relationship
    chunks: Mapped[List["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.chunk_index",
        lazy="selectin"
    )

class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    section_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    page_number: Mapped[int] = mapped_column(Integer, default=1)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(16), default=LanguageCode.EN.value)
    
    # Embedding stored as JSON for portable DB compatibility (SQLite / Postgres)
    # When deployed to Postgres with pgvector, an indexed vector column can be mirrored
    embedding: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    chunk_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    # Relationship
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")

    __table_args__ = (
        Index("idx_chunk_doc_idx", "document_id", "chunk_index", unique=True),
    )
