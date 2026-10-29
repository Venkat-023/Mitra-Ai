import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.models.base import Base
from backend.app.models.document import Document, DocumentChunk, ApprovalStatus, DocumentCategory, LanguageCode
from backend.app.models.conversation import Conversation, Message, AnswerabilityStatus, MessageRole
from backend.app.models.feedback import Feedback, FeedbackRating, FeedbackTag
from backend.app.models.audit import AuditLog
from backend.app.schemas.document import DocumentCreate, DocumentRead
from backend.app.schemas.chat import ChatRequest, ChatResponse, CitationItem

# Async SQLite engine for high-speed in-memory testing
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
async def test_document_and_chunks_lifecycle(test_session: AsyncSession):
    # 1. Create Document in PENDING_APPROVAL state
    doc = Document(
        title="RVITM Academic Calendar 2026-27",
        category=DocumentCategory.ACADEMIC.value,
        source_uri="https://rvitm.edu.in/documents/academic-calendar-2026.pdf",
        language=LanguageCode.EN.value,
        version="1.0.0",
        approval_status=ApprovalStatus.PENDING_APPROVAL.value
    )
    test_session.add(doc)
    await test_session.commit()
    await test_session.refresh(doc)

    assert doc.id is not None
    assert doc.approval_status == ApprovalStatus.PENDING_APPROVAL.value
    assert doc.is_active is True

    # 2. Add Chunks
    chunk1 = DocumentChunk(
        document_id=doc.id,
        chunk_index=0,
        section_title="CIE Schedule",
        page_number=1,
        content="First Continuous Internal Evaluation (CIE-1) will be held from September 15 to September 18.",
        token_count=18,
        embedding=[0.12, -0.45, 0.88]
    )
    chunk2 = DocumentChunk(
        document_id=doc.id,
        chunk_index=1,
        section_title="Attendance Regulations",
        page_number=2,
        content="Students must maintain minimum 85% attendance in each course as per VTU guidelines.",
        token_count=16,
        embedding=[0.05, 0.32, -0.19]
    )
    test_session.add_all([chunk1, chunk2])
    await test_session.commit()

    # 3. Verify relationship
    await test_session.refresh(doc)
    assert len(doc.chunks) == 2
    assert doc.chunks[0].section_title == "CIE Schedule"
    assert doc.chunks[1].embedding == [0.05, 0.32, -0.19]

    # 4. Approve document
    doc.approval_status = ApprovalStatus.APPROVED.value
    doc.approved_by = "dean_academics@rvitm.edu.in"
    doc.verified_at = datetime.now(timezone.utc)
    await test_session.commit()
    await test_session.refresh(doc)
    assert doc.approval_status == ApprovalStatus.APPROVED.value
    assert doc.approved_by == "dean_academics@rvitm.edu.in"

@pytest.mark.asyncio
async def test_conversation_and_citations(test_session: AsyncSession):
    conv = Conversation(
        session_id="sess_student_12345",
        title="Attendance Policy Query",
        preferred_language="kn"
    )
    test_session.add(conv)
    await test_session.commit()
    await test_session.refresh(conv)

    # Add user message
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER.value,
        content="Attendance eshtu irbeku?",
        query_language="kn-Latn",
        question_category="academic"
    )
    # Add assistant response with citations
    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT.value,
        content="ವಿಟಿಯು ನಿಯಮಗಳ ಪ್ರಕಾರ, ವಿದ್ಯಾರ್ಥಿಗಳು ಪ್ರತಿಯೊಂದು ವಿಷಯದಲ್ಲೂ ಕನಿಷ್ಠ 85% ಹಾಜರಾತಿಯನ್ನು ಹೊಂದಿರಬೇಕು.",
        response_language="kn",
        answerability_status=AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value,
        citations=[{
            "chunk_id": "chunk-101",
            "document_id": "doc-academic-vtu",
            "document_title": "RVITM VTU Academic Regulations",
            "page_number": 2,
            "section_title": "Attendance Requirement",
            "snippet": "Students must maintain minimum 85% attendance.",
            "relevance_score": 0.94
        }],
        suggested_followups=["ವೈದ್ಯಕೀಯ ರಜೆ ನಿಯಮಗಳೇನು?", "ಹಾಜರಾತಿ ಕೊರತೆಯಾದರೆ ಏನಾಗುತ್ತದೆ?"],
        retrieval_confidence=0.94,
        latency_ms=145.2
    )
    test_session.add_all([user_msg, assistant_msg])
    await test_session.commit()

    await test_session.refresh(conv)
    assert len(conv.messages) == 2
    assert conv.messages[1].role == "assistant"
    assert len(conv.messages[1].citations) == 1
    assert conv.messages[1].citations[0]["page_number"] == 2

    # Add feedback
    feedback = Feedback(
        conversation_id=conv.id,
        message_id=assistant_msg.id,
        rating=FeedbackRating.POSITIVE.value,
        feedback_tag=FeedbackTag.HELPFUL.value,
        comment="Accurate Kannada answer citing official VTU rule."
    )
    test_session.add(feedback)
    await test_session.commit()
    await test_session.refresh(assistant_msg)
    assert len(assistant_msg.feedbacks) == 1
    assert assistant_msg.feedbacks[0].rating == "positive"

@pytest.mark.asyncio
async def test_audit_log_tracking(test_session: AsyncSession):
    audit = AuditLog(
        action="DOCUMENT_APPROVED",
        actor="registrar@rvitm.edu.in",
        target_type="document",
        target_id="doc-999",
        details={"version": "1.0.0", "title": "Fee Structure Circular 2026-27"},
        ip_address="192.168.1.50"
    )
    test_session.add(audit)
    await test_session.commit()
    await test_session.refresh(audit)

    assert audit.id is not None
    assert audit.action == "DOCUMENT_APPROVED"
    assert audit.details["title"] == "Fee Structure Circular 2026-27"

def test_pydantic_schema_validation():
    # Test valid chat request
    req = ChatRequest(
        message="Attendance kitni honi chahiye?",
        preferred_language="hi"
    )
    assert req.preferred_language == "hi"

    # Test citation item
    citation = CitationItem(
        chunk_id="chk-1",
        document_id="doc-1",
        document_title="Attendance Policy",
        category="academic",
        section_title="VTU Clause 3.1",
        page_number=5,
        snippet="Minimum 85% attendance required",
        relevance_score=0.92
    )
    assert citation.page_number == 5

    # Test chat response model
    resp = ChatResponse(
        conversation_id="conv-1",
        message_id="msg-1",
        answer="You need 85% attendance.",
        citations=[citation]
    )
    assert len(resp.citations) == 1
    assert resp.citations[0].relevance_score == 0.92
