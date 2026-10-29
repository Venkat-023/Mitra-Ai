import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.schemas.chat import ChatRequest, ChatResponse, ConversationRead
from backend.app.models.conversation import Conversation, Message, MessageRole, AnswerabilityStatus
from backend.app.services.nlp.service import MultilingualNLPService, ProcessedQuery
from backend.app.services.retrieval.hybrid_retriever import HybridRetriever
from backend.app.services.generation.answer_service import AnswerGenerationService

router = APIRouter(tags=["Chat"])

nlp_service = MultilingualNLPService()
retriever = HybridRetriever()
generator = AnswerGenerationService()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    session_id = request.session_id or f"sess_{uuid.uuid4().hex[:12]}"

    # 1. Resolve or create Conversation
    conv = None
    if request.conversation_id:
        conv_res = await db.execute(select(Conversation).where(Conversation.id == request.conversation_id))
        conv = conv_res.scalars().first()

    if not conv:
        conv = Conversation(
            session_id=session_id,
            title=request.message[:40] + ("..." if len(request.message) > 40 else ""),
            preferred_language=request.preferred_language or "en"
        )
        db.add(conv)
        await db.flush()

    # 2. Multilingual NLP Processing
    processed: ProcessedQuery = nlp_service.process_query(
        query=request.message,
        explicit_language=request.preferred_language if request.preferred_language != "auto" else None
    )

    # 3. Hybrid Evidence Retrieval
    retrieval_res = await retriever.retrieve(
        session=db,
        query=processed.cleaned_query,
        search_keywords=processed.search_keywords,
        category=request.category_filter or processed.category
    )

    # 4. Evidence-Grounded Generation
    chat_resp: ChatResponse = await generator.generate_answer(
        query=processed,
        retrieval=retrieval_res,
        conversation_id=conv.id
    )

    # 5. Persist User Message and Assistant Message in Database
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER.value,
        content=request.message,
        query_language=processed.detected_language,
        question_category=processed.category
    )
    db.add(user_msg)

    assistant_msg = Message(
        id=chat_resp.message_id,
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT.value,
        content=chat_resp.answer,
        response_language=chat_resp.language,
        question_category=processed.category,
        answerability_status=chat_resp.status,
        citations=[c.model_dump() for c in chat_resp.citations],
        suggested_followups=chat_resp.suggested_followups,
        retrieval_confidence=chat_resp.retrieval_confidence,
        latency_ms=chat_resp.latency_ms,
        execution_metadata={
            "is_grounded": retrieval_res.is_grounded,
            "candidates_found": retrieval_res.total_candidates
        }
    )
    db.add(assistant_msg)
    await db.commit()

    return chat_resp

@router.get("/conversations/{session_id}", response_model=List[ConversationRead])
async def get_session_conversations(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Conversation).where(Conversation.session_id == session_id, Conversation.is_active == True).order_by(Conversation.created_at.desc())
    res = await db.execute(stmt)
    convs = res.scalars().all()
    results = []
    for c in convs:
        results.append(ConversationRead(
            id=c.id,
            session_id=c.session_id,
            title=c.title,
            preferred_language=c.preferred_language,
            created_at=c.created_at,
            message_count=len(c.messages)
        ))
    return results

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    res = await db.execute(stmt)
    messages = res.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "language": m.response_language or m.query_language,
            "status": m.answerability_status,
            "citations": m.citations,
            "suggested_followups": m.suggested_followups,
            "created_at": m.created_at
        }
        for m in messages
    ]
