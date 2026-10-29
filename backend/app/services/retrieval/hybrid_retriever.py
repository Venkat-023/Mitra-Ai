import math
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from backend.app.models.document import Document, DocumentChunk, ApprovalStatus
from backend.app.services.embedding.factory import get_embedding_provider
from backend.app.services.retrieval.base import RetrievedChunk, RetrievalResult
from backend.app.services.retrieval.reranker import MultilingualReranker
from backend.app.core.config import settings

class HybridRetriever:
    def __init__(self, reranker: Optional[MultilingualReranker] = None):
        self.embedding_provider = get_embedding_provider()
        self.reranker = reranker or MultilingualReranker()
        self.rrf_k = settings.RRF_K

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 <= 1e-9 or norm2 <= 1e-9:
            return 0.0
        return max(0.0, min(1.0, dot / (norm1 * norm2)))

    async def retrieve(
        self,
        session: AsyncSession,
        query: str,
        search_keywords: Optional[List[str]] = None,
        category: Optional[str] = None,
        top_k: int = 25,
        fused_top_k: int = 6
    ) -> RetrievalResult:
        now = datetime.now(timezone.utc)
        
        # 1. Base Query with Hard Governance Filters: ONLY APPROVED, ACTIVE, VALID DOCUMENTS
        conditions = [
            Document.approval_status == ApprovalStatus.APPROVED.value,
            Document.is_active == True,
            Document.effective_from <= now,
            or_(Document.effective_until == None, Document.effective_until >= now)
        ]
        if category and category != "general":
            conditions.append(Document.category == category)

        stmt = (
            select(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(and_(*conditions))
        )
        res = await session.execute(stmt)
        records = res.all()

        if not records:
            return RetrievalResult(query=query, total_candidates=0, top_chunks=[], max_score=0.0, is_grounded=False)

        # 2. Dense Semantic Search
        query_embedding = await self.embedding_provider.embed_query(query)
        semantic_ranked: List[tuple[RetrievedChunk, float]] = []

        for chunk_model, doc_model in records:
            chunk_obj = RetrievedChunk(
                chunk_id=chunk_model.id,
                document_id=doc_model.id,
                title=doc_model.title,
                page_number=chunk_model.page_number,
                section_title=chunk_model.section_title or "General",
                content=chunk_model.content,
                source_uri=doc_model.source_uri,
                version=doc_model.version,
                category=doc_model.category
            )
            sim = self.cosine_similarity(query_embedding, chunk_model.embedding or [])
            chunk_obj.semantic_score = float(sim)
            semantic_ranked.append((chunk_obj, sim))

        semantic_ranked.sort(key=lambda x: x[1], reverse=True)

        # 3. Sparse Lexical Search
        keywords = search_keywords or query.lower().split()
        lexical_ranked: List[tuple[RetrievedChunk, float]] = []

        for chunk_obj, _ in semantic_ranked:
            content_lower = chunk_obj.content.lower()
            section_lower = chunk_obj.section_title.lower()
            title_lower = chunk_obj.title.lower()

            matches = 0
            for kw in keywords:
                kw_lower = kw.lower()
                if kw_lower in content_lower:
                    matches += 1
                if kw_lower in section_lower:
                    matches += 2
                if kw_lower in title_lower:
                    matches += 3

            lex_score = matches / max(len(keywords), 1)
            chunk_copy = chunk_obj.model_copy()
            chunk_copy.lexical_score = float(lex_score)
            lexical_ranked.append((chunk_copy, lex_score))

        lexical_ranked.sort(key=lambda x: x[1], reverse=True)

        # 4. Reciprocal Rank Fusion (RRF)
        # score = 1 / (k + rank_semantic) + 1 / (k + rank_lexical)
        fused_scores: Dict[str, float] = {}
        chunk_map: Dict[str, RetrievedChunk] = {}

        for rank, (chunk, _) in enumerate(semantic_ranked[:top_k], start=1):
            fused_scores[chunk.chunk_id] = fused_scores.get(chunk.chunk_id, 0.0) + (1.0 / (self.rrf_k + rank))
            chunk_map[chunk.chunk_id] = chunk

        for rank, (chunk, _) in enumerate(lexical_ranked[:top_k], start=1):
            fused_scores[chunk.chunk_id] = fused_scores.get(chunk.chunk_id, 0.0) + (1.0 / (self.rrf_k + rank))
            if chunk.chunk_id in chunk_map:
                chunk_map[chunk.chunk_id].lexical_score = chunk.lexical_score
            else:
                chunk_map[chunk.chunk_id] = chunk

        # Populate RRF scores
        candidates: List[RetrievedChunk] = []
        for cid, score in fused_scores.items():
            c = chunk_map[cid]
            c.rrf_score = float(score)
            candidates.append(c)

        # 5. Rerank top candidates
        top_chunks = self.reranker.rerank(query, candidates, top_n=fused_top_k)
        max_score = top_chunks[0].final_score if top_chunks else 0.0
        is_grounded = max_score >= settings.SIMILARITY_THRESHOLD or (top_chunks and top_chunks[0].semantic_score >= 0.5)

        return RetrievalResult(
            query=query,
            total_candidates=len(candidates),
            top_chunks=top_chunks,
            max_score=float(max_score),
            is_grounded=is_grounded,
            retrieval_method="dense_lexical_rrf_rerank"
        )
