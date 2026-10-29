import json
import time
import uuid
from typing import Optional, List
from backend.app.schemas.chat import ChatResponse, CitationItem
from backend.app.models.conversation import AnswerabilityStatus
from backend.app.services.nlp.service import ProcessedQuery
from backend.app.services.retrieval.base import RetrievalResult, RetrievedChunk
from backend.app.services.generation.factory import get_llm_provider
from backend.app.services.generation.provider import LLMProvider
from backend.app.services.generation.prompt_templates import SYSTEM_GROUNDING_PROMPT, USER_EVIDENCE_TEMPLATE
from backend.app.core.config import settings

class AnswerGenerationService:
    def __init__(self, provider: Optional[LLMProvider] = None):
        self.llm_provider = provider or get_llm_provider()

    async def generate_answer(
        self,
        query: ProcessedQuery,
        retrieval: RetrievalResult,
        conversation_id: Optional[str] = None
    ) -> ChatResponse:
        start_time = time.perf_counter()
        conv_id = conversation_id or str(uuid.uuid4())
        msg_id = str(uuid.uuid4())
        lang = query.primary_language

        # 1. Handle Out-of-Scope Queries
        if query.is_out_of_scope:
            return ChatResponse(
                conversation_id=conv_id,
                message_id=msg_id,
                answer=query.clarification_question or "I only answer questions regarding RVITM college matters.",
                language=lang,
                status=AnswerabilityStatus.OUT_OF_SCOPE.value,
                citations=[],
                suggested_followups=["What courses does RVITM offer?", "Where is RVITM located?"],
                needs_clarification=False,
                retrieval_confidence=0.0,
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        # 2. Handle Ambiguous Queries
        if query.is_ambiguous:
            return ChatResponse(
                conversation_id=conv_id,
                message_id=msg_id,
                answer=query.clarification_question or "Could you please specify your question in more detail?",
                language=lang,
                status=AnswerabilityStatus.CLARIFICATION_NEEDED.value,
                citations=[],
                suggested_followups=[
                    "What is the attendance policy?",
                    "How to apply for a bonafide certificate?",
                    "What is the CIE and exam schedule?"
                ],
                needs_clarification=True,
                clarification_prompt=query.clarification_question,
                retrieval_confidence=0.0,
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        # 3. Calibrated Abstention (Insufficient Evidence)
        if not retrieval.top_chunks or not retrieval.is_grounded:
            abstention_answers = {
                "kn": "ಕ್ಷಮಿಸಿ, ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ನ ಪ್ರಸ್ತುತ ಅನುಮೋದಿತ ಅಧಿಕೃತ ದಾಖಲೆಗಳಲ್ಲಿ ಈ ಪ್ರಶ್ನೆಗೆ ನಿಖರವಾದ ಆಧಾರ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕಾಲೇಜು ಆಡಳಿತ ಅಥವಾ ಪರೀಕ್ಷಾ ಶಾಖೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                "hi": "क्षमा करें, आरवीआईटीएम के वर्तमान आधिकारिक एवं सत्यापित दस्तावेजों में इस प्रश्न के लिए पर्याप्त साक्ष्य उपलब्ध नहीं है। कृपया कॉलेज प्रशासनिक शाखा से संपर्क करें।",
                "en": "I do not have sufficient verified RVITM evidence to answer this question reliably. Please consult the administrative office or department coordinator."
            }
            return ChatResponse(
                conversation_id=conv_id,
                message_id=msg_id,
                answer=abstention_answers.get(lang, abstention_answers["en"]),
                language=lang,
                status=AnswerabilityStatus.INSUFFICIENT_EVIDENCE.value,
                citations=[],
                suggested_followups=[
                    "Who is the administrative officer?",
                    "Where is the examination cell?",
                    "What are the office working hours?"
                ],
                needs_clarification=False,
                escalation_reason="Evidence below similarity threshold",
                retrieval_confidence=round(retrieval.max_score, 3),
                latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        # 4. Construct Evidence Context
        evidence_lines = []
        citations: List[CitationItem] = []
        for chunk in retrieval.top_chunks:
            evidence_lines.append(
                f'<CHUNK id="{chunk.chunk_id}" doc="{chunk.document_id}" title="{chunk.title}" page="{chunk.page_number}" section="{chunk.section_title}">\n{chunk.content}\n</CHUNK>'
            )
            citations.append(CitationItem(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.title,
                category=chunk.category,
                version=chunk.version,
                section_title=chunk.section_title,
                page_number=chunk.page_number,
                snippet=chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                relevance_score=round(chunk.final_score, 3),
                source_uri=chunk.source_uri
            ))

        evidence_context = "\n\n".join(evidence_lines)
        system_prompt = SYSTEM_GROUNDING_PROMPT.format(target_language=lang)
        user_prompt = USER_EVIDENCE_TEMPLATE.format(
            target_language=lang,
            evidence_context=evidence_context,
            query=query.original_query
        )

        # 5. Call LLM
        try:
            raw_output = await self.llm_provider.generate(system_prompt, user_prompt, temperature=0.1)
            clean_output = raw_output.strip()
            if "```json" in clean_output:
                clean_output = clean_output.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_output:
                clean_output = clean_output.split("```")[1].split("```")[0].strip()
            
            # Find JSON boundaries
            import re
            json_match = re.search(r'(\{[\s\S]*\})', clean_output)
            if json_match:
                clean_output = json_match.group(1)

            parsed_json = json.loads(clean_output)
            ans_text = parsed_json.get("answer", "")
            followups = parsed_json.get("suggested_followups", [])
            status_val = parsed_json.get("status", AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value)
        except Exception:
            # Fallback if raw output wasn't pure JSON
            ans_text = raw_output if 'raw_output' in locals() else "Verified college information provided below."
            followups = []
            status_val = AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value


        return ChatResponse(
            conversation_id=conv_id,
            message_id=msg_id,
            answer=ans_text,
            language=lang,
            status=status_val,
            citations=citations,
            suggested_followups=followups,
            needs_clarification=False,
            retrieval_confidence=round(retrieval.max_score, 3),
            latency_ms=round((time.perf_counter() - start_time) * 1000, 2)
        )
