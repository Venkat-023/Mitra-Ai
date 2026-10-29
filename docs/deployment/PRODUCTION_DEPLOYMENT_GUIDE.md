# RVITM Mitra AI — Production Deployment Guide

## 1. System Overview
RVITM Mitra AI is designed for containerized deployment using Docker Compose or Kubernetes, backed by PostgreSQL 16 with the `pgvector` extension.

### Hardware Prerequisites
- **CPU:** 4 vCPUs minimum (8 vCPUs recommended for local embeddings or high concurrent traffic)
- **RAM:** 8 GB minimum (16 GB recommended)
- **Disk:** 50 GB SSD storage
- **OS:** Ubuntu 22.04 LTS / Debian 12 / macOS Server

---

## 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set secure production values:
   - `SECRET_KEY`: Generate a random 64-char key (`openssl rand -hex 32`).
   - `ADMIN_API_KEY`: Strong alphanumeric token for administrative routes.
   - `LLM_PROVIDER`: `gemini` | `openai` | `ollama` | `mock`
   - `EMBEDDING_PROVIDER`: `gemini` | `openai` | `mock`
   - External API keys if using cloud providers: `GEMINI_API_KEY` or `OPENAI_API_KEY`.

---

## 3. Deployment with Docker Compose

1. Build and launch all services:
   ```bash
   docker compose up -d --build
   ```
2. Verify container health:
   ```bash
   docker compose ps
   ```
3. Check backend service health:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
4. Access the web application:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

---

## 4. Database Migrations

Apply Alembic migrations to the running database:
```bash
docker compose exec backend alembic upgrade head
```

---

## 5. Ingestion of Official College Documents

1. Access the Admin Portal via web interface: `http://localhost:3000` (click **Admin Portal** in the top navigation).
2. Enter the configured `ADMIN_API_KEY`.
3. Upload approved college circulars, handbooks, and policy PDFs.
4. Verify chunk extractions and confirm publication to active vector index.
