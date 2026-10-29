from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        """Generates text completion given system instructions and user context."""
        pass
