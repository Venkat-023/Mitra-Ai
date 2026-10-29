import os
import glob
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import init_db, AsyncSessionLocal
from backend.app.api.middleware import SecurityAndTracingMiddleware
from backend.app.api.v1.router import api_router
from backend.app.services.ingestion.pipeline import IngestionPipeline
from sqlalchemy import select, func
from backend.app.models.document import Document

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables
    await init_db()

    # Seed demonstration documents if missing from database
    async with AsyncSessionLocal() as session:
        existing_res = await session.execute(select(Document.checksum).where(Document.is_active == True))
        existing_checksums = set(existing_res.scalars().all())

        doc_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "documents")
        pipeline = IngestionPipeline()
        for filepath in sorted(glob.glob(os.path.join(doc_dir, "*.md"))):
            filename = os.path.basename(filepath)
            with open(filepath, "rb") as f:
                content_bytes = f.read()

            checksum = pipeline.compute_checksum(content_bytes)
            if checksum in existing_checksums:
                continue

            category = "academic"
            if "bonafide" in filename:
                category = "administration"
            elif "scholarship" in filename:
                category = "scholarships"
            elif "anti_ragging" in filename:
                category = "student_welfare"
            elif "department" in filename:
                category = "administration"
            elif "placement" in filename:
                category = "student_welfare"
            elif "cutoff" in filename or "admission" in filename:
                category = "admissions"

            try:
                await pipeline.ingest_document(
                    session=session,
                    content_bytes=content_bytes,
                    filename=filename,
                    category=category,
                    version="1.0.0",
                    auto_approve=True,
                    actor="system_seeder"
                )
                existing_checksums.add(checksum)
            except Exception:
                pass

    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Source-grounded trilingual college information assistant for R V Institute of Technology and Management (Bengaluru).",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and Tracing Middleware
app.add_middleware(SecurityAndTracingMiddleware)

# API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
