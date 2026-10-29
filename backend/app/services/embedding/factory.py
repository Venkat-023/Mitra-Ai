from backend.app.core.config import settings
from backend.app.services.embedding.base import EmbeddingProvider
from backend.app.services.embedding.mock_provider import MockEmbeddingProvider
from backend.app.services.embedding.providers import OpenAIEmbeddingProvider, GeminiEmbeddingProvider

_embedding_instance = None

def get_embedding_provider() -> EmbeddingProvider:
    global _embedding_instance
    if _embedding_instance is not None:
        return _embedding_instance

    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "openai" and settings.OPENAI_API_KEY:
        _embedding_instance = OpenAIEmbeddingProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.EMBEDDING_MODEL,
            dimension=settings.EMBEDDING_DIMENSION
        )
    elif provider == "gemini" and settings.GEMINI_API_KEY:
        _embedding_instance = GeminiEmbeddingProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.EMBEDDING_MODEL,
            dimension=settings.EMBEDDING_DIMENSION
        )
    else:
        _embedding_instance = MockEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
    
    return _embedding_instance
