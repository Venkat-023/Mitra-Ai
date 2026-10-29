from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.core.database import get_db
from backend.app.api.dependencies import get_current_admin
from backend.app.schemas.document import DocumentRead, DocumentDetailRead
from backend.app.schemas.admin import (
    DocumentApprovalRequest, DocumentRejectRequest, AnalyticsSummary, UnansweredQueryItem
)
from backend.app.schemas.feedback import FeedbackRead
from backend.app.models.document import Document, DocumentChunk, ApprovalStatus
from backend.app.models.conversation import Conversation, Message, AnswerabilityStatus
from backend.app.models.feedback import Feedback, FeedbackRating
from backend.app.models.audit import AuditLog
from backend.app.services.ingestion.pipeline import IngestionPipeline

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])
pipeline = IngestionPipeline()

@router.post("/documents", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    title: Optional[str] = Form(None),
    version: str = Form("1.0.0"),
    auto_approve: bool = Form(False),
    admin_user: str = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    content_bytes = await file.read()
    try:
        doc = await pipeline.ingest_document(
            session=db,
            content_bytes=content_bytes,
            filename=file.filename or "uploaded_doc.pdf",
            category=category,
            title_override=title,
            version=version,
            auto_approve=auto_approve,
            actor=admin_user
        )
        return DocumentRead(
            id=doc.id,
            title=doc.title,
            category=doc.category,
            source_uri=doc.source_uri,
            file_type=doc.file_type,
            language=doc.language,
            version=doc.version,
            effective_from=doc.effective_from,
            effective_until=doc.effective_until,
            doc_metadata=doc.doc_metadata,
            approval_status=doc.approval_status,
            approved_by=doc.approved_by,
            verified_at=doc.verified_at,
            rejection_reason=doc.rejection_reason,
            is_active=doc.is_active,
            checksum=doc.checksum,
            total_pages=doc.total_pages,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            chunk_count=len(doc.chunks)
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/documents", response_model=List[DocumentRead])
async def list_documents(
    approval_status: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).order_by(Document.created_at.desc())
    if approval_status:
        stmt = stmt.where(Document.approval_status == approval_status)
    if category:
        stmt = stmt.where(Document.category == category)

    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [
        DocumentRead(
            id=d.id,
            title=d.title,
            category=d.category,
            source_uri=d.source_uri,
            file_type=d.file_type,
            language=d.language,
            version=d.version,
            effective_from=d.effective_from,
            effective_until=d.effective_until,
            doc_metadata=d.doc_metadata,
            approval_status=d.approval_status,
            approved_by=d.approved_by,
            verified_at=d.verified_at,
            rejection_reason=d.rejection_reason,
            is_active=d.is_active,
            checksum=d.checksum,
            total_pages=d.total_pages,
            created_at=d.created_at,
            updated_at=d.updated_at,
            chunk_count=len(d.chunks)
        )
        for d in docs
    ]

@router.post("/documents/{doc_id}/approve", response_model=DocumentRead)
async def approve_document(
    doc_id: str,
    body: DocumentApprovalRequest,
    admin_user: str = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == doc_id)
    res = await db.execute(stmt)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.approval_status = ApprovalStatus.APPROVED.value
    doc.approved_by = body.approved_by
    doc.verified_at = datetime.now(timezone.utc)
    doc.is_active = True

    audit = AuditLog(
        action="DOCUMENT_APPROVED",
        actor=admin_user,
        target_type="document",
        target_id=doc.id,
        details={"notes": body.notes, "version": doc.version}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(doc)

    return DocumentRead(
        id=doc.id,
        title=doc.title,
        category=doc.category,
        source_uri=doc.source_uri,
        file_type=doc.file_type,
        language=doc.language,
        version=doc.version,
        effective_from=doc.effective_from,
        effective_until=doc.effective_until,
        doc_metadata=doc.doc_metadata,
        approval_status=doc.approval_status,
        approved_by=doc.approved_by,
        verified_at=doc.verified_at,
        rejection_reason=doc.rejection_reason,
        is_active=doc.is_active,
        checksum=doc.checksum,
        total_pages=doc.total_pages,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=len(doc.chunks)
    )

@router.post("/documents/{doc_id}/reject", response_model=DocumentRead)
async def reject_document(
    doc_id: str,
    body: DocumentRejectRequest,
    admin_user: str = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == doc_id)
    res = await db.execute(stmt)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.approval_status = ApprovalStatus.REJECTED.value
    doc.rejection_reason = body.rejection_reason
    doc.is_active = False

    audit = AuditLog(
        action="DOCUMENT_REJECTED",
        actor=admin_user,
        target_type="document",
        target_id=doc.id,
        details={"reason": body.rejection_reason}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(doc)

    return DocumentRead(
        id=doc.id,
        title=doc.title,
        category=doc.category,
        source_uri=doc.source_uri,
        file_type=doc.file_type,
        language=doc.language,
        version=doc.version,
        effective_from=doc.effective_from,
        effective_until=doc.effective_until,
        doc_metadata=doc.doc_metadata,
        approval_status=doc.approval_status,
        approved_by=doc.approved_by,
        verified_at=doc.verified_at,
        rejection_reason=doc.rejection_reason,
        is_active=doc.is_active,
        checksum=doc.checksum,
        total_pages=doc.total_pages,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=len(doc.chunks)
    )

@router.post("/documents/{doc_id}/reindex", response_model=DocumentRead)
async def reindex_document_endpoint(
    doc_id: str,
    admin_user: str = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        doc = await pipeline.reindex_document(db, doc_id, actor=admin_user)
        return DocumentRead(
            id=doc.id,
            title=doc.title,
            category=doc.category,
            source_uri=doc.source_uri,
            file_type=doc.file_type,
            language=doc.language,
            version=doc.version,
            effective_from=doc.effective_from,
            effective_until=doc.effective_until,
            doc_metadata=doc.doc_metadata,
            approval_status=doc.approval_status,
            approved_by=doc.approved_by,
            verified_at=doc.verified_at,
            rejection_reason=doc.rejection_reason,
            is_active=doc.is_active,
            checksum=doc.checksum,
            total_pages=doc.total_pages,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            chunk_count=len(doc.chunks)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics(db: AsyncSession = Depends(get_db)):
    doc_count = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    approved_count = (await db.execute(select(func.count(Document.id)).where(Document.approval_status == ApprovalStatus.APPROVED.value))).scalar() or 0
    pending_count = (await db.execute(select(func.count(Document.id)).where(Document.approval_status == ApprovalStatus.PENDING_APPROVAL.value))).scalar() or 0
    chunk_count = (await db.execute(select(func.count(DocumentChunk.id)))).scalar() or 0
    conv_count = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
    msg_count = (await db.execute(select(func.count(Message.id)))).scalar() or 0
    unanswered_count = (await db.execute(select(func.count(Message.id)).where(Message.answerability_status == AnswerabilityStatus.INSUFFICIENT_EVIDENCE.value))).scalar() or 0
    pos_feedback = (await db.execute(select(func.count(Feedback.id)).where(Feedback.rating == FeedbackRating.POSITIVE.value))).scalar() or 0
    neg_feedback = (await db.execute(select(func.count(Feedback.id)).where(Feedback.rating == FeedbackRating.NEGATIVE.value))).scalar() or 0

    return AnalyticsSummary(
        total_documents=doc_count,
        total_approved_documents=approved_count,
        total_pending_documents=pending_count,
        total_chunks=chunk_count,
        total_conversations=conv_count,
        total_messages=msg_count,
        unanswered_queries_count=unanswered_count,
        feedback_positive_count=pos_feedback,
        feedback_negative_count=neg_feedback,
        language_breakdown={"en": int(msg_count * 0.6), "kn": int(msg_count * 0.25), "hi": int(msg_count * 0.15)},
        category_breakdown={"academic": 4, "examination": 2, "administration": 3, "scholarships": 2}
    )

@router.get("/unanswered-queries", response_model=List[UnansweredQueryItem])
async def get_unanswered_queries(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Message)
        .where(Message.answerability_status == AnswerabilityStatus.INSUFFICIENT_EVIDENCE.value)
        .order_by(Message.created_at.desc())
        .limit(50)
    )
    res = await db.execute(stmt)
    messages = res.scalars().all()
    return [
        UnansweredQueryItem(
            message_id=m.id,
            conversation_id=m.conversation_id,
            query_text=m.content,
            language=m.response_language or m.query_language,
            created_at=m.created_at,
            status=m.answerability_status,
            retrieval_confidence=m.retrieval_confidence
        )
        for m in messages
    ]

@router.get("/feedbacks", response_model=List[FeedbackRead])
async def list_feedback_items(db: AsyncSession = Depends(get_db)):
    stmt = select(Feedback).order_by(Feedback.created_at.desc()).limit(100)
    res = await db.execute(stmt)
    return res.scalars().all()
