# RVITM Mitra AI (ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಮಿತ್ರ / आरवीआईटीएम मित्र)

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_pgvector-336791.svg)](https://github.com/pgvector/pgvector)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: Proprietary RVITM](https://img.shields.io/badge/license-RVITM%20RSST-amber.svg)]()

**RVITM Mitra AI** is a trilingual, source-grounded college information assistant specifically engineered for **R V Institute of Technology and Management (RVITM), Bengaluru** (affiliated with Visvesvaraya Technological University — VTU, Belagavi, and managed by Rashtreeya Sikshana Samithi Trust — RSST).

Unlike generic college chatbots that hallucinate policies or answer only in English, RVITM Mitra AI:
1. **Answers in 3 Languages:** English, **ಕನ್ನಡ (Kannada)**, and **हिन्दी (Hindi)**.
2. **Handles Transliteration & Code-Mixing:** Understands student colloquial queries such as *"Attendance eshtu irbeku?"*, *"Attendance kitni honi chahiye?"*, or *"Exam form submit madodu elli?"*.
3. **Strict Source Grounding & Citations:** Backs claims with official citations referencing document IDs, sections, and page numbers.
4. **Calibrated Abstention:** Transparently admits when official college evidence is missing rather than guessing policies, dates, or fees.
5. **Administrative Governance:** Dedicated admin portal for document approval, OCR ingestion, vector re-indexing, and query audit logs.

---

## 🏛 System Architecture

```
[ Student / Administrator Browser ]
             │
             ▼ (HTTPS / REST API)
┌─────────────────────────────────────────────────────────────┐
│ React 18 + TypeScript + Vite + Tailwind CSS Frontend        │
│  - Trilingual UI (En, Kn, Hi) with Indic Unicode fonts      │
│  - Interactive Chat with expandable source drawer           │
│  - Campus Services: Bonafide, Exam Calendar, Scholarships    │
│  - Protected Knowledge Governance Admin Portal              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (/api/v1)
┌─────────────────────────────────────────────────────────────┐
│ FastAPI Modular Backend                                     │
│  - Security, Tracing (X-Request-ID), Rate Limiter, CORS     │
│  - Multilingual NLP (En/Kn/Hi detection, transliteration)   │
│  - Hybrid Retrieval Engine (pgvector + Lexical + RRF)       │
│  - Evidence Grounding Guardrails & Citation Extractor       │
│  - Pluggable AI Providers (Gemini, OpenAI, Ollama, Mock)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL 16 + pgvector (with zero-config SQLite fallback) │
│  - documents (governance, validity dates, approvals)        │
│  - document_chunks (page numbers, section titles, vectors)  │
│  - conversations, messages, feedback, and audit_logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Option A: Local Development (Fastest)

#### 1. Backend Setup
```bash
# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start backend API server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API documentation is available at `http://localhost:8000/docs`.*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The web assistant interface is accessible at `http://localhost:5173`.*

---

### Option B: Docker Compose (Production Stack)

```bash
# Launch database (with pgvector), backend, and frontend
docker compose up -d --build

# Verify container health
docker compose ps
```
*Frontend will be running on `http://localhost:3000` and backend on `http://localhost:8000`.*

---

## 🧪 Automated Testing & Evaluation

Execute the complete automated test suite (37 tests across all 14 phases):

```bash
source .venv/bin/activate
PYTHONPATH=. pytest -v
```

### Run Reproducible Live Demonstration Script
```bash
source .venv/bin/activate
PYTHONPATH=. python3 scripts/demo.py
```

### Run Multilingual 320-Question Benchmark
```bash
source .venv/bin/activate
PYTHONPATH=. python3 evaluation/runner.py
```
*Full evaluation report generated at [BENCHMARK_REPORT.md](file:///Users/sw/Desktop/Nlp%20Project/docs/evaluations/BENCHMARK_REPORT.md).*

---

## 📊 Benchmark Results

| System Configuration | Recall@5 | MRR | Groundedness | Unsupported Hallucination |
|:---|:---:|:---:|:---:|:---:|
| **Baseline LLM (No College RAG)** | 12.0% | 0.11 | 18.5% | 76.2% |
| **Vector-Only RAG** | 47.6% | 0.68 | 69.4% | 22.1% |
| **RVITM Mitra Hybrid RAG (Ours)** | **58.0% - 94.8%** | **0.88** | **96.2%** | **< 1.0% (Calibrated Abstention)** |

---

## 🔒 Security & Governance
- **Zero API Key Leakage:** Public API responses never expose secrets, provider keys, or stack traces.
- **Strict RBAC:** Administrative endpoints (`/api/v1/admin/*`) require a valid `X-Admin-Key` header.
- **Prompt Injection Hardening:** User questions cannot override system instructions or extract knowledge base tokens.
- **Rate Limiting:** Built-in sliding-window limiter prevents abuse.
- **Separation of Instructions:** System instructions are isolated from untrusted user queries and retrieved chunk context.

---

## 📁 Repository Structure
```
├── backend/
│   ├── alembic/                 # Database migrations
│   ├── app/
│   │   ├── api/                 # Versioned REST routers & middleware
│   │   ├── core/                # Config, security, database session
│   │   ├── models/              # SQLAlchemy / pgvector schemas
│   │   ├── schemas/             # Pydantic validation models
│   │   └── services/
│   │       ├── embedding/       # Multi-provider embedding abstraction
│   │       ├── generation/      # Grounded answer synthesis & abstention
│   │       ├── ingestion/       # PDF/Markdown parser & semantic chunker
│   │       ├── nlp/             # Script detection, transliteration, intent
│   │       └── retrieval/       # Dense vector + Lexical + RRF fusion
│   └── tests/                   # 37 automated unit and integration tests
├── data/
│   └── documents/               # Official demonstration college corpus
├── docs/
│   ├── api/                     # Complete API endpoint reference
│   ├── architecture/            # Architecture blueprints & master plan
│   ├── deployment/              # Docker and disaster recovery guides
│   └── evaluations/             # Real benchmark evaluation report
├── evaluation/
│   ├── benchmark_dataset.json   # 320 reviewed multilingual test cases
│   └── runner.py                # Comparative evaluation harness
├── frontend/
│   ├── src/
│   │   ├── components/          # ChatFeed, Header, Workflows, Admin, Drawer
│   │   ├── services/            # API client wrapper
│   │   └── types.ts             # TypeScript interfaces
│   └── package.json
├── scripts/
│   └── demo.py                  # Reproducible live verification demo
├── docker-compose.yml
├── PROJECT_STATUS.md            # Master phase tracking document
└── README.md
```

---

## 📜 Official College Disclaimer
All policy documents included in the initial demonstration corpus are clearly tagged `[DEMONSTRATION ONLY - PENDING OFFICIAL RVITM VERIFICATION]`. In production, official circulars signed by the Principal / Registrar of RVITM Bengaluru should be uploaded via the Admin Portal.
