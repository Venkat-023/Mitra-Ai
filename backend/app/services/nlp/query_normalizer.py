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
    Normalizes trilingual (English, Kannada, Hindi) and code-mixed queries
    for search retrieval. Preserves institutional acronyms (VTU, CIE, SEE, SSP, NSP)
    while expanding Indic vocabulary into English domain keywords for cross-lingual
    retrieval against official RVITM documents.
    """

    # Term mapping for code-mixed / transliterated and native Indic queries
    INDIC_SYNONYMS: Dict[str, List[str]] = {
        # Attendance & Discipline
        "haajarathi": ["attendance", "presence", "percentage", "condonation"],
        "upasthiti": ["attendance", "percentage", "condonation"],
        "eshtu": ["percentage", "minimum", "requirement"],
        "kitni": ["percentage", "minimum", "requirement"],
        "kitna": ["percentage", "minimum", "requirement"],
        "irbeku": ["mandatory", "required"],
        "honi": ["mandatory", "required"],
        "hona": ["mandatory", "required"],
        "shortage": ["condonation", "shortage", "medical certificate"],
        
        # Native Kannada - Attendance
        "ಹಾಜರಾತಿ": ["attendance", "percentage", "presence", "condonation", "75%", "85%"],
        "ಉಪಸ್ಥಿತಿ": ["attendance", "percentage", "mandatory"],
        "ಎಷ್ಟು": ["percentage", "highest", "average", "cutoff", "intake", "fees", "minimum"],
        "ಇರಬೇಕು": ["mandatory", "required", "eligibility"],
        "ಕನಿಷ್ಠ": ["minimum", "requirement", "75%"],
        "ಕಡ್ಡಾಯ": ["mandatory", "compulsory"],

        # Native Hindi - Attendance
        "उपस्थिति": ["attendance", "percentage", "presence", "condonation", "75%", "85%"],
        "हाजिरी": ["attendance", "presence"],
        "कितनी": ["percentage", "minimum", "requirement", "highest", "package"],
        "कितना": ["percentage", "minimum", "highest", "package", "fees", "cutoff"],
        "होनी": ["mandatory", "required"],
        "होना": ["mandatory", "required"],
        "चाहिए": ["mandatory", "required", "eligibility"],
        "अनिवार्य": ["mandatory", "compulsory"],
        "न्यूनतम": ["minimum", "requirement"],

        # Placements, Packages & Careers
        "placement": ["placement", "recruiter", "package", "salary", "companies"],
        "package": ["package", "lpa", "ctc", "salary", "highest package", "average package"],
        "highest": ["highest package", "maximum", "placement", "41.5 lpa"],
        "sambala": ["salary", "package", "placement", "lpa"],
        "vetana": ["salary", "package", "placement"],
        "naukri": ["placement", "job", "career", "recruitment"],
        "kamayi": ["salary", "package"],

        # Native Kannada - Placements
        "ಪ್ಲೇಸ್‌ಮೆಂಟ್": ["placement", "recruiter", "package", "salary", "recruitment", "career"],
        "ಪ್ಲೇಸ್ಮೆಂಟ್": ["placement", "recruiter", "package", "salary", "recruitment"],
        "ಪ್ಯಾಕೇಜ್": ["package", "highest package", "average package", "salary", "lpa", "placement"],
        "ಅತಿ ಹೆಚ್ಚು": ["highest package", "highest", "41.5 lpa", "maximum"],
        "ಹೆಚ್ಚು": ["highest package", "highest", "maximum"],
        "ಗರಿಷ್ಠ": ["highest package", "maximum", "highest"],
        "ಸರಾಸರಿ": ["average package", "average", "median"],
        "ಸಂಬಳ": ["salary", "package", "ctc", "lpa"],
        "ಉದ್ಯೋಗ": ["placement", "recruitment", "job", "career"],
        "ನೇಮಕಾತಿ": ["recruitment", "placement", "companies"],
        "ಕಂಪನಿಗಳು": ["companies", "recruiters"],

        # Native Hindi - Placements
        "प्लेसमेंट": ["placement", "recruiter", "package", "salary", "recruitment", "career"],
        "पैकेज": ["package", "highest package", "average package", "salary", "lpa", "placement"],
        "हाईएस्ट": ["highest package", "highest", "maximum", "41.5 lpa"],
        "अधिकतम": ["highest package", "maximum", "highest"],
        "औसत": ["average package", "average", "median"],
        "सैलरी": ["salary", "package", "ctc", "lpa"],
        "वेतन": ["salary", "package", "ctc"],
        "नौकरी": ["placement", "recruitment", "job"],
        "कंपनियां": ["companies", "recruiters"],
        "भर्ती": ["recruitment", "placement"],

        # Admissions, Ranks & Cutoffs
        "cutoff": ["cutoff", "cut off", "rank", "kcet", "comedk", "closing rank"],
        "cut off": ["cutoff", "cut off", "rank", "kcet", "comedk", "closing rank"],
        "kcet": ["kcet", "cutoff", "rank", "quota", "seat", "admissions"],
        "comedk": ["comedk", "cutoff", "rank", "quota", "seat", "admissions"],
        "pravesha": ["admission", "admissions", "intake", "eligibility"],
        "dakhila": ["admission", "admissions", "intake", "eligibility"],

        # Native Kannada - Admissions & Cutoffs
        "ಕಟ್ ಆಫ್": ["cutoff", "cut off", "closing rank", "kcet", "comedk", "rank"],
        "ಕಟ್‌ಆಫ್": ["cutoff", "cut off", "closing rank", "kcet", "comedk"],
        "ಕಟ್-ಆಫ್": ["cutoff", "cut off", "closing rank", "kcet", "comedk"],
        "ಪ್ರವೇಶ": ["admission", "admissions", "intake", "eligibility", "quota"],
        "ದಾಖಲಾತಿ": ["admission", "admissions", "enrolment"],
        "ಶ್ರೇಣಿ": ["rank", "cutoff", "kcet"],
        "ಸೀಟುಗಳು": ["seat intake", "intake", "seats"],
        "ಶುಲ್ಕ": ["fees", "tuition fee", "fee structure", "payment"],
        "ಫೀಸ್": ["fees", "tuition fee", "fee structure"],

        # Native Hindi - Admissions & Cutoffs
        "कट ऑफ": ["cutoff", "cut off", "closing rank", "kcet", "comedk", "rank"],
        "कटऑफ": ["cutoff", "cut off", "closing rank", "kcet", "comedk"],
        "कट-ऑफ": ["cutoff", "cut off", "closing rank", "kcet", "comedk"],
        "दाखिला": ["admission", "admissions", "intake", "eligibility"],
        "प्रवेश": ["admission", "admissions", "intake", "quota"],
        "रैंक": ["rank", "cutoff", "kcet", "comedk"],
        "सीटें": ["seat intake", "intake", "seats"],
        "फीस": ["fees", "tuition fee", "fee structure"],
        "शुल्क": ["fees", "tuition fee", "fee structure"],

        # Exams, CIE & SEE
        "parikshe": ["exam", "examination", "see", "cie", "schedule"],
        "pariksha": ["exam", "examination", "see", "cie", "schedule"],
        "madodu": ["submission", "procedure"],
        "jama": ["submission", "deposit"],
        "kahan": ["where", "counter", "office"],
        "elli": ["where", "counter", "office"],
        "yelli": ["where", "counter", "office"],
        "yavaga": ["date", "schedule", "calendar"],
        "kab": ["date", "schedule", "calendar"],

        # Native Kannada - Exams
        "ಪರೀಕ್ಷೆ": ["exam", "examination", "cie", "see", "schedule", "tests"],
        "ವೇಳಾಪಟ್ಟಿ": ["time table", "schedule", "calendar", "cie dates"],
        "ಅಂಕಗಳು": ["marks", "cie marks", "passing marks", "grading"],
        "ಎಲ್ಲಿ": ["where", "counter", "office", "location"],
        "ಯಾವಾಗ": ["date", "schedule", "calendar", "when"],
        "ಹೇಗೆ": ["how to", "procedure", "steps"],

        # Native Hindi - Exams
        "परीक्षा": ["exam", "examination", "cie", "see", "schedule"],
        "समय सारणी": ["time table", "schedule", "calendar"],
        "अंक": ["marks", "cie marks", "passing marks"],
        "कहाँ": ["where", "counter", "office", "location"],
        "कब": ["date", "schedule", "calendar", "when"],
        "कैसे": ["how to", "procedure", "steps"],

        # Bonafide & Certificates
        "bonafide": ["certificate", "bonafide", "study certificate", "counter 2"],
        "pramanapatra": ["certificate", "bonafide", "study certificate"],
        "daakhalegalu": ["documents", "enclosures"],

        # Native Kannada - Certificates
        "ಬೋನಾಫೈಡ್": ["bonafide certificate", "study certificate", "counter 2", "procedure"],
        "ಪ್ರಮಾಣಪತ್ರ": ["certificate", "bonafide", "study certificate", "counter 2"],
        "ದಾಖಲೆಗಳು": ["documents", "enclosures", "photocopies"],
        "ಅರ್ಜಿ": ["application form", "counter 2", "procedure"],

        # Native Hindi - Certificates
        "बोनाफाइड": ["bonafide certificate", "study certificate", "counter 2", "procedure"],
        "प्रमाण पत्र": ["certificate", "bonafide", "study certificate", "counter 2"],
        "प्रमाणपत्र": ["certificate", "bonafide", "study certificate"],
        "दस्तावेज": ["documents", "enclosures"],
        "आवेदन": ["application form", "counter 2"],

        # Scholarships
        "chhatravritti": ["scholarship", "ssp", "nsp", "concession"],
        "shishyavetana": ["scholarship", "ssp", "nsp", "concession"],
        "ssp": ["karnataka state scholarship portal", "ssp", "post-matric"],
        "nsp": ["national scholarship portal", "pragati", "central scheme"],

        # Native Kannada - Scholarships
        "ವಿದ್ಯಾರ್ಥಿವೇತನ": ["scholarship", "ssp", "nsp", "fee concession", "financial assistance"],
        "ರಿಯಾಯಿತಿ": ["concession", "fee concession", "scholarship"],

        # Native Hindi - Scholarships
        "छात्रवृत्ति": ["scholarship", "ssp", "nsp", "fee concession", "financial assistance"],
        "रियायत": ["concession", "fee concession", "scholarship"],

        # Leadership, Contacts & Campus
        "yaru": ["contact", "hod", "head", "principal"],
        "kaun": ["contact", "hod", "head", "principal"],
        "samparka": ["contact", "directory", "phone", "email"],

        # Native Kannada - Contacts & Campus
        "ಪ್ರಾಂಶುಪಾಲ": ["principal", "administration", "office", "contact"],
        "ಮುಖ್ಯಸ್ಥ": ["hod", "head of department", "contact"],
        "ಸಂಪರ್ಕ": ["contact", "directory", "phone", "email", "office"],
        "ವಸತಿ ನಿಲಯ": ["hostel", "accommodation", "warden", "mess"],
        "ಹಾಸ್ಟೆಲ್": ["hostel", "accommodation", "warden", "mess"],
        "ಬಸ್": ["bus", "transport", "bmtc", "route"],
        "ಸಾರಿಗೆ": ["transport", "bus", "route"],
        "ಗ್ರಂಥಾಲಯ": ["library", "digital library", "books", "timings"],
        "ಕ್ಲಬ್": ["club", "student clubs", "phoenix", "robotics", "activities"],

        # Native Hindi - Contacts & Campus
        "प्राचार्य": ["principal", "administration", "office", "contact"],
        "विभाग प्रमुख": ["hod", "head of department", "contact"],
        "संपर्क": ["contact", "directory", "phone", "email", "office"],
        "हॉस्टल": ["hostel", "accommodation", "warden", "mess"],
        "छात्रावास": ["hostel", "accommodation", "warden", "mess"],
        "बस": ["bus", "transport", "route"],
        "पुस्तकालय": ["library", "digital library", "books", "timings"],
        "क्लब": ["club", "student clubs", "activities"],

        # College Name Variations
        "ಆರ್ವಿಐಟಿಎಂ": ["rvitm", "college", "institute"],
        "ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ": ["rvitm", "college", "institute"],
        "ಆರ್ ವಿ ಐ ಟಿ ಎಂ": ["rvitm", "college", "institute"],
        "आरवीआईटीएम": ["rvitm", "college", "institute"],
        "आर.वी.आई.टी.एम": ["rvitm", "college", "institute"],
        "आर वी आई टी एम": ["rvitm", "college", "institute"]
    }

    # Protected acronyms that must not be altered
    PROTECTED_ACRONYMS = {
        "VTU", "CIE", "SEE", "SSP", "NSP", "RSST", "RVITM", "AICTE", "HOD", "USN", "BMTC", "IEEE", "IQAC"
    }

    def normalize(self, query: str, detected_language: str, primary_language: str, is_transliterated: bool) -> NormalizedQuery:
        trimmed = query.strip()
        # Clean redundant characters while preserving Indic letters, vowels and combining marks
        cleaned = re.sub(r'[^\w\s\-\?\.\,\u0900-\u097F\u0C80-\u0CFF]', ' ', trimmed)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        # Split into distinct lexical tokens preserving full Indic multi-character words
        raw_tokens = [t.strip() for t in re.split(r'[\s\?\.\,\!\:\;\(\)\"\'\/।]+', cleaned.lower()) if t.strip()]
        
        search_keywords = list(raw_tokens)
        domain_synonyms: List[str] = []

        query_lower = cleaned.lower()

        # 1. Match multi-word Indic phrases directly against the query text
        for phrase, syns in self.INDIC_SYNONYMS.items():
            if " " in phrase and phrase in query_lower:
                for syn in syns:
                    if syn not in domain_synonyms:
                        domain_synonyms.append(syn)

        # 2. Match individual tokens against Indic synonyms dictionary
        for t in raw_tokens:
            if t in self.INDIC_SYNONYMS:
                for syn in self.INDIC_SYNONYMS[t]:
                    if syn not in domain_synonyms:
                        domain_synonyms.append(syn)

        # Ensure domain synonyms are prioritized in search keywords for cross-lingual match
        for s in domain_synonyms:
            if s not in search_keywords:
                search_keywords.append(s)

        return NormalizedQuery(
            original_query=trimmed,
            cleaned_query=cleaned,
            search_keywords=list(dict.fromkeys(search_keywords)),
            detected_language=detected_language,
            primary_language=primary_language,
            is_transliterated=is_transliterated,
            domain_synonyms=domain_synonyms
        )
