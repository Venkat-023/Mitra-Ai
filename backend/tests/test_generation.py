import pytest
from backend.app.services.nlp.service import MultilingualNLPService
from backend.app.services.retrieval.base import RetrievalResult, RetrievedChunk
from backend.app.services.generation.answer_service import AnswerGenerationService
from backend.app.services.generation.mock_provider import MockLLMProvider
from backend.app.models.conversation import AnswerabilityStatus

@pytest.fixture
def nlp_service():
    return MultilingualNLPService()

@pytest.fixture
def answer_service():
    return AnswerGenerationService(provider=MockLLMProvider())

@pytest.mark.asyncio
async def test_grounded_answer_with_citations(nlp_service: MultilingualNLPService, answer_service: AnswerGenerationService):
    query = nlp_service.process_query("What is the attendance requirement?")
    
    # Mock grounded retrieval result
    chunk = RetrievedChunk(
        chunk_id="chk-100",
        document_id="doc-academic-vtu",
        title="RVITM VTU Academic Regulations",
        page_number=2,
        section_title="VTU Attendance Regulations (Clause 8.1)",
        content="Students must maintain minimum aggregate attendance of 85% in each course.",
        source_uri="https://rvitm.edu.in/attendance.pdf",
        version="1.0.0",
        category="academic",
        final_score=0.92,
        semantic_score=0.88,
        rrf_score=0.03
    )
    retrieval = RetrievalResult(
        query=query.original_query,
        total_candidates=1,
        top_chunks=[chunk],
        max_score=0.92,
        is_grounded=True
    )

    resp = await answer_service.generate_answer(query, retrieval)
    assert resp.status == AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value
    assert len(resp.citations) == 1
    assert resp.citations[0].document_title == "RVITM VTU Academic Regulations"
    assert resp.citations[0].page_number == 2
    assert "85%" in resp.answer
    assert resp.needs_clarification is False

@pytest.mark.asyncio
async def test_calibrated_abstention_on_insufficient_evidence(nlp_service: MultilingualNLPService, answer_service: AnswerGenerationService):
    query = nlp_service.process_query("What is the fee for robotics club membership?")
    
    # Un-grounded retrieval result (empty or below threshold)
    retrieval = RetrievalResult(
        query=query.original_query,
        total_candidates=0,
        top_chunks=[],
        max_score=0.12,
        is_grounded=False
    )

    resp = await answer_service.generate_answer(query, retrieval)
    assert resp.status == AnswerabilityStatus.INSUFFICIENT_EVIDENCE.value
    assert len(resp.citations) == 0
    assert "insufficient" in resp.answer.lower() or "do not have" in resp.answer.lower()
    assert len(resp.suggested_followups) > 0

@pytest.mark.asyncio
async def test_kannada_transliterated_grounded_answer(nlp_service: MultilingualNLPService, answer_service: AnswerGenerationService):
    query = nlp_service.process_query("Attendance eshtu irbeku?")
    assert query.primary_language == "kn"
    
    chunk = RetrievedChunk(
        chunk_id="chk-100",
        document_id="doc-academic-vtu",
        title="RVITM VTU Academic Regulations",
        page_number=2,
        section_title="ಹಾಜರಾತಿ ನಿಯಮಗಳು",
        content="ವಿದ್ಯಾರ್ಥಿಗಳು ಕನಿಷ್ಠ 85% ಹಾಜರಾತಿಯನ್ನು ಹೊಂದಿರುವುದು ಕಡ್ಡಾಯ.",
        source_uri="https://rvitm.edu.in/attendance.pdf",
        version="1.0.0",
        category="academic",
        final_score=0.95,
        is_grounded=True
    )
    retrieval = RetrievalResult(
        query=query.original_query,
        total_candidates=1,
        top_chunks=[chunk],
        max_score=0.95,
        is_grounded=True
    )

    resp = await answer_service.generate_answer(query, retrieval)
    assert resp.language == "kn"
    assert resp.status == AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value
    assert len(resp.citations) == 1
    assert "85%" in resp.answer

@pytest.mark.asyncio
async def test_ambiguous_query_flow(nlp_service: MultilingualNLPService, answer_service: AnswerGenerationService):
    query = nlp_service.process_query("form")
    assert query.is_ambiguous is True

    retrieval = RetrievalResult(query="form", total_candidates=0, top_chunks=[], max_score=0.0, is_grounded=False)
    resp = await answer_service.generate_answer(query, retrieval)
    assert resp.status == AnswerabilityStatus.CLARIFICATION_NEEDED.value
    assert resp.needs_clarification is True
    assert resp.clarification_prompt is not None
