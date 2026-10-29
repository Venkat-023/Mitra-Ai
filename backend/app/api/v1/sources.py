from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.schemas.document import DocumentDetailRead
from backend.app.models.document import Document

router = APIRouter(tags=["Sources"])

@router.get("/sources/{source_id}", response_model=DocumentDetailRead)
async def get_source_details(source_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.id == source_id)
    res = await db.execute(stmt)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source document with ID '{source_id}' was not found or is restricted."
        )

    # Convert chunks to read model
    chunk_reads = [
        {
            "id": c.id,
            "document_id": c.document_id,
            "chunk_index": c.chunk_index,
            "section_title": c.section_title,
            "page_number": c.page_number,
            "content": c.content,
            "language": c.language,
            "token_count": c.token_count,
            "chunk_metadata": c.chunk_metadata,
            "created_at": c.created_at
        }
        for c in doc.chunks
    ]

    return DocumentDetailRead(
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
        chunk_count=len(doc.chunks),
        chunks=chunk_reads
    )
