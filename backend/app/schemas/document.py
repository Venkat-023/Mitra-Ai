from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.document import ApprovalStatus, DocumentCategory, LanguageCode

class DocumentChunkBase(BaseModel):
    chunk_index: int
    section_title: Optional[str] = None
    page_number: int = 1
    content: str
    language: str = LanguageCode.EN.value
    token_count: int = 0
    chunk_metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentChunkCreate(DocumentChunkBase):
    embedding: Optional[List[float]] = None

class DocumentChunkRead(DocumentChunkBase):
    id: str
    document_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    category: str = Field(default=DocumentCategory.GENERAL.value)
    source_uri: str = Field(..., max_length=512)
    file_type: str = "pdf"
    language: str = LanguageCode.EN.value
    version: str = "1.0.0"
    effective_from: datetime = Field(default_factory=datetime.utcnow)
    effective_until: Optional[datetime] = None
    doc_metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    approval_status: Optional[ApprovalStatus] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    is_active: Optional[bool] = None

class DocumentRead(DocumentBase):
    id: str
    approval_status: str
    approved_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    is_active: bool
    checksum: Optional[str] = None
    total_pages: int
    created_at: datetime
    updated_at: datetime
    chunk_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailRead(DocumentRead):
    chunks: List[DocumentChunkRead] = Field(default_factory=list)
