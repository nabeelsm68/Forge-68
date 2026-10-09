"""Knowledge domain models for the FORGE Sovereign Industrial Knowledge Fabric."""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.security.models import DataClassification


class DocumentType(str, Enum):
    """Industrial document types."""
    SOP = "SOP"
    INSPECTION = "INSPECTION"
    SPECIFICATION = "SPECIFICATION"
    MAINTENANCE = "MAINTENANCE"
    SAFETY = "SAFETY"
    GENERAL = "GENERAL"


class KnowledgeDocument(BaseModel):
    """Metadata and integrity representation of a local sovereign document."""
    document_id: str = Field(default_factory=lambda: f"doc-{uuid.uuid4().hex[:12]}")
    filename: str = Field(..., description="Original filename")
    title: str = Field(..., description="Document title")
    document_type: str = Field(default="GENERAL", description="Type/category of industrial document")
    equipment_ids: List[str] = Field(default_factory=list, description="Associated equipment tags (e.g. R-204, P-201)")
    classification: DataClassification = Field(
        default=DataClassification.INTERNAL,
        description="Data classification level (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, CRITICAL)"
    )
    source_path: str = Field(..., description="Relative or sanitized local source path")
    content_hash: str = Field(..., description="SHA-256 content digest for tamper verification")
    version: str = Field(default="1.0", description="Document version string")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DocumentChunk(BaseModel):
    """Deterministic chunk of a knowledge document with provenance metadata."""
    chunk_id: str = Field(default_factory=lambda: f"chk-{uuid.uuid4().hex[:12]}")
    document_id: str = Field(..., description="Foreign key to KnowledgeDocument.document_id")
    text: str = Field(..., description="Extracted raw text content of the chunk")
    chunk_index: int = Field(..., description="Sequential 0-indexed position within the parent document")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Preserved document metadata (document_id, filename, title, document_type, equipment_ids, classification, chunk_index)"
    )

    @property
    def classification(self) -> Any:
        return self.metadata.get("classification", "INTERNAL")


class RetrievalResult(BaseModel):
    """Ranked document chunk retrieval item."""
    chunk: DocumentChunk = Field(..., description="Retrieved document chunk with provenance")
    score: float = Field(..., description="Similarity score (e.g. cosine similarity [0.0 - 1.0])")
    rank: int = Field(..., description="1-indexed relevance rank in search results")
