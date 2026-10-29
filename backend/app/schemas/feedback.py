from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.feedback import FeedbackRating, FeedbackTag

class FeedbackCreate(BaseModel):
    conversation_id: str
    message_id: str
    rating: str = Field(..., description="positive | negative")
    feedback_tag: Optional[str] = Field(default=None, description="inaccurate | missing_citation | language_error | helpful | other")
    comment: Optional[str] = Field(default=None, max_length=1000)

class FeedbackReview(BaseModel):
    reviewed_by: str
    review_notes: str
    escalation_required: bool = False

class FeedbackRead(BaseModel):
    id: str
    conversation_id: str
    message_id: str
    rating: str
    feedback_tag: Optional[str] = None
    comment: Optional[str] = None
    escalation_required: bool
    reviewed: bool
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
