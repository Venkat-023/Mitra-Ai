import httpx
from typing import List
from backend.app.services.embedding.base import EmbeddingProvider
from backend.app.core.config import settings

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-3-small", dimension: int = 384):
        self.api_key = api_key
        self.model = model
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "input": texts,
            "model": self.model,
            "dimensions": self._dim
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return [item["embedding"] for item in data["data"]]

    async def embed_query(self, query: str) -> List[float]:
        res = await self.embed_texts([query])
        return res[0]

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-004", dimension: int = 768):
        self.api_key = api_key
        self.model = model
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # In batch or individual requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents?key={self.api_key}"
        requests = [{"model": f"models/{self.model}", "content": {"parts": [{"text": t}]}} for t in texts]
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"requests": requests})
            resp.raise_for_status()
            data = resp.json()
            return [item["values"] for item in data.get("embeddings", [])]

    async def embed_query(self, query: str) -> List[float]:
        res = await self.embed_texts([query])
        return res[0]
