from typing import List, Optional
from pydantic import BaseModel, Field

class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    page_number: int
    section_title: str
    content: str
    source_uri: str
    version: str
    category: str
    semantic_score: float = 0.0
    lexical_score: float = 0.0
    rrf_score: float = 0.0
    final_score: float = 0.0
    rank: int = 0

class RetrievalResult(BaseModel):
    query: str
    total_candidates: int
    top_chunks: List[RetrievedChunk] = Field(default_factory=list)
    max_score: float = 0.0
    is_grounded: bool = False
    retrieval_method: str = "hybrid_rrf"
