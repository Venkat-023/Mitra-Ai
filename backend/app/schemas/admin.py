from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DocumentApprovalRequest(BaseModel):
    approved_by: str = Field(..., min_length=2, max_length=128)
    notes: Optional[str] = None

class DocumentRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=5, max_length=1000)
    reviewed_by: str = Field(..., min_length=2, max_length=128)

class AnalyticsSummary(BaseModel):
    total_documents: int = 0
    total_approved_documents: int = 0
    total_pending_documents: int = 0
    total_chunks: int = 0
    total_conversations: int = 0
    total_messages: int = 0
    unanswered_queries_count: int = 0
    feedback_positive_count: int = 0
    feedback_negative_count: int = 0
    language_breakdown: Dict[str, int] = Field(default_factory=dict)
    category_breakdown: Dict[str, int] = Field(default_factory=dict)

class UnansweredQueryItem(BaseModel):
    message_id: str
    conversation_id: str
    query_text: str
    language: Optional[str] = "en"
    created_at: datetime
    status: str
    retrieval_confidence: Optional[float] = None
