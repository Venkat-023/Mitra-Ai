import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class IntentExtractionResult(BaseModel):
    intent: str
    confidence: float
    category: str
    entities: Dict[str, Any]
    is_ambiguous: bool
    is_out_of_scope: bool
    clarification_question: Optional[str] = None

class IntentExtractor:
    """
    Extracts high-level intent, college entities, ambiguous flags,
    and out-of-scope markers from student queries.
    """

    INTENT_PATTERNS = {
        "ATTENDANCE_REGULATIONS": [
            r'attendance', r'haajarathi', r'upasthiti', r'eshtu irbeku', r'kitni honi',
            r'condonation', r'medical certificate', r'75%', r'85%', r'shortage',
            r'ಹಾಜರಾತಿ', r'ಎಷ್ಟು\s*ಇರಬೇಕು', r'ಉಪಸ್ಥಿತಿ', r'उपस्थिति', r'कितनी\s*होनी'
        ],
        "EXAM_AND_CIE_SCHEDULE": [
            r'exam', r'cie', r'see', r'internal', r'test', r'parikshe', r'pariksha',
            r'schedule', r'calendar', r'passing marks', r'makeup test', r'time table',
            r'ಪರೀಕ್ಷೆ', r'ವೇಳಾಪಟ್ಟಿ', r'परीक्षा', r'समय\s*सारणी'
        ],
        "BONAFIDE_CERTIFICATE": [
            r'bonafide', r'study certificate', r'application form', r'counter 2',
            r'bus pass certificate', r'loan letter', r'pramanapatra',
            r'ಬೋನಾಫೈಡ್', r'ಪ್ರಮಾಣಪತ್ರ', r'बोनाफाइड', r'प्रमाण\s*पत्र'
        ],
        "SCHOLARSHIPS": [
            r'scholarship', r'ssp', r'nsp', r'pragati', r'fee concession', r'financial aid',
            r'chhatravritti', r'shishyavetana', r'rsst concession',
            r'ವಿದ್ಯಾರ್ಥಿವೇತನ', r'छात्रवृत्ति', r'रियायत'
        ],
        "DEPARTMENT_CONTACTS": [
            r'hod', r'principal', r'dean', r'tpo', r'placement officer', r'contact',
            r'email', r'phone', r'cse hod', r'ise hod', r'ece hod', r'me hod', r'office',
            r'ಸಂಪರ್ಕ', r'ಪ್ರಾಂಶುಪಾಲ', r'ವಿಭಾಗ', r'संपर्क', r'प्राचार्य', r'विभाग'
        ],
        "ANTI_RAGGING_CONDUCT": [
            r'ragging', r'anti-ragging', r'helpline', r'dress code', r'id card', r'discipline',
            r'police station', r'complaint',
            r'ರ್ಯಾಗಿಂಗ್', r'ಶಿಸ್ತು', r'रैगिंग', r'अनुशासन'
        ],
        "LIBRARY_RULES": [
            r'library', r'books', r'digital library', r'borrow', r'renewal', r'timing', r'fine',
            r'ಗ್ರಂಥಾಲಯ', r'ಪುಸ್ತಕ', r'पुस्तकालय', r'किताब'
        ]
    }

    OUT_OF_SCOPE_PATTERNS = [
        r'weather', r'cricket', r'movie', r'recipe', r'stock market', r'bitcoin',
        r'who won the match', r'tell me a joke', r'write a poem about love'
    ]

    AMBIGUOUS_PATTERNS = [
        r'^fees?$', r'^exam$', r'^form$', r'^date$', r'^hi$', r'^hello$', r'^help$',
        r'^what is the fee\??$', r'^when is the date\??$'
    ]

    def extract(self, query: str, primary_language: str = "en") -> IntentExtractionResult:
        normalized = query.strip().lower()
        entities = self._extract_entities(normalized)

        # 1. Check Out of Scope
        for pat in self.OUT_OF_SCOPE_PATTERNS:
            if re.search(pat, normalized):
                clarification = {
                    "en": "I am RVITM Mitra AI, designed to assist with RVITM college policies, academic calendars, exams, and campus procedures. I cannot answer queries unrelated to RVITM.",
                    "hi": "मैं आरवीआईटीएम मित्र एआई हूँ, जो केवल आरवीआईटीएम कॉलेज नीतियों, अकादमिक कैलेंडर, परीक्षाओं और प्रक्रियाओं में सहायता के लिए बनाया गया है।",
                    "kn": "ನಾನು ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಮಿತ್ರ ಎಐ. ನಾನು ಕೇವಲ ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಕಾಲೇಜು ನಿಯಮಗಳು, ಶೈಕ್ಷಣಿಕ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಪ್ರಕ್ರಿಯೆಗಳ ಬಗ್ಗೆ ಮಾತ್ರ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ."
                }.get(primary_language, "I only answer questions regarding RVITM college matters.")
                return IntentExtractionResult(
                    intent="OUT_OF_SCOPE",
                    confidence=0.95,
                    category="general",
                    entities=entities,
                    is_ambiguous=False,
                    is_out_of_scope=True,
                    clarification_question=clarification
                )

        # 2. Check Ambiguous
        for pat in self.AMBIGUOUS_PATTERNS:
            if re.search(pat, normalized):
                clarification = {
                    "en": "Your question is brief. Are you asking about tuition fees, examination schedules, bonafide application forms, or scholarship procedures?",
                    "hi": "आपका प्रश्न संक्षिप्त है। क्या आप ट्यूशन फीस, परीक्षा कार्यक्रम, बोनाफाइड फॉर्म या छात्रवृत्ति के बारे में पूछ रहे हैं?",
                    "kn": "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿದೆ. ನೀವು ಬೋಧನಾ ಶುಲ್ಕ, ಪರೀಕ್ಷಾ ವೇಳಾಪಟ್ಟಿ, ಬೋನಾಫೈಡ್ ಅರ್ಜಿ ಅಥವಾ ವಿದ್ಯಾರ್ಥಿವೇತನದ ಬಗ್ಗೆ ಕೇಳುತ್ತಿದ್ದೀರಾ?"
                }.get(primary_language, "Could you please specify which college procedure you are inquiring about?")
                return IntentExtractionResult(
                    intent="AMBIGUOUS",
                    confidence=0.8,
                    category="general",
                    entities=entities,
                    is_ambiguous=True,
                    is_out_of_scope=False,
                    clarification_question=clarification
                )

        # 3. Match Intent Patterns
        best_intent = "GENERAL_INQUIRY"
        best_category = "general"
        highest_score = 0.0

        for intent, patterns in self.INTENT_PATTERNS.items():
            matches = sum(1 for p in patterns if re.search(p, normalized))
            if matches > highest_score:
                highest_score = matches
                best_intent = intent
                best_category = self._intent_to_category(intent)

        confidence = min(0.6 + (highest_score * 0.15), 0.98) if highest_score > 0 else 0.5

        return IntentExtractionResult(
            intent=best_intent,
            confidence=confidence,
            category=best_category,
            entities=entities,
            is_ambiguous=False,
            is_out_of_scope=False,
            clarification_question=None
        )

    def _extract_entities(self, text: str) -> Dict[str, Any]:
        entities = {}
        # Department check
        dept_match = re.search(r'\b(cse|ise|ece|me|computer science|information science|electronics|mechanical)\b', text)
        if dept_match:
            entities["department"] = dept_match.group(1).upper()

        # Semester check
        sem_match = re.search(r'\b([1-8]|first|second|third|fourth|fifth|sixth|seventh|eighth)\s*(sem|semester)?\b', text)
        if sem_match:
            entities["semester"] = sem_match.group(1)

        # Role check
        role_match = re.search(r'\b(principal|dean|hod|proctor|tpo|registrar|counselor)\b', text)
        if role_match:
            entities["role"] = role_match.group(1)

        return entities

    @staticmethod
    def _intent_to_category(intent: str) -> str:
        mapping = {
            "ATTENDANCE_REGULATIONS": "academic",
            "EXAM_AND_CIE_SCHEDULE": "examination",
            "BONAFIDE_CERTIFICATE": "administration",
            "SCHOLARSHIPS": "scholarships",
            "DEPARTMENT_CONTACTS": "administration",
            "ANTI_RAGGING_CONDUCT": "student_welfare",
            "LIBRARY_RULES": "general"
        }
        return mapping.get(intent, "general")
