import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from backend.app.models.base import Base
from backend.app.models.document import Document, DocumentChunk, ApprovalStatus
from backend.app.services.ingestion.parser import DocumentParser
from backend.app.services.ingestion.chunker import SemanticChunker
from backend.app.services.ingestion.pipeline import IngestionPipeline

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def test_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

def test_parser_markdown_sections():
    parser = DocumentParser()
    sample_md = """# College Regulations
## Section 1: Attendance
Students must attend 85% of classes.
## Section 2: Exams
Midterm exams are mandatory.
"""
    doc = parser.parse_bytes(sample_md.encode("utf-8"), "regulations.md")
    assert doc.title == "College Regulations"
    assert doc.file_type == "markdown"
    assert doc.total_pages == 1
    assert len(doc.pages[0].sections) == 2
    assert doc.pages[0].sections[0].section_title == "Section 1: Attendance"
    assert "85%" in doc.pages[0].sections[0].content

def test_parser_empty_document_error():
    parser = DocumentParser()
    with pytest.raises(ValueError, match="empty"):
        parser.parse_bytes(b"", "empty.txt")

def test_parser_unsupported_format_error():
    parser = DocumentParser()
    with pytest.raises(ValueError, match="Unsupported document format"):
        parser.parse_bytes(b"content", "file.exe")

def test_semantic_chunker_preserves_metadata():
    parser = DocumentParser()
    sample = """# RVITM Handbook
## 1. Attendance Policy
Students must have 85% attendance. Any absence requires medical certificates submitted within three days.
## 2. Fee Structure
Tuition fees must be paid prior to semester registration. Late fee is Rs 100 per day.
"""
    parsed = parser.parse_bytes(sample.encode("utf-8"), "handbook.md")
    chunker = SemanticChunker(target_chunk_size=100, overlap=20)
    chunks = chunker.chunk_document(parsed)

    assert len(chunks) >= 2
    assert chunks[0].section_title == "1. Attendance Policy"
    assert chunks[0].page_number == 1
    assert chunks[0].token_count > 0

@pytest.mark.asyncio
async def test_ingestion_pipeline_lifecycle(test_session: AsyncSession):
    pipeline = IngestionPipeline()
    sample_content = b"""# RVITM Bonafide Procedure
## Application Steps
Step 1: Download form from ERP portal.
Step 2: Submit to Counter 2 with student ID card copy.
Processing time is 2-3 working days.
"""
    # 1. Ingest document in pending state
    doc = await pipeline.ingest_document(
        session=test_session,
        content_bytes=sample_content,
        filename="bonafide.md",
        category="administration",
        version="1.0.0",
        auto_approve=False,
        actor="admin@rvitm.edu.in"
    )

    assert doc.id is not None
    assert doc.approval_status == ApprovalStatus.PENDING_APPROVAL.value
    assert len(doc.chunks) >= 1
    assert doc.chunks[0].embedding is not None
    assert len(doc.chunks[0].embedding) == 384

    # 2. Duplicate upload with same version should be rejected
    with pytest.raises(ValueError, match="Duplicate document detected"):
        await pipeline.ingest_document(
            session=test_session,
            content_bytes=sample_content,
            filename="bonafide.md",
            version="1.0.0"
        )

    # 3. New version of same document should supersede previous version
    updated_content = sample_content + b"\nNote: Processing fee is waived."
    doc_v2 = await pipeline.ingest_document(
        session=test_session,
        content_bytes=updated_content,
        filename="bonafide_v2.md",
        title_override=doc.title,
        version="2.0.0",
        auto_approve=True
    )
    assert doc_v2.version == "2.0.0"
    assert doc_v2.approval_status == ApprovalStatus.APPROVED.value

    # Verify previous version is superseded
    prev_doc_res = await test_session.execute(select(Document).where(Document.id == doc.id))
    prev_doc = prev_doc_res.scalars().first()
    assert prev_doc.approval_status == ApprovalStatus.SUPERSEDED.value
    assert prev_doc.is_active is False

    # 4. Re-index document
    reindexed_doc = await pipeline.reindex_document(test_session, doc_v2.id)
    assert reindexed_doc.id == doc_v2.id
