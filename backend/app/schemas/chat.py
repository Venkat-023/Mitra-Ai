from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.conversation import AnswerabilityStatus

class CitationItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    category: str
    version: str = "1.0.0"
    section_title: Optional[str] = None
    page_number: int = 1
    snippet: str
    relevance_score: float = 0.0
    source_uri: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User question in English, Hindi, Kannada, or transliteration")
    conversation_id: Optional[str] = Field(default=None, description="Existing conversation ID if continuing session")
    session_id: Optional[str] = Field(default=None, description="Client session identifier")
    preferred_language: Optional[str] = Field(default="auto", description="en | hi | kn | auto")
    category_filter: Optional[str] = Field(default=None, description="Optional document category filter")

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    language: str = "en"
    status: str = AnswerabilityStatus.ANSWERED_WITH_EVIDENCE.value
    citations: List[CitationItem] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    needs_clarification: bool = False
    clarification_prompt: Optional[str] = None
    escalation_reason: Optional[str] = None
    retrieval_confidence: Optional[float] = None
    latency_ms: Optional[float] = None

class ConversationRead(BaseModel):
    id: str
    session_id: str
    title: str
    preferred_language: str
    created_at: Any
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)
