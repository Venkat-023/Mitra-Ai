import hashlib
import math
from typing import List
from backend.app.services.embedding.base import EmbeddingProvider
from backend.app.core.config import settings

class MockEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic pseudo-semantic embedding provider for reproducible testing.
    Uses n-gram hashing and vocabulary projection into a normalized hypersphere.
    """
    def __init__(self, dimension: int = 384):
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    def _text_to_vector(self, text: str) -> List[float]:
        vec = [0.0] * self._dim
        if not text:
            return vec
        
        # Tokenize simply across whitespace & punctuation
        normalized = text.lower().strip()
        tokens = normalized.split()
        
        # Add character trigrams to capture Indic subwords & morphological similarities
        features = list(tokens)
        for i in range(len(normalized) - 2):
            features.append(normalized[i:i+3])
        
        for feature in features:
            h = int(hashlib.md5(feature.encode("utf-8")).hexdigest(), 16)
            idx = h % self._dim
            sign = 1.0 if (h // self._dim) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 + (len(feature) / 10.0))
        
        # Normalize to unit length
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 1e-9:
            vec = [v / norm for v in vec]
        return vec

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(t) for t in texts]

    async def embed_query(self, query: str) -> List[float]:
        return self._text_to_vector(query)
