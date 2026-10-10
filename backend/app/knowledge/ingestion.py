"""Local sovereign document ingestion pipeline for FORGE Industrial Knowledge Fabric."""

import hashlib
import os
import re
from pathlib import Path
from typing import List, Optional, Tuple, Union

from app.config import settings
from app.knowledge.chunker import DeterministicChunker
from app.knowledge.models import DocumentChunk, DocumentType, KnowledgeDocument
from app.security.models import DataClassification


class PathTraversalError(ValueError):
    """Raised when an ingested file path attempts directory traversal outside allowed boundaries."""
    pass


class OcrRequiredError(RuntimeError):
    """Raised when a PDF contains only scanned images or lacks digital text streams."""
    pass


class UnsupportedFormatError(ValueError):
    """Raised when a document format is not supported for local ingestion."""
    pass


def validate_secure_path(
    file_path: Union[str, Path],
    allowed_base_dir: Optional[Union[str, Path]] = None,
) -> Path:
    """Validate that file_path exists, is a regular file, and does not escape allowed root."""
    raw_path_str = str(file_path)

    # Reject traversal sequences across POSIX and Windows separators before path resolution
    norm_path = raw_path_str.replace("\\", "/")
    if (
        ".." in norm_path.split("/")
        or "../" in norm_path
        or "/.." in norm_path
        or norm_path.startswith("..")
        or "..\\" in raw_path_str
    ):
        raise PathTraversalError(f"Directory traversal detected in path: {file_path}")

    path_obj = Path(file_path).resolve()

    # Enforce base directory boundary
    base_dir = allowed_base_dir or settings.KNOWLEDGE_BASE_DIR
    if base_dir:
        base_obj = Path(base_dir).resolve()
        try:
            path_obj.relative_to(base_obj)
        except ValueError:
            raise PathTraversalError(
                f"Access denied: Path '{path_obj}' is outside allowed knowledge root '{base_obj}'"
            )

    if not path_obj.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if not path_obj.is_file():
        raise ValueError(f"Path is not a regular file: {file_path}")

    return path_obj


def calculate_sha256(data_bytes: bytes) -> str:
    """Compute deterministic SHA-256 hash from raw document bytes."""
    hasher = hashlib.sha256()
    hasher.update(data_bytes)
    return hasher.hexdigest()


def extract_equipment_ids(text: str) -> List[str]:
    """Extract standard industrial equipment tags (e.g. R-204, P-201, E-301) from text."""
    matches = re.findall(r"\b([A-Z]{1,3}-\d{3,4})\b", text)
    # Deduplicate while preserving discovery order
    seen = set()
    result = []
    for m in matches:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


def extract_title_and_type(text: str, filename: str) -> Tuple[str, str]:
    """Extract or infer document title and classification type from content or filename."""
    title = ""
    for line in text.splitlines()[:15]:
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped.lstrip("# ").strip()
            break

    if not title:
        title = Path(filename).stem.replace("_", " ").title()

    lower_text = text.lower()
    lower_fn = filename.lower()

    if "sop" in lower_fn or "standard operating procedure" in lower_text:
        doc_type = DocumentType.SOP.value
    elif "inspection" in lower_fn or "ultrasonic" in lower_text or "inspection report" in lower_text:
        doc_type = DocumentType.INSPECTION.value
    elif "spec" in lower_fn or "specification" in lower_text:
        doc_type = DocumentType.SPECIFICATION.value
    elif "maintenance" in lower_fn or "repair" in lower_text or "turnaround" in lower_text:
        doc_type = DocumentType.MAINTENANCE.value
    elif "safety" in lower_fn or "hazard" in lower_text or "loto" in lower_text:
        doc_type = DocumentType.SAFETY.value
    else:
        doc_type = DocumentType.GENERAL.value

    return title, doc_type


class LocalDocumentIngestionPipeline:
    """Sovereign document ingestion pipeline.

    Reads files strictly as passive DATA; never executes any code contained inside.
    """

    def __init__(self, chunker: Optional[DeterministicChunker] = None):
        self.chunker = chunker or DeterministicChunker(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )

    def extract_text_from_file(self, file_path: Path) -> Tuple[str, bytes]:
        """Extract text from TXT, MD, or PDF file, returning text and raw bytes."""
        suffix = file_path.suffix.lower()

        with open(file_path, "rb") as f:
            raw_bytes = f.read()

        if suffix in (".txt", ".md"):
            try:
                text = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                text = raw_bytes.decode("latin-1")
            return text, raw_bytes

        elif suffix == ".pdf":
            import pypdf

            reader = pypdf.PdfReader(file_path)
            extracted_pages = []
            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(f"[Page {page_idx + 1}]\n{page_text.strip()}")
                else:
                    extracted_pages.append(page_text)

            full_text = "\n\n".join(extracted_pages).strip()

            # Detection of scanned/image-only PDFs
            stripped_text = re.sub(r"\[Page \d+\]", "", full_text).strip()
            if len(reader.pages) > 0 and len(stripped_text) < 15:
                raise OcrRequiredError(
                    f"PDF '{file_path.name}' contains no extractable digital text stream. "
                    "Scanned image detected: requires OCR engine for local text extraction."
                )

            return full_text, raw_bytes

        elif suffix == ".docx":
            import xml.etree.ElementTree as ET
            import zipfile

            try:
                with zipfile.ZipFile(file_path, "r") as z:
                    if "word/document.xml" not in z.namelist():
                        raise ValueError(f"DOCX '{file_path.name}' is missing word/document.xml.")
                    xml_content = z.read("word/document.xml")

                tree = ET.fromstring(xml_content)
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                paragraphs = []
                for p in tree.findall(".//w:p", ns):
                    p_text = "".join(node.text for node in p.findall(".//w:t", ns) if node.text)
                    if p_text.strip():
                        paragraphs.append(p_text.strip())

                full_text = "\n\n".join(paragraphs).strip()
                if not full_text:
                    raise ValueError(f"DOCX '{file_path.name}' contains no readable text content.")
                return full_text, raw_bytes
            except Exception as docx_err:
                raise ValueError(f"Failed to parse DOCX '{file_path.name}': {docx_err}") from docx_err

        else:
            raise UnsupportedFormatError(
                f"Unsupported document format '{suffix}'. Supported formats: .txt, .md, .pdf, .docx"
            )

    def ingest_file(
        self,
        file_path: Union[str, Path],
        allowed_base_dir: Optional[Union[str, Path]] = None,
        classification: Optional[DataClassification] = None,
        document_type: Optional[str] = None,
        equipment_ids: Optional[List[str]] = None,
    ) -> Tuple[KnowledgeDocument, List[DocumentChunk]]:
        """Ingest a local document, calculate SHA-256, create KnowledgeDocument, and chunk it."""
        secure_path = validate_secure_path(file_path, allowed_base_dir=allowed_base_dir)

        # 1. Read local file & extract text
        text, raw_bytes = self.extract_text_from_file(secure_path)

        # 2. Calculate SHA-256 content hash
        content_hash = calculate_sha256(raw_bytes)

        # 3. Extract title, type, and equipment identifiers
        inferred_title, inferred_type = extract_title_and_type(text, secure_path.name)
        inferred_equip = extract_equipment_ids(text)

        final_equip = equipment_ids if equipment_ids is not None else inferred_equip
        final_type = document_type if document_type is not None else inferred_type
        final_classification = classification or DataClassification.INTERNAL

        # 4. Create KnowledgeDocument
        doc = KnowledgeDocument(
            filename=secure_path.name,
            title=inferred_title,
            document_type=final_type,
            equipment_ids=final_equip,
            classification=final_classification,
            source_path=str(secure_path),
            content_hash=content_hash,
        )

        # 5. Chunk the text into DocumentChunk objects
        chunks = self.chunker.chunk_document(doc, text)

        return doc, chunks
