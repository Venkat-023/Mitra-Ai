from typing import Optional
from pydantic import BaseModel
from backend.app.services.nlp.language_detector import LanguageDetector, LanguageDetectionResult
from backend.app.services.nlp.query_normalizer import QueryNormalizer, NormalizedQuery
from backend.app.services.nlp.intent_extractor import IntentExtractor, IntentExtractionResult

class ProcessedQuery(BaseModel):
    original_query: str
    cleaned_query: str
    detected_language: str
    primary_language: str
    is_transliterated: bool
    script: str
    search_keywords: list[str]
    intent: str
    category: str
    entities: dict
    is_ambiguous: bool
    is_out_of_scope: bool
    clarification_question: Optional[str] = None

class MultilingualNLPService:
    def __init__(self):
        self.detector = LanguageDetector()
        self.normalizer = QueryNormalizer()
        self.intent_extractor = IntentExtractor()

    def process_query(self, query: str, explicit_language: Optional[str] = None) -> ProcessedQuery:
        # 1. Language & Script Detection
        lang_res: LanguageDetectionResult = self.detector.detect(query, explicit_language)

        # 2. Query Normalization & Indic synonym expansion
        norm_res: NormalizedQuery = self.normalizer.normalize(
            query=query,
            detected_language=lang_res.detected_language,
            primary_language=lang_res.primary_language,
            is_transliterated=lang_res.is_transliterated
        )

        # 3. Intent, Entity & Ambiguity Extraction
        intent_res: IntentExtractionResult = self.intent_extractor.extract(
            query=query,
            primary_language=lang_res.primary_language
        )

        return ProcessedQuery(
            original_query=query,
            cleaned_query=norm_res.cleaned_query,
            detected_language=lang_res.detected_language,
            primary_language=lang_res.primary_language,
            is_transliterated=lang_res.is_transliterated,
            script=lang_res.script,
            search_keywords=norm_res.search_keywords,
            intent=intent_res.intent,
            category=intent_res.category,
            entities=intent_res.entities,
            is_ambiguous=intent_res.is_ambiguous,
            is_out_of_scope=intent_res.is_out_of_scope,
            clarification_question=intent_res.clarification_question
        )
