import re
from typing import List, Dict, Any
from pydantic import BaseModel

class NormalizedQuery(BaseModel):
    original_query: str
    cleaned_query: str
    search_keywords: List[str]
    detected_language: str
    primary_language: str
    is_transliterated: bool
    domain_synonyms: List[str]

class QueryNormalizer:
    """
    Normalizes trilingual and code-mixed queries for search retrieval,
    preserving institutional acronyms (VTU, CIE, SEE, SSP, NSP) while
    expanding colloquial Indic keywords.
    """

    # Term mapping for code-mixed / transliterated and Indic queries
    INDIC_SYNONYMS: Dict[str, List[str]] = {
        # Attendance
        "haajarathi": ["attendance", "presence", "percentage"],
        "upasthiti": ["attendance", "percentage"],
        "eshtu": ["percentage", "minimum", "requirement"],
        "kitni": ["percentage", "minimum", "requirement"],
        "irbeku": ["mandatory", "required"],
        "honi": ["mandatory", "required"],
        
        # Exams & CIE
        "parikshe": ["exam", "examination", "see", "cie", "schedule"],
        "pariksha": ["exam", "examination", "see", "cie", "schedule"],
        "madodu": ["submission", "procedure"],
        "jama": ["submission", "deposit"],
        "kahan": ["where", "counter", "office"],
        "elli": ["where", "counter", "office"],
        "yelli": ["where", "counter", "office"],
        "yavaga": ["date", "schedule", "calendar"],
        "kab": ["date", "schedule", "calendar"],

        # Bonafide & Certificates
        "bonafide": ["certificate", "bonafide", "study certificate", "counter 2"],
        "pramanapatra": ["certificate", "bonafide"],
        "daakhalegalu": ["documents", "enclosures"],

        # Scholarships
        "chhatravritti": ["scholarship", "ssp", "nsp", "concession"],
        "shishyavetana": ["scholarship", "ssp", "nsp", "concession"],
        "ssp": ["karnataka state scholarship portal", "ssp", "post-matric"],
        "nsp": ["national scholarship portal", "pragati", "central scheme"],

        # Contact & Leadership
        "yaru": ["contact", "hod", "head", "principal"],
        "kaun": ["contact", "hod", "head", "principal"],
        "samparka": ["contact", "directory", "phone", "email"]
    }

    # Protected acronyms that must not be altered
    PROTECTED_ACRONYMS = {
        "VTU", "CIE", "SEE", "SSP", "NSP", "RSST", "RVITM", "AICTE", "HOD", "USN", "BMTC", "IEEE", "IQAC"
    }

    def normalize(self, query: str, detected_language: str, primary_language: str, is_transliterated: bool) -> NormalizedQuery:
        trimmed = query.strip()
        # Clean redundant punctuation while keeping Indic danda ('।') handled
        cleaned = re.sub(r'[^\w\s\-\?\.\u0900-\u097F\u0C80-\u0CFF]', ' ', trimmed)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        # Extract tokens
        tokens = re.findall(r'[\w\-]+|[\u0900-\u097F]+|[\u0C80-\u0CFF]+', cleaned.lower())
        search_keywords = list(tokens)
        domain_synonyms: List[str] = []

        # Expand domain synonyms for code-mixed / transliterated queries
        for t in tokens:
            if t in self.INDIC_SYNONYMS:
                for syn in self.INDIC_SYNONYMS[t]:
                    if syn not in search_keywords:
                        domain_synonyms.append(syn)

        search_keywords.extend(domain_synonyms)

        return NormalizedQuery(
            original_query=trimmed,
            cleaned_query=cleaned,
            search_keywords=list(dict.fromkeys(search_keywords)),
            detected_language=detected_language,
            primary_language=primary_language,
            is_transliterated=is_transliterated,
            domain_synonyms=domain_synonyms
        )
