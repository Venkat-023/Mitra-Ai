import hashlib
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from backend.app.models.document import Document, DocumentChunk, ApprovalStatus, DocumentCategory, LanguageCode
from backend.app.models.audit import AuditLog
from backend.app.services.ingestion.parser import DocumentParser, ParsedDocument
from backend.app.services.ingestion.chunker import SemanticChunker
from backend.app.services.embedding.factory import get_embedding_provider
from backend.app.core.config import settings

class IngestionPipeline:
    def __init__(self, parser: Optional[DocumentParser] = None, chunker: Optional[SemanticChunker] = None):
        self.parser = parser or DocumentParser()
        self.chunker = chunker or SemanticChunker()
        self.embedding_provider = get_embedding_provider()

    @staticmethod
    def compute_checksum(content_bytes: bytes) -> str:
        return hashlib.sha256(content_bytes).hexdigest()

    async def ingest_document(
        self,
        session: AsyncSession,
        content_bytes: bytes,
        filename: str,
        category: str = DocumentCategory.GENERAL.value,
        title_override: Optional[str] = None,
        source_uri: Optional[str] = None,
        version: str = "1.0.0",
        effective_from: Optional[datetime] = None,
        effective_until: Optional[datetime] = None,
        auto_approve: bool = False,
        actor: str = "system"
    ) -> Document:
        # 1. Validation: Size check (max 25MB)
        if len(content_bytes) > 25 * 1024 * 1024:
            raise ValueError("File exceeds maximum allowable size of 25MB.")
        if len(content_bytes) == 0:
            raise ValueError("File is empty (0 bytes).")

        # 2. Checksum and Duplicate Detection
        checksum = self.compute_checksum(content_bytes)
        existing_doc_res = await session.execute(
            select(Document).where(Document.checksum == checksum, Document.is_active == True)
        )
        existing_doc = existing_doc_res.scalars().first()
        if existing_doc:
            if existing_doc.version == version:
                raise ValueError(f"Duplicate document detected: '{existing_doc.title}' (ID: {existing_doc.id}) with identical checksum and version {version}.")

        # 3. Parse Document Structure
        parsed_doc: ParsedDocument = self.parser.parse_bytes(content_bytes, filename)
        final_title = title_override or parsed_doc.title
        uri = source_uri or f"file://uploads/{filename}"

        # 4. Handle Superseded Versions with same title
        same_title_res = await session.execute(
            select(Document).where(Document.title == final_title, Document.is_active == True)
        )
        for prev_doc in same_title_res.scalars().all():
            prev_doc.approval_status = ApprovalStatus.SUPERSEDED.value
            prev_doc.is_active = False

        # 5. Semantic Chunking
        chunk_results = self.chunker.chunk_document(parsed_doc)
        if not chunk_results:
            raise ValueError("Document parsed but produced zero readable chunks.")

        # 6. Generate Multilingual Embeddings
        chunk_texts = [c.content for c in chunk_results]
        embeddings = await self.embedding_provider.embed_texts(chunk_texts)

        # 7. Create Document record in PENDING_APPROVAL state (or approved if auto_approve)
        status = ApprovalStatus.APPROVED.value if auto_approve else ApprovalStatus.PENDING_APPROVAL.value
        doc = Document(
            title=final_title,
            category=category,
            source_uri=uri,
            file_type=parsed_doc.file_type,
            language=parsed_doc.detected_language,
            version=version,
            effective_from=effective_from or datetime.now(timezone.utc),
            effective_until=effective_until,
            approval_status=status,
            approved_by=actor if auto_approve else None,
            verified_at=datetime.now(timezone.utc) if auto_approve else None,
            checksum=checksum,
            total_pages=parsed_doc.total_pages,
            doc_metadata={
                "is_scanned": parsed_doc.is_scanned,
                "original_filename": filename,
                "chunk_count": len(chunk_results),
                "embedding_model": settings.EMBEDDING_MODEL
            }
        )
        session.add(doc)
        await session.flush()

        # 8. Add Chunks
        for idx, (chunk_res, emb) in enumerate(zip(chunk_results, embeddings)):
            chunk_record = DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk_res.chunk_index,
                section_title=chunk_res.section_title,
                page_number=chunk_res.page_number,
                content=chunk_res.content,
                language=chunk_res.language,
                embedding=emb,
                token_count=chunk_res.token_count,
                chunk_metadata={"section": chunk_res.section_title}
            )
            session.add(chunk_record)

        # 9. Audit Log
        audit = AuditLog(
            action="DOCUMENT_UPLOAD",
            actor=actor,
            target_type="document",
            target_id=doc.id,
            details={
                "title": final_title,
                "version": version,
                "chunks": len(chunk_results),
                "status": status
            }
        )
        session.add(audit)
        await session.commit()
        await session.refresh(doc)
        return doc

    async def reindex_document(self, session: AsyncSession, document_id: str, actor: str = "system") -> Document:
        """Re-chunks and re-embeds an existing document."""
        doc_res = await session.execute(select(Document).where(Document.id == document_id))
        doc = doc_res.scalars().first()
        if not doc:
            raise ValueError(f"Document {document_id} not found.")

        # Re-fetch chunks content
        chunks_res = await session.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
        )
        existing_chunks = chunks_res.scalars().all()
        texts = [c.content for c in existing_chunks]

        # Generate fresh embeddings
        embeddings = await self.embedding_provider.embed_texts(texts)
        for chunk, emb in zip(existing_chunks, embeddings):
            chunk.embedding = emb

        audit = AuditLog(
            action="DOCUMENT_REINDEXED",
            actor=actor,
            target_type="document",
            target_id=doc.id,
            details={"chunk_count": len(existing_chunks)}
        )
        session.add(audit)
        await session.commit()
        await session.refresh(doc)
        return doc
