import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.models.base import Base
from backend.app.models.document import Document, DocumentChunk, ApprovalStatus
from backend.app.services.retrieval.hybrid_retriever import HybridRetriever
from backend.app.services.retrieval.metrics import RetrievalMetrics
from backend.app.services.embedding.factory import get_embedding_provider

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

@pytest.mark.asyncio
async def test_retrieval_governance_filters_unapproved_and_expired(test_session: AsyncSession):
    retriever = HybridRetriever()
    embedding_provider = get_embedding_provider()
    now = datetime.now(timezone.utc)

    # 1. Approved & Active Document
    doc_approved = Document(
        title="RVITM Official VTU Attendance Policy",
        category="academic",
        source_uri="https://rvitm.edu.in/attendance",
        approval_status=ApprovalStatus.APPROVED.value,
        effective_from=now - timedelta(days=10),
        effective_until=now + timedelta(days=300),
        is_active=True
    )
    test_session.add(doc_approved)
    await test_session.flush()

    emb1 = await embedding_provider.embed_texts(["Students must maintain 85% attendance as per VTU."])
    chunk_approved = DocumentChunk(
        document_id=doc_approved.id,
        chunk_index=0,
        section_title="Attendance Clause",
        content="Students must maintain 85% attendance as per VTU regulations.",
        embedding=emb1[0]
    )
    test_session.add(chunk_approved)

    # 2. Unapproved Document (Pending)
    doc_pending = Document(
        title="Unverified Draft Attendance Rule",
        category="academic",
        source_uri="https://rvitm.edu.in/draft",
        approval_status=ApprovalStatus.PENDING_APPROVAL.value,
        is_active=True
    )
    test_session.add(doc_pending)
    await test_session.flush()

    emb2 = await embedding_provider.embed_texts(["Attendance can be 60% only for sports students."])
    chunk_pending = DocumentChunk(
        document_id=doc_pending.id,
        chunk_index=0,
        section_title="Unverified Clause",
        content="Attendance can be 60% only for sports students.",
        embedding=emb2[0]
    )
    test_session.add(chunk_pending)

    # 3. Expired Document
    doc_expired = Document(
        title="Old Expired Calendar 2023",
        category="academic",
        source_uri="https://rvitm.edu.in/old",
        approval_status=ApprovalStatus.APPROVED.value,
        effective_from=now - timedelta(days=400),
        effective_until=now - timedelta(days=50),
        is_active=True
    )
    test_session.add(doc_expired)
    await test_session.flush()

    emb3 = await embedding_provider.embed_texts(["Old classes commence on August 1 2023."])
    chunk_expired = DocumentChunk(
        document_id=doc_expired.id,
        chunk_index=0,
        section_title="Old Dates",
        content="Old classes commence on August 1 2023.",
        embedding=emb3[0]
    )
    test_session.add(chunk_expired)
    await test_session.commit()

    # Query for attendance
    result = await retriever.retrieve(
        session=test_session,
        query="What is the attendance requirement?",
        search_keywords=["attendance", "vtu", "requirement"]
    )

    # Governance Verification
    retrieved_doc_ids = [c.document_id for c in result.top_chunks]
    assert doc_approved.id in retrieved_doc_ids
    assert doc_pending.id not in retrieved_doc_ids, "Unapproved document MUST NEVER be retrieved!"
    assert doc_expired.id not in retrieved_doc_ids, "Expired document MUST NEVER be retrieved!"

def test_retrieval_evaluation_metrics():
    retrieved_chunk_ids = ["chunk-1", "chunk-2", "chunk-3", "chunk-4", "chunk-5"]
    ground_truth_relevant = {"chunk-1", "chunk-4"}

    r_at_3 = RetrievalMetrics.recall_at_k(retrieved_chunk_ids, ground_truth_relevant, k=3)
    assert r_at_3 == 0.5  # Only chunk-1 in top 3 out of 2 relevant

    r_at_5 = RetrievalMetrics.recall_at_k(retrieved_chunk_ids, ground_truth_relevant, k=5)
    assert r_at_5 == 1.0  # Both chunk-1 and chunk-4 in top 5

    mrr = RetrievalMetrics.mean_reciprocal_rank(retrieved_chunk_ids, ground_truth_relevant)
    assert mrr == 1.0  # First match is at rank 1 (1/1)

    ndcg_5 = RetrievalMetrics.ndcg_at_k(retrieved_chunk_ids, ground_truth_relevant, k=5)
    assert ndcg_5 > 0.8
