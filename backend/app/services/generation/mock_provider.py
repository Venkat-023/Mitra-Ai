import json
import re
from backend.app.services.generation.provider import LLMProvider

class MockLLMProvider(LLMProvider):
    """
    Deterministic test-double LLM provider for zero-cost, offline, reproducible testing.
    Synthesizes responses directly from provided evidence chunks.
    """

    async def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        # Check target language from prompt
        lang = "en"
        if "RESPOND IN KANNADA" in system_prompt or "Language: kn" in user_prompt:
            lang = "kn"
        elif "RESPOND IN HINDI" in system_prompt or "Language: hi" in user_prompt:
            lang = "hi"

        # Check if user prompt contains evidence context
        evidence_match = re.search(r'<EVIDENCE>\s*(.*?)\s*</EVIDENCE>', user_prompt, re.DOTALL)
        if not evidence_match:
            evidence_match = re.search(r'EVIDENCE CONTEXT:\s*\n(.*?)(?=\n\nUSER QUESTION|\Z)', user_prompt, re.DOTALL)
        evidence_text = evidence_match.group(1).strip() if evidence_match else ""

        # Check if evidence is missing or insufficient
        if not evidence_text or "NO_RELEVANT_EVIDENCE" in evidence_text:
            if lang == "kn":
                return json.dumps({
                    "answer": "ಕ್ಷಮಿಸಿ, ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ನ ಅಧಿಕೃತ ದಾಖಲೆಗಳಲ್ಲಿ ಈ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ನಿಖರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕಾಲೇಜು ಆಡಳಿತ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                    "status": "insufficient_evidence",
                    "citations": [],
                    "suggested_followups": ["ಕಾಲೇಜು ಕಚೇರಿ ಸಮಯವೇನು?", "ಪ್ರಾಂಶುಪಾಲರ ಕಚೇರಿ ಎಲ್ಲಿದೆ?"]
                }, ensure_ascii=False)
            elif lang == "hi":
                return json.dumps({
                    "answer": "क्षमा करें, इस प्रश्न के लिए आधिकारिक आरवीआईटीएम दस्तावेजों में पर्याप्त जानकारी उपलब्ध नहीं है। कृपया कॉलेज प्रशासनिक कार्यालय से संपर्क करें।",
                    "status": "insufficient_evidence",
                    "citations": [],
                    "suggested_followups": ["कॉलेज कार्यालय का समय क्या है?", "प्राचार्य कार्यालय कहाँ है?"]
                }, ensure_ascii=False)
            else:
                return json.dumps({
                    "answer": "I do not have sufficient verified RVITM evidence to answer this question reliably. Please contact the administrative office.",
                    "status": "insufficient_evidence",
                    "citations": [],
                    "suggested_followups": ["Who is the administrative officer?", "Where is the academic section?"]
                })

        # Synthesize from evidence
        if "85%" in evidence_text or "attendance" in user_prompt.lower() or "haajarathi" in user_prompt.lower():
            if lang == "kn":
                ans = "ವಿಟಿಯು ನಿಯಮಾವಳಿಗಳ (ನಿಯಮ 8.1) ಪ್ರಕಾರ, ವಿದ್ಯಾರ್ಥಿಗಳು ಪ್ರತಿ ವಿಷಯದಲ್ಲಿ ಕನಿಷ್ಠ 85% ಹಾಜರಾತಿಯನ್ನು ಹೊಂದಿರುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ. ಅನಾರೋಗ್ಯದ ಕಾರಣ 10% ವಿನಾಯಿತಿಯನ್ನು (75% ರಿಂದ 84%) ಪ್ರಾಂಶುಪಾಲರು ಮಾನ್ಯ ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರದ ಆಧಾರದ ಮೇಲೆ ನೀಡಬಹುದು."
                followups = ["ಹಾಜರಾತಿ 75% ಕ್ಕಿಂತ ಕಡಿಮೆಯಾದರೆ ಏನಾಗುತ್ತದೆ?", "ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಯಾವಾಗ ಸಲ್ಲಿಸಬೇಕು?"]
            elif lang == "hi":
                ans = "वीटीयू नियमों (क्लॉज 8.1) के अनुसार, छात्रों के लिए प्रत्येक विषय में न्यूनतम 85% उपस्थिति अनिवार्य है। वास्तविक चिकित्सा आधार पर प्राचार्य द्वारा 10% (75% से 84%) तक की छूट दी जा सकती है।"
                followups = ["उपस्थिति 75% से कम होने पर क्या होता है?", "मेडिकल सर्टिफिकेट कब जमा करना होता है?"]
            else:
                ans = "According to VTU regulations (Clause 8.1) adopted by RVITM, students must maintain a minimum attendance of 85% in each course. Medical condonation up to 10% (75% to 84%) may be granted by the Principal upon submitting a valid medical certificate within 3 working days."
                followups = ["What happens if attendance is below 75%?", "How do I submit a medical certificate?"]
        elif "bonafide" in user_prompt.lower() or "study certificate" in user_prompt.lower():
            if lang == "kn":
                ans = "ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ನಲ್ಲಿ ಬೋನಾಫೈಡ್ ಪ್ರಮಾಣಪತ್ರಕ್ಕಾಗಿ ಇಆರ್‌ಪಿ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು ಅಥವಾ ಆಡಳಿತ ವಿಭಾಗದ ಕೌಂಟರ್ 2 ರಲ್ಲಿ ಅರ್ಜಿ ಪಡೆದು ಕಾಲೇಜು ಗುರುತಿನ ಚೀಟಿಯೊಂದಿಗೆ ಸಲ್ಲಿಸಬೇಕು. ಪ್ರಕ್ರಿಯೆಗೆ 2-3 ಕೆಲಸದ ದಿನಗಳು ಬೇಕಾಗುತ್ತವೆ."
                followups = ["ಕೌಂಟರ್ 2 ಕೆಲಸದ ಸಮಯವೇನು?", "ಬೋನಾಫೈಡ್ ಶುಲ್ಕ ಎಷ್ಟು?"]
            elif lang == "hi":
                ans = "आरवीआईटीएम में बोनाफाइड सर्टिफिकेट के लिए ईआरपी पोर्टल से फॉर्म डाउनलोड करें या एडमिनिस्ट्रेटिव ब्लॉक के काउंटर 2 से फॉर्म प्राप्त करें। इसे कॉलेज आईडी कार्ड के साथ जमा करें। इसे जारी होने में 2-3 कार्यदिवस लगते हैं।"
                followups = ["काउंटर 2 का समय क्या है?", "बोनाफाइड फीस कितनी है?"]
            else:
                ans = "To obtain a Bonafide Certificate at RVITM, download the application from the ERP student login or collect it at Counter No. 2 (Administrative Block). Submit it with your college ID card copy. The standard turnaround time is 2 to 3 working days."
                followups = ["What are Counter 2 working hours?", "Is there a fee for duplicate certificates?"]
        else:
            # General evidence extraction
            first_sentence = evidence_text.splitlines()[0] if evidence_text else "Verified institutional policy"
            if lang == "kn":
                ans = f"ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಅಧಿಕೃತ ದಾಖಲೆಗಳ ಪ್ರಕಾರ: {first_sentence}"
                followups = ["ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ"]
            elif lang == "hi":
                ans = f"आरवीआईटीएम आधिकारिक दस्तावेजों के अनुसार: {first_sentence}"
                followups = ["अधिक जानकारी के लिए कार्यालय से संपर्क करें"]
            else:
                ans = f"Based on verified RVITM documentation: {first_sentence}"
                followups = ["Where can I get more information?"]

        return json.dumps({
            "answer": ans,
            "status": "answered_with_evidence",
            "suggested_followups": followups
        }, ensure_ascii=False)
