"""Sovereign image ingestion and validation pipeline for FORGE."""

import hashlib
import os
from pathlib import Path
import struct
from typing import Optional, Tuple

from app.config import settings
from app.security.models import DataClassification
from app.vision.models import ImageProvenance


class ImageIngestionError(Exception):
    """Base exception for image ingestion failures."""
    pass


class UnsupportedImageType(ImageIngestionError):
    """Raised when an image format is not supported (PNG, JPEG, WebP only)."""
    pass


class ImageSizeLimitError(ImageIngestionError):
    """Raised when an image payload exceeds the allowed size boundary."""
    pass


class PathTraversalError(ImageIngestionError):
    """Raised when an image file path attempts to escape the allowed base directory."""
    pass


SUPPORTED_MIME_TYPES = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
}


def detect_mime_and_dimensions(data: bytes) -> Tuple[str, Optional[int], Optional[int]]:
    """Determine MIME type via magic bytes and parse image dimensions deterministically."""
    if len(data) < 12:
        raise UnsupportedImageType("Image payload too small to contain valid headers.")

    # 1. PNG check: 89 50 4E 47 0D 0A 1A 0A
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        mime = "image/png"
        width, height = None, None
        if len(data) >= 24 and data[12:16] == b"IHDR":
            try:
                width, height = struct.unpack(">II", data[16:24])
            except struct.error:
                pass
        return mime, width, height

    # 2. JPEG check: FF D8 FF
    if data[:3] == b"\xff\xd8\xff":
        mime = "image/jpeg"
        width, height = _parse_jpeg_dimensions(data)
        return mime, width, height

    # 3. WebP check: RIFF....WEBP
    if data[:4] == b"RIFF" and len(data) >= 12 and data[8:12] == b"WEBP":
        mime = "image/webp"
        width, height = _parse_webp_dimensions(data)
        return mime, width, height

    raise UnsupportedImageType("Unsupported image format. FORGE strictly permits PNG, JPEG, and WebP.")


def _parse_jpeg_dimensions(data: bytes) -> Tuple[Optional[int], Optional[int]]:
    """Scan JPEG segments to find SOF markers and extract dimensions safely."""
    try:
        idx = 2
        length = len(data)
        while idx < length - 9:
            if data[idx] != 0xFF:
                idx += 1
                continue
            marker = data[idx + 1]
            # Baseline SOF0 (0xC0), Extended SOF1 (0xC1), Progressive SOF2 (0xC2)
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[idx + 5:idx + 9])
                return w, h
            # Skip variable length marker
            if marker not in (0xD8, 0xD9, 0x00, 0xFF):
                if idx + 4 > length:
                    break
                segment_len = struct.unpack(">H", data[idx + 2:idx + 4])[0]
                idx += 2 + segment_len
            else:
                idx += 2
    except Exception:
        pass
    return None, None


def _parse_webp_dimensions(data: bytes) -> Tuple[Optional[int], Optional[int]]:
    """Parse WebP VP8/VP8L/VP8X chunk dimensions."""
    try:
        chunk = data[12:16]
        if chunk == b"VP8 " and len(data) >= 30:
            # Lossy VP8
            w, h = struct.unpack("<HH", data[26:30])
            return w & 0x3FFF, h & 0x3FFF
        elif chunk == b"VP8L" and len(data) >= 25:
            # Lossless VP8L
            b0, b1, b2, b3 = data[21:25]
            w = 1 + (((b1 & 0x3F) << 8) | b0)
            h = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
            return w, h
        elif chunk == b"VP8X" and len(data) >= 30:
            # Extended VP8X: 24-bit width and height at offset 24..30
            w = 1 + struct.unpack("<I", data[24:27] + b"\x00")[0]
            h = 1 + struct.unpack("<I", data[27:30] + b"\x00")[0]
            return w, h
    except Exception:
        pass
    return None, None


def validate_image_bytes(
    data: bytes,
    filename: str,
    classification: DataClassification = DataClassification.INTERNAL,
) -> ImageProvenance:
    """Validate image bytes, enforce size limit and format rules, and return ImageProvenance."""
    # 1. Size constraint check
    max_size = settings.MAX_IMAGE_SIZE_BYTES
    if len(data) > max_size:
        raise ImageSizeLimitError(
            f"Image payload size ({len(data)} bytes) exceeds maximum sovereign threshold ({max_size} bytes)."
        )

    # 2. Magic byte & MIME type validation
    mime_type, width, height = detect_mime_and_dimensions(data)

    # 3. Filename extension consistency
    clean_filename = os.path.basename(filename.strip().replace("\\", "/"))
    ext = Path(clean_filename).suffix.lower()
    valid_exts = SUPPORTED_MIME_TYPES.get(mime_type, [])
    if ext and ext not in valid_exts:
        raise UnsupportedImageType(
            f"Filename extension '{ext}' does not match detected image MIME type '{mime_type}' (expected {valid_exts})."
        )

    # 4. Deterministic SHA-256 hash
    sha256_hash = hashlib.sha256(data).hexdigest()

    return ImageProvenance(
        filename=clean_filename,
        mime_type=mime_type,
        file_size_bytes=len(data),
        sha256_hash=sha256_hash,
        classification=classification,
        width=width,
        height=height,
    )


def validate_and_load_image_file(
    file_path: str,
    classification: DataClassification = DataClassification.INTERNAL,
    allowed_base_dir: Optional[str] = None,
) -> Tuple[bytes, ImageProvenance]:
    """Load local image file with strict path traversal prevention."""
    base_dir = allowed_base_dir or settings.IMAGE_BASE_DIR
    resolved_base = Path(base_dir).resolve()
    if not resolved_base.exists():
        backend_base = (Path(__file__).resolve().parent.parent.parent / base_dir).resolve()
        if backend_base.exists():
            resolved_base = backend_base

    target_path = Path(file_path)

    # Path traversal check
    if not target_path.is_absolute():
        resolved_target = (resolved_base / target_path).resolve()
    else:
        resolved_target = target_path.resolve()

    try:
        resolved_target.relative_to(resolved_base)
    except ValueError:
        # Check if target resolves within the package data directory when running from repo root
        pkg_base = (Path(__file__).resolve().parent.parent.parent / "data" / "demo" / "images").resolve()
        try:
            resolved_target.relative_to(pkg_base)
            resolved_base = pkg_base
        except ValueError:
            raise PathTraversalError(
                f"Path traversal detected: Target image '{file_path}' resolves outside allowed directory '{base_dir}'."
            )

    if not resolved_target.exists() or not resolved_target.is_file():
        raise FileNotFoundError(f"Image file not found: '{resolved_target}'")

    with open(resolved_target, "rb") as f:
        data = f.read()

    provenance = validate_image_bytes(
        data=data,
        filename=resolved_target.name,
        classification=classification,
    )
    return data, provenance
