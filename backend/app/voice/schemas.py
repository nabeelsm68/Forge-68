"""Pydantic schemas for Sovereign Local Voice Assistant in FORGE."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceEngineType(str, Enum):
    FASTER_WHISPER = "faster-whisper"
    VOSK = "vosk"
    WHISPER_CPP = "whisper.cpp"
    PIPER = "piper"
    MMS_TTS = "mms_tts"
    PYTTSX3 = "pyttsx3"
    NONE = "none"


class VoiceEngineStatus(BaseModel):
    """Runtime status of on-premise, zero-cloud speech recognition and synthesis."""
    stt_available: bool = Field(..., description="Whether a local speech-to-text engine and model are operational")
    tts_available: bool = Field(..., description="Whether a local text-to-speech engine and voice are operational")
    stt_engine: str = Field(default="none", description="Active local STT engine identifier")
    tts_engine: str = Field(default="none", description="Active local TTS engine identifier")
    supported_languages: List[str] = Field(default_factory=lambda: ["en", "hi", "kn"])
    installed_models: Dict[str, str] = Field(
        default_factory=lambda: {
            "en": "not_installed",
            "hi": "not_installed",
            "kn": "not_installed",
        },
        description="Legacy field mapping language to installation status"
    )
    stt_models: Dict[str, str] = Field(
        default_factory=lambda: {
            "en": "not_installed",
            "hi": "not_installed",
            "kn": "not_installed",
        },
        description="Per-language speech recognition model availability"
    )
    tts_voices: Dict[str, str] = Field(
        default_factory=lambda: {
            "en": "not_installed",
            "hi": "not_installed",
            "kn": "not_installed",
        },
        description="Per-language text-to-speech voice availability"
    )
    installed_voices_details: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Diagnostic list of local SAPI5 or Piper voices detected on the host"
    )
    models_loaded: Dict[str, bool] = Field(
        default_factory=lambda: {"en": False, "hi": False, "kn": False},
        description="Whether models are actively loaded in memory"
    )
    inference_tested: Dict[str, bool] = Field(
        default_factory=lambda: {"en": False, "hi": False, "kn": False},
        description="Whether actual inference has completed successfully"
    )
    cloud_providers_configured: int = Field(
        default=0,
        description="Must be strictly 0 in compliance with FORGE Sovereign Architecture"
    )
    sovereign_guarantee: str = Field(
        default="100% On-Premise Sovereign Audio Pipeline. Zero third-party cloud speech APIs, zero telemetry egress."
    )
    setup_instructions: Dict[str, str] = Field(
        default_factory=lambda: {
            "vosk": "pip install vosk && download model from alphacephei.com/vosk/models into data/models/voice/vosk/{lang}",
            "whisper_cpp": "Install whisper-cli binary locally and configure WHISPER_CPP_PATH.",
            "pyttsx3": "Windows SAPI5 offline voices (Windows Settings > Time & Language > Speech > Add Voices for Hindi).",
            "piper": "pip install piper-tts && place onnx models in data/models/voice/piper/{lang}.onnx",
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
    status: str = Field(..., description="SUCCESS, VOICE_UNAVAILABLE, ENGINE_UNAVAILABLE, or ERROR")
    audio_format: str = Field(default="wav", description="Generated audio format")
    audio_base64: Optional[str] = Field(default=None, description="Base64 encoded audio payload if successful")
    engine: str = Field(default="none", description="Local engine utilized")
    language: str = Field(default="en", description="Synthesis language")
    voice_name: Optional[str] = Field(default=None, description="Identifier of the voice utilized")
    duration_ms: float = Field(default=0.0, description="Synthesis generation duration in milliseconds")
    error_message: Optional[str] = Field(default=None)
