"""Pydantic request and response schemas for the Knowledge Fabric HTTP API."""

from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

from app.knowledge.models import KnowledgeDocument, RetrievalResult
from app.security.models import DataClassification
from app.verification.evidence import EvidenceRecord


class KnowledgeIngestRequest(BaseModel):
    """Payload to ingest a local document into the Sovereign Knowledge Fabric."""
    file_path: str = Field(..., description="Local path to the document (.txt, .md, .pdf)")
    classification: Optional[DataClassification] = Field(
        default=None,
        description="Optional security classification override (e.g. PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, CRITICAL)"
    )
    document_type: Optional[str] = Field(
        default=None,
        description="Optional document type override (e.g. SOP, INSPECTION, SPECIFICATION, MAINTENANCE, SAFETY, GENERAL)"
    )
    equipment_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional equipment identifiers to attach (e.g. ['R-204'])"
    )


class KnowledgeIngestResponse(BaseModel):
    """Response confirming document ingestion, hashing, and chunk indexing."""
    status: str = Field(default="success")
    document: Optional[KnowledgeDocument] = None
    chunks_created: int = 0
    document_id: Optional[str] = None
    filename: Optional[str] = None
    chunks_count: Optional[int] = None
    content_hash: Optional[str] = None
    classification: Optional[DataClassification] = None

    @model_validator(mode="after")
    def populate_root_aliases(self) -> "KnowledgeIngestResponse":
        if self.document is not None:
            if not self.document_id:
                self.document_id = self.document.document_id
            if not self.filename:
                self.filename = self.document.filename
            if not self.content_hash:
                self.content_hash = self.document.content_hash
            if not self.classification:
                self.classification = self.document.classification
            if not self.chunks_count:
                self.chunks_count = self.chunks_created
        return self


class KnowledgeSearchRequest(BaseModel):
    """Payload to query the local sovereign vector index."""
    query: str = Field(..., description="Natural language search query")
    top_k: int = Field(default=5, ge=1, le=50, description="Maximum number of chunks to retrieve")
    classification: Optional[DataClassification] = Field(
        default=None,
        description="Optional data classification filter"
    )
    language: Optional[str] = Field(default="en", description="Target response language (en, hi, kn)")
    synthesize: bool = Field(default=True, description="Whether to synthesize a grounded answer using sovereign model")



class KnowledgeSearchResponse(BaseModel):
    """Ranked retrieval results with document metadata and evidence provenance."""
    query: str
    total_results: int
    results: List[RetrievalResult]
    evidence: List[EvidenceRecord]
    synthesized_answer: Optional[str] = None
    cited_sources: List[str] = Field(default_factory=list)
    language: Optional[str] = "en"
    denied_records_count: int = Field(default=0, description="Count of relevant records restricted by clearance")
    denied_record_names: List[str] = Field(default_factory=list, description="Titles of matching records requiring higher clearance")

