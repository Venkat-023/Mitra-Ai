import re
from typing import Tuple, Optional
from pydantic import BaseModel

class LanguageDetectionResult(BaseModel):
    detected_language: str  # "en", "hi", "kn", "hi-Latn", "kn-Latn"
    primary_language: str   # Normalized to "en", "hi", or "kn"
    script: str             # "Kannada", "Devanagari", "Latin"
    is_transliterated: bool
    confidence: float

class LanguageDetector:
    """
    Detects language and script across English, Hindi, and Kannada,
    including Latin transliteration (Romanized Indic) and code-mixed queries.
    """

    KANNADA_KEYWORDS = {
        "eshtu", "irbeku", "madodu", "elli", "yelli", "beku", "yavaga", "aguthe", 
        "bekagide", "haajarathi", "parikshe", "shulka", "yaru", "enadru", "namage",
        "adre", "hege", "yaake", "kodthare", "padedhukolluvudu", "vidyarthi"
    }

    HINDI_KEYWORDS = {
        "kitni", "kitna", "chahiye", "honi", "hona", "kahan", "kaise", "karein", "kab",
        "hoga", "shuru", "milta", "rahega", "kya", "kyu", "puchna", "chhatravritti",
        "pariksha", "upasthiti", "form", "bhejna", "jama", "karna", "hai", "kaun"
    }

    def detect(self, text: str, explicit_preference: Optional[str] = None) -> LanguageDetectionResult:
        if explicit_preference and explicit_preference.lower() in ["en", "hi", "kn"]:
            pref = explicit_preference.lower()
            return LanguageDetectionResult(
                detected_language=pref,
                primary_language=pref,
                script="Explicit",
                is_transliterated=False,
                confidence=1.0
            )

        trimmed = text.strip()
        if not trimmed:
            return LanguageDetectionResult(
                detected_language="en",
                primary_language="en",
                script="Latin",
                is_transliterated=False,
                confidence=0.5
            )

        # 1. Unicode Script Counting
        kannada_chars = len(re.findall(r'[\u0C80-\u0CFF]', trimmed))
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', trimmed))
        latin_chars = len(re.findall(r'[A-Za-z]', trimmed))
        total_chars = max(len(trimmed.replace(" ", "")), 1)

        # Check native Kannada
        if kannada_chars / total_chars >= 0.20:
            return LanguageDetectionResult(
                detected_language="kn",
                primary_language="kn",
                script="Kannada",
                is_transliterated=False,
                confidence=min(0.7 + (kannada_chars / total_chars) * 0.3, 0.99)
            )

        # Check native Devanagari (Hindi)
        if devanagari_chars / total_chars >= 0.20:
            return LanguageDetectionResult(
                detected_language="hi",
                primary_language="hi",
                script="Devanagari",
                is_transliterated=False,
                confidence=min(0.7 + (devanagari_chars / total_chars) * 0.3, 0.99)
            )

        # 2. Latin Script Analysis (English vs. Transliterated Indic)
        words = set(re.findall(r'[a-zA-Z]+', trimmed.lower()))
        kn_matches = words.intersection(self.KANNADA_KEYWORDS)
        hi_matches = words.intersection(self.HINDI_KEYWORDS)

        if len(kn_matches) > 0 and len(kn_matches) >= len(hi_matches):
            return LanguageDetectionResult(
                detected_language="kn-Latn",
                primary_language="kn",
                script="Latin",
                is_transliterated=True,
                confidence=0.85
            )

        if len(hi_matches) > 0:
            return LanguageDetectionResult(
                detected_language="hi-Latn",
                primary_language="hi",
                script="Latin",
                is_transliterated=True,
                confidence=0.85
            )

        # Default to English
        return LanguageDetectionResult(
            detected_language="en",
            primary_language="en",
            script="Latin",
            is_transliterated=False,
            confidence=0.90
        )
