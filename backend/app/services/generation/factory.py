from backend.app.core.config import settings
from backend.app.services.generation.provider import LLMProvider
from backend.app.services.generation.mock_provider import MockLLMProvider
from backend.app.services.generation.api_providers import GeminiLLMProvider, OpenAILLMProvider, OllamaLLMProvider

_llm_instance = None

def get_llm_provider() -> LLMProvider:
    global _llm_instance
    if _llm_instance is not None:
        return _llm_instance

    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        _llm_instance = GeminiLLMProvider(api_key=settings.GEMINI_API_KEY, model=settings.LLM_MODEL)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        _llm_instance = OpenAILLMProvider(api_key=settings.OPENAI_API_KEY, model=settings.LLM_MODEL)
    elif provider == "ollama":
        _llm_instance = OllamaLLMProvider(base_url=settings.OLLAMA_BASE_URL, model=settings.LLM_MODEL)
    else:
        _llm_instance = MockLLMProvider()

    return _llm_instance
