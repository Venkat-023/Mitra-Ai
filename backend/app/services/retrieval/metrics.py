import math
from typing import List, Set

class RetrievalMetrics:
    """Calculates IR evaluation metrics: Recall@K, MRR, and nDCG@K."""

    @staticmethod
    def recall_at_k(retrieved_ids: List[str], relevant_ids: Set[str], k: int) -> float:
        if not relevant_ids:
            return 1.0
        top_k = set(retrieved_ids[:k])
        hits = len(top_k.intersection(relevant_ids))
        return hits / len(relevant_ids)

    @staticmethod
    def mean_reciprocal_rank(retrieved_ids: List[str], relevant_ids: Set[str]) -> float:
        if not relevant_ids:
            return 1.0
        for rank, item_id in enumerate(retrieved_ids, start=1):
            if item_id in relevant_ids:
                return 1.0 / rank
        return 0.0

    @staticmethod
    def ndcg_at_k(retrieved_ids: List[str], relevant_ids: Set[str], k: int) -> float:
        if not relevant_ids:
            return 1.0
        top_k = retrieved_ids[:k]
        dcg = 0.0
        for i, item_id in enumerate(top_k, start=1):
            rel = 1.0 if item_id in relevant_ids else 0.0
            dcg += rel / math.log2(i + 1)

        # Ideal DCG
        ideal_hits = min(len(relevant_ids), k)
        idcg = sum(1.0 / math.log2(i + 1) for i in range(1, ideal_hits + 1))
        if idcg == 0.0:
            return 0.0
        return dcg / idcg
