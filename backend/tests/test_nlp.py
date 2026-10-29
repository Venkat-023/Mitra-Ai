import pytest
from backend.app.services.nlp.service import MultilingualNLPService

@pytest.fixture
def nlp_service():
    return MultilingualNLPService()

def test_detect_english(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("What is the minimum attendance required as per VTU?")
    assert res.detected_language == "en"
    assert res.primary_language == "en"
    assert res.is_transliterated is False
    assert res.intent == "ATTENDANCE_REGULATIONS"
    assert res.category == "academic"

def test_detect_native_kannada(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("ಕಾಲೇಜಿನಲ್ಲಿ ಹಾಜರಾತಿ ಎಷ್ಟು ಇರಬೇಕು?")
    assert res.detected_language == "kn"
    assert res.primary_language == "kn"
    assert res.script == "Kannada"
    assert res.is_transliterated is False
    assert res.intent == "ATTENDANCE_REGULATIONS"

def test_detect_native_hindi(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("आरवीआईटीएम में उपस्थिति कितनी होनी चाहिए?")
    assert res.detected_language == "hi"
    assert res.primary_language == "hi"
    assert res.script == "Devanagari"
    assert res.is_transliterated is False
    assert res.intent == "ATTENDANCE_REGULATIONS"

def test_transliterated_kannada(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("Attendance eshtu irbeku?")
    assert res.detected_language == "kn-Latn"
    assert res.primary_language == "kn"
    assert res.is_transliterated is True
    assert res.intent == "ATTENDANCE_REGULATIONS"
    assert "attendance" in res.search_keywords
    assert "percentage" in res.search_keywords

def test_transliterated_hindi(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("Attendance kitni honi chahiye?")
    assert res.detected_language == "hi-Latn"
    assert res.primary_language == "hi"
    assert res.is_transliterated is True
    assert res.intent == "ATTENDANCE_REGULATIONS"

def test_code_mixed_kannada_exam_form(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("Exam form submit madodu elli?")
    assert res.primary_language == "kn"
    assert res.is_transliterated is True
    assert res.intent in ["EXAM_AND_CIE_SCHEDULE", "BONAFIDE_CERTIFICATE"]
    # Verify domain synonyms expanded
    assert "submission" in res.search_keywords
    assert "counter" in res.search_keywords or "exam" in res.search_keywords

def test_department_entity_extraction(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("Who is the HOD of CSE department?")
    assert res.intent == "DEPARTMENT_CONTACTS"
    assert res.entities.get("department") == "CSE"
    assert res.entities.get("role") == "hod"

def test_ambiguous_query_detection(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("fees")
    assert res.is_ambiguous is True
    assert res.clarification_question is not None

def test_out_of_scope_detection(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("What is the weather forecast for Bengaluru tomorrow?")
    assert res.is_out_of_scope is True
    assert "RVITM Mitra AI" in res.clarification_question

def test_explicit_language_override(nlp_service: MultilingualNLPService):
    res = nlp_service.process_query("How to apply for bonafide certificate?", explicit_language="kn")
    assert res.primary_language == "kn"
    assert res.detected_language == "kn"
