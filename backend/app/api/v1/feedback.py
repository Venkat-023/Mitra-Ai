from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.schemas.feedback import FeedbackCreate, FeedbackRead
from backend.app.models.feedback import Feedback, FeedbackRating
from backend.app.models.conversation import Message

router = APIRouter(tags=["Feedback"])

@router.post("/feedback", response_model=FeedbackRead)
async def submit_feedback(data: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    # Verify message exists
    msg_res = await db.execute(select(Message).where(Message.id == data.message_id))
    msg = msg_res.scalars().first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced message not found.")

    # Flag negative feedback for administrative review/escalation
    escalate = data.rating == FeedbackRating.NEGATIVE.value

    feedback = Feedback(
        conversation_id=data.conversation_id,
        message_id=data.message_id,
        rating=data.rating,
        feedback_tag=data.feedback_tag,
        comment=data.comment,
        escalation_required=escalate
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback
