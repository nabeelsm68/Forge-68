"""Pydantic schemas for Sovereign Local Voice Assistant in FORGE."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceEngineType(str, Enum):
    VOSK = "vosk"
    WHISPER_CPP = "whisper.cpp"
    PIPER = "piper"
    PYTTSX3 = "pyttsx3"
    NONE = "none"


class VoiceEngineStatus(BaseModel):
    """Runtime status of on-premise, zero-cloud speech recognition and synthesis."""
    stt_available: bool = Field(..., description="Whether a local speech-to-text engine is operational")
    tts_available: bool = Field(..., description="Whether a local text-to-speech engine is operational")
    stt_engine: str = Field(default="none", description="Active local STT engine identifier")
    tts_engine: str = Field(default="none", description="Active local TTS engine identifier")
    supported_languages: List[str] = Field(default_factory=lambda: ["en", "hi", "kn"])
    installed_models: Dict[str, str] = Field(
        default_factory=lambda: {
            "en": "not_installed",
            "hi": "not_installed",
            "kn": "not_installed",
        }
    )
    sovereign_guarantee: str = Field(
        default="100% On-Premise Sovereign Audio Pipeline. Zero third-party cloud speech APIs, zero telemetry egress."
    )
    setup_instructions: Dict[str, str] = Field(
        default_factory=lambda: {
            "vosk": "pip install vosk && download vosk-model-small-en-us / hi / kn into data/models/voice/",
            "whisper_cpp": "Install whisper-cli binary locally and configure FORGE_WHISPER_BIN path.",
            "piper": "pip install piper-tts && download onnx voices into data/models/voice/piper/",
        }
    )


class VoiceTranscribeResponse(BaseModel):
    """Result of sovereign speech-to-text transcription."""
    status: str = Field(..., description="Outcome: SUCCESS, ENGINE_UNAVAILABLE, or ERROR")
    text: str = Field(default="", description="Transcribed query text")
    language: str = Field(default="en", description="Detected or requested language code (en, hi, kn)")
    confidence: float = Field(default=0.0, description="Confidence score from local engine (0.0 - 1.0)")
    engine: str = Field(default="none", description="Local engine that performed transcription")
    error_message: Optional[str] = Field(default=None, description="Detailed error if transcription failed")
    sovereign_verified: bool = Field(
        default=True,
        description="Confirms audio was processed strictly on-premise without cloud transmission"
    )


class VoiceSynthesizeRequest(BaseModel):
    """Input payload for sovereign text-to-speech synthesis."""
    text: str = Field(..., max_length=4000, description="Text to synthesize aloud")
    language: str = Field(default="en", description="Language code (en, hi, kn)")
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Playback rate multiplier")


class VoiceSynthesizeResponse(BaseModel):
    """Result of sovereign text-to-speech generation."""
    status: str = Field(..., description="SUCCESS, ENGINE_UNAVAILABLE, or ERROR")
    audio_format: str = Field(default="wav", description="Generated audio format")
    audio_base64: Optional[str] = Field(default=None, description="Base64 encoded audio payload if successful")
    engine: str = Field(default="none", description="Local engine utilized")
    language: str = Field(default="en", description="Synthesis language")
    error_message: Optional[str] = Field(default=None)
