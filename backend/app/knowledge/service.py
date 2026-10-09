"""Sovereign Knowledge Service orchestrating ingestion, embedding, indexing, and retrieval."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from app.config import settings
from app.knowledge.embeddings import BaseEmbeddingProvider, get_embedding_provider
from app.knowledge.index import NumpyCosineVectorIndex, VectorIndex
from app.knowledge.ingestion import (
    LocalDocumentIngestionPipeline,
    OcrRequiredError,
    PathTraversalError,
    UnsupportedFormatError,
    validate_secure_path,
)
from app.knowledge.models import DocumentChunk, KnowledgeDocument, RetrievalResult
from app.security.models import DataClassification
from app.verification.evidence import EvidenceRecord


class KnowledgeService:
    """Sovereign Knowledge Fabric service.

    Orchestrates local document ingestion, embedding computation, vector indexing,
    and similarity retrieval. Strictly sovereign: no external cloud calls, no LLM calls.
    """

    def __init__(
        self,
        embedding_provider: Optional[BaseEmbeddingProvider] = None,
        vector_index: Optional[VectorIndex] = None,
        ingestion_pipeline: Optional[LocalDocumentIngestionPipeline] = None,
    ):
        self.embedding_provider = embedding_provider or get_embedding_provider()
        self.vector_index = vector_index or NumpyCosineVectorIndex()
        self.ingestion_pipeline = ingestion_pipeline or LocalDocumentIngestionPipeline()
        self._documents: Dict[str, KnowledgeDocument] = {}
        self._document_chunks: Dict[str, List[DocumentChunk]] = {}

    async def ingest_document(
        self,
        file_path: Union[str, Path],
        allowed_base_dir: Optional[Union[str, Path]] = None,
        classification: Optional[DataClassification] = None,
        document_type: Optional[str] = None,
        equipment_ids: Optional[List[str]] = None,
    ) -> Tuple[KnowledgeDocument, int]:
        """Ingest a local document, compute sovereign embeddings, and register in local vector index."""
        # Ingest, compute hash, and chunk
        doc, chunks = self.ingestion_pipeline.ingest_file(
            file_path=file_path,
            allowed_base_dir=allowed_base_dir,
            classification=classification,
            document_type=document_type,
            equipment_ids=equipment_ids,
        )

        if chunks:
            # Generate local embeddings
            texts = [c.text for c in chunks]
            embeddings = await self.embedding_provider.embed_texts(texts)

            # Store in local index
            self.vector_index.add(chunks, embeddings)

        self._documents[doc.document_id] = doc
        self._document_chunks[doc.document_id] = chunks
        return doc, len(chunks)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        classification_filter: Optional[Union[DataClassification, str]] = None,
        max_classification: Optional[Union[DataClassification, str]] = None,
    ) -> List[RetrievalResult]:
        """Execute similarity search against local vector index without calling any LLM."""
        if not query or not query.strip():
            return []

        query_vec = await self.embedding_provider.embed_query(query)
        results = self.vector_index.search(
            query_embedding=query_vec,
            top_k=top_k,
            classification_filter=classification_filter,
            max_classification=max_classification,
        )
        return results

    async def search_as_evidence(
        self,
        query: str,
        top_k: int = 5,
        classification_filter: Optional[Union[DataClassification, str]] = None,
        max_classification: Optional[Union[DataClassification, str]] = None,
    ) -> List[EvidenceRecord]:
        """Search local index and convert ranked results directly to verified EvidenceRecords."""
        results = await self.search(
            query=query,
            top_k=top_k,
            classification_filter=classification_filter,
            max_classification=max_classification,
        )
        evidence_list = [EvidenceRecord.from_retrieval_result(r) for r in results]
        return evidence_list


    def get_document(self, document_id: str) -> Optional[KnowledgeDocument]:
        """Retrieve stored document metadata by ID."""
        doc = self._documents.get(document_id)
        if doc:
            return doc
        # Fallback lookup by filename or filename stem
        for d in self._documents.values():
            if d.filename == document_id or Path(d.filename).stem == document_id:
                return d
        return None

    def get_document_chunks(self, document_id: str) -> List[DocumentChunk]:
        """Retrieve stored chunks for a document ID."""
        doc = self.get_document(document_id)
        if not doc:
            return []
        return self._document_chunks.get(doc.document_id, [])

    def get_document_content(self, document_id: str) -> Dict[str, Any]:
        """Safely read document text, classification, and OCR extraction status."""
        doc = self.get_document(document_id)
        if not doc:
            raise FileNotFoundError(f"Document '{document_id}' not found in Knowledge Fabric registry.")

        source_path = Path(doc.source_path)
        chunks = self._document_chunks.get(doc.document_id, [])

        try:
            # Safely validate path boundary and extract text
            secure_path = validate_secure_path(source_path)
            extracted_text, raw_bytes = self.ingestion_pipeline.extract_text_from_file(secure_path)
            return {
                "document_id": doc.document_id,
                "filename": doc.filename,
                "title": doc.title,
                "classification": doc.classification.value if hasattr(doc.classification, "value") else str(doc.classification),
                "document_type": doc.document_type,
                "equipment_ids": doc.equipment_ids,
                "source_path": doc.source_path,
                "content_hash": doc.content_hash,
                "created_at": doc.created_at,
                "version": doc.version,
                "chunks_count": len(chunks),
                "text": extracted_text,
                "extracted_text": extracted_text,
                "status": "EXTRACTED",
                "ocr_status": "EXTRACTED",
                "error_message": None,
                "is_ocr_required": False,
                "chunks": [{"chunk_id": c.chunk_id, "chunk_index": c.chunk_index, "text": c.text} for c in chunks],
            }
        except OcrRequiredError as ocr_err:
            return {
                "document_id": doc.document_id,
                "filename": doc.filename,
                "title": doc.title,
                "classification": doc.classification.value if hasattr(doc.classification, "value") else str(doc.classification),
                "document_type": doc.document_type,
                "equipment_ids": doc.equipment_ids,
                "source_path": doc.source_path,
                "content_hash": doc.content_hash,
                "created_at": doc.created_at,
                "version": doc.version,
                "chunks_count": 0,
                "text": "",
                "extracted_text": "",
                "status": "OCR_REQUIRED",
                "ocr_status": "OCR_REQUIRED",
                "error_message": str(ocr_err),
                "is_ocr_required": True,
                "chunks": [],
            }
        except Exception as exc:
            cached_text = "\n\n".join(c.text for c in chunks) if chunks else ""
            return {
                "document_id": doc.document_id,
                "filename": doc.filename,
                "title": doc.title,
                "classification": doc.classification.value if hasattr(doc.classification, "value") else str(doc.classification),
                "document_type": doc.document_type,
                "equipment_ids": doc.equipment_ids,
                "source_path": doc.source_path,
                "content_hash": doc.content_hash,
                "created_at": doc.created_at,
                "version": doc.version,
                "chunks_count": len(chunks),
                "text": cached_text,
                "extracted_text": cached_text,
                "status": "EXTRACTED_FROM_CACHE" if chunks else "ERROR",
                "ocr_status": "EXTRACTED" if chunks else "ERROR",
                "error_message": str(exc) if not chunks else None,
                "is_ocr_required": False,
                "chunks": [{"chunk_id": c.chunk_id, "chunk_index": c.chunk_index, "text": c.text} for c in chunks],
            }

    async def upload_and_ingest(
        self,
        filename: str,
        content_bytes: bytes,
        classification: Optional[DataClassification] = None,
        document_type: Optional[str] = None,
        equipment_ids: Optional[List[str]] = None,
    ) -> Tuple[KnowledgeDocument, int]:
        """Safely save and ingest an uploaded document into the local Knowledge Fabric."""
        # 1. Clean filename to prevent traversal
        safe_name = Path(filename).name.strip()
        if not safe_name or ".." in safe_name:
            raise PathTraversalError("Invalid filename provided.")

        suffix = Path(safe_name).suffix.lower()
        if suffix not in (".txt", ".md", ".pdf"):
            raise UnsupportedFormatError(f"Unsupported format '{suffix}'. Allowed: .txt, .md, .pdf")

        # 2. Check size limit (max 25MB)
        if len(content_bytes) > 25 * 1024 * 1024:
            raise ValueError("File exceeds maximum allowed size of 25MB.")

        # 3. Save into configured local knowledge root
        target_dir = Path(settings.KNOWLEDGE_BASE_DIR).resolve()
        target_dir.mkdir(parents=True, exist_ok=True)
        dest_path = target_dir / safe_name

        with open(dest_path, "wb") as f:
            f.write(content_bytes)

        # 4. Ingest and index
        return await self.ingest_document(
            file_path=dest_path,
            allowed_base_dir=target_dir,
            classification=classification,
            document_type=document_type,
            equipment_ids=equipment_ids,
        )

    def list_documents(self) -> List[KnowledgeDocument]:
        """List all ingested documents."""
        return list(self._documents.values())

    def save_index(self, directory: Union[str, Path]) -> None:
        """Persist vector index to local filesystem."""
        self.vector_index.save(directory)

    def load_index(self, directory: Union[str, Path]) -> None:
        """Load vector index from local filesystem."""
        self.vector_index.load(directory)


knowledge_service = KnowledgeService()
