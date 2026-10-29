import re
from typing import List
from backend.app.services.retrieval.base import RetrievedChunk

class MultilingualReranker:
    """
    Reranks candidate chunks using token overlap, exact entity/acronym matching,
    and section heading relevance.
    """

    def rerank(self, query: str, candidates: List[RetrievedChunk], top_n: int = 6) -> List[RetrievedChunk]:
        if not candidates:
            return []

        query_terms = set(re.findall(r'[\w\-]+|[\u0900-\u097F]+|[\u0C80-\u0CFF]+', query.lower()))
        
        for chunk in candidates:
            # Composite score combining dense semantic, sparse lexical, and RRF rank signals
            score = (0.5 * chunk.semantic_score) + (0.5 * chunk.lexical_score) + (chunk.rrf_score * 5.0)
            content_lower = chunk.content.lower()
            section_lower = chunk.section_title.lower()

            # Exact keyword match bonus
            matched_terms = sum(1 for t in query_terms if t in content_lower)
            coverage = matched_terms / max(len(query_terms), 1)

            # Section title bonus
            section_matches = sum(1 for t in query_terms if t in section_lower)
            if section_matches > 0:
                score += 0.25 * (section_matches / max(len(query_terms), 1))

            # Coverage weight
            score += 0.40 * coverage

            # Acronym match bonus (e.g., VTU, CIE, SEE, SSP, NSP)
            for acronym in ["vtu", "cie", "see", "ssp", "nsp", "hod", "bonafide"]:
                if acronym in query_terms and acronym in content_lower:
                    score += 0.20

            chunk.final_score = float(score)

        # Sort descending by final score
        sorted_candidates = sorted(candidates, key=lambda c: c.final_score, reverse=True)
        for idx, c in enumerate(sorted_candidates, start=1):
            c.rank = idx

        return sorted_candidates[:top_n]
