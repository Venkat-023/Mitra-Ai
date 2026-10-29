from fastapi import APIRouter
from backend.app.api.v1 import chat, feedback, sources, admin, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(feedback.router)
api_router.include_router(sources.router)
api_router.include_router(admin.router)
