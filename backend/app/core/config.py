import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "RVITM Mitra AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = Field(default=False)

    # Security
    SECRET_KEY: str = Field(default="rvitm-mitra-insecure-dev-secret-change-in-prod-2026", description="Secret key for JWT and session signing")
    ADMIN_API_KEY: str = Field(default="admin-rvitm-demo-key-2026", description="Admin Bearer Token for administrative endpoints")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/rvitm_mitra",
        description="Async database connection string. Can use sqlite+aiosqlite:///./test.db for offline testing"
    )
    TEST_DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///:memory:",
        description="In-memory SQLite for high-speed offline automated testing"
    )

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    # AI / LLM Configuration
    LLM_PROVIDER: str = Field(default="mock", description="gemini | openai | anthropic | ollama | mock")
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "gemini-1.5-flash"
    TEMPERATURE: float = 0.1

    # Embedding Configuration
    EMBEDDING_PROVIDER: str = Field(default="mock", description="openai | huggingface | ollama | mock")
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 384  # Standard multilingual dimension (e.g., all-MiniLM-L6-v2 / BGE-M3 / mock)

    # Retrieval Configuration
    CHUNK_SIZE: int = 500  # Target token/character chunk size
    CHUNK_OVERLAP: int = 80
    RETRIEVAL_TOP_K: int = 25
    FUSED_TOP_K: int = 6
    SIMILARITY_THRESHOLD: float = 0.55  # Minimum score before triggering abstention
    RRF_K: int = 60

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    # Storage Paths
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

settings = Settings()
