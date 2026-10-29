import pytest
import os
import json
from evaluation.runner import BenchmarkRunner

def test_benchmark_dataset_integrity():
    dataset_path = "evaluation/multilingual_benchmark.json"
    assert os.path.exists(dataset_path), "Benchmark dataset must exist."
    with open(dataset_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    assert len(cases) >= 300, f"Expected at least 300 test cases, got {len(cases)}"
    
    # Verify presence of English, Hindi, Kannada, and transliterated cases
    languages = {c["language"] for c in cases}
    assert "en" in languages
    assert "hi" in languages
    assert "kn" in languages
    assert "kn-Latn" in languages
    assert "hi-Latn" in languages

    # Verify structured fields
    for c in cases[:10]:
        assert "id" in c
        assert "query" in c
        assert "intent" in c
        assert "expected_answerability" in c

@pytest.mark.asyncio
async def test_evaluation_runner_execution():
    runner = BenchmarkRunner()
    # Run a small slice of 10 cases to verify runner functionality
    summary = await runner.run_evaluation(max_cases=10)
    assert summary["total_benchmark_cases"] == 10
    assert "hybrid_recall_at_5" in summary["metrics"]
    assert "latency_p50_ms" in summary["metrics"]
    assert summary["metrics"]["latency_p50_ms"] > 0
