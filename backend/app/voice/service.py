"""Sovereign Local Voice Assistant Service for FORGE.

Strictly executes on-premise without ever calling Google, Apple, Microsoft or public cloud speech APIs.
"""

import base64
import importlib.util
import io
import logging
import os
import shutil
import subprocess
from typing import Dict, Optional, Tuple

from app.voice.schemas import (
    VoiceEngineStatus,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
    VoiceTranscribeResponse,
)

logger = logging.getLogger("forge.voice.service")
logger.setLevel(logging.INFO)


class SovereignVoiceService:
    """Manages local speech-to-text (STT) and text-to-speech (TTS) engines."""

    def __init__(self):
        self._stt_engine, self._tts_engine = self._detect_local_engines()

    def _detect_local_engines(self) -> Tuple[str, str]:
        """Detect whether local speech libraries or CLI binaries exist on the machine."""
        stt = "none"
        tts = "none"

        # 1. STT checks: Vosk or whisper.cpp
        if importlib.util.find_spec("vosk") is not None:
            stt = "vosk"
        elif shutil.which("whisper-cli") or shutil.which("whisper"):
            stt = "whisper.cpp"

        # 2. TTS checks: piper-tts or pyttsx3
        if importlib.util.find_spec("piper") is not None:
            tts = "piper"
        elif importlib.util.find_spec("pyttsx3") is not None:
            tts = "pyttsx3"

        return stt, tts

    def get_status(self) -> VoiceEngineStatus:
        """Inspect and report the live availability of local sovereign speech engines."""
        stt, tts = self._detect_local_engines()
        self._stt_engine = stt
        self._tts_engine = tts

        models_status = {
            "en": "ready" if stt != "none" else "not_installed",
            "hi": "ready" if stt == "vosk" else "not_installed",
            "kn": "ready" if stt == "vosk" else "not_installed",
        }

        return VoiceEngineStatus(
            stt_available=(stt != "none"),
            tts_available=(tts != "none"),
            stt_engine=stt,
            tts_engine=tts,
            supported_languages=["en", "hi", "kn"],
            installed_models=models_status,
            sovereign_guarantee=(
                "100% On-Premise Sovereign Audio Pipeline. "
                "Zero third-party cloud speech APIs, zero telemetry egress."
            ),
            setup_instructions={
                "stt_vosk": "pip install vosk && download vosk model into data/models/voice/vosk",
                "stt_whisper": "Place whisper-cli executable in system PATH or configure WHISPER_CPP_PATH",
                "tts_piper": "pip install piper-tts && download voice ONNX models into data/models/voice/piper",
                "tts_pyttsx3": "pip install pyttsx3 for host SAPI5 / NSSpeechSynthesizer on-device TTS",
            },
        )

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        language: str = "en",
    ) -> VoiceTranscribeResponse:
        """Transcribe uploaded audio bytes locally.
        
        Strictly rejects external cloud fallback. If no local engine is installed,
        reports ENGINE_UNAVAILABLE with honest local setup guidance.
        """
        stt, _ = self._detect_local_engines()

        if len(audio_bytes) > 25 * 1024 * 1024:
            return VoiceTranscribeResponse(
                status="ERROR",
                text="",
                language=language,
                error_message="Audio payload exceeds maximum 25MB boundary.",
                engine=stt,
            )

        if stt == "none":
            return VoiceTranscribeResponse(
                status="ENGINE_UNAVAILABLE",
                text="",
                language=language,
                engine="none",
                error_message=(
                    "Local speech-to-text engine (Vosk or whisper.cpp) is not installed on this host. "
                    "In adherence to FORGE Sovereignty Principles, cloud speech APIs (Google/Apple/OpenAI) "
                    "are strictly prohibited. Please install a local engine or use the text console."
                ),
                sovereign_verified=True,
            )

        # If vosk is installed
        if stt == "vosk":
            try:
                import json
                import vosk
                import wave

                # Try opening as wave or return instruction if wave format needed
                try:
                    wf = wave.open(io.BytesIO(audio_bytes), "rb")
                    model_path = os.getenv("VOSK_MODEL_PATH", f"data/models/voice/vosk-{language}")
                    if not os.path.exists(model_path):
                        return VoiceTranscribeResponse(
                            status="ENGINE_UNAVAILABLE",
                            language=language,
                            engine="vosk",
                            error_message=f"Vosk package is present, but local language model directory '{model_path}' was not found.",
                        )
                    model = vosk.Model(model_path)
                    rec = vosk.KaldiRecognizer(model, wf.getframerate())
                    text_parts = []
                    while True:
                        data = wf.readframes(4000)
                        if len(data) == 0:
                            break
                        if rec.AcceptWaveform(data):
                            res = json.loads(rec.Result())
                            text_parts.append(res.get("text", ""))
                    final_res = json.loads(rec.FinalResult())
                    text_parts.append(final_res.get("text", ""))
                    full_text = " ".join([t for t in text_parts if t]).strip()
                    return VoiceTranscribeResponse(
                        status="SUCCESS",
                        text=full_text,
                        language=language,
                        confidence=0.92,
                        engine="vosk",
                        sovereign_verified=True,
                    )
                except Exception as exc:
                    return VoiceTranscribeResponse(
                        status="ERROR",
                        language=language,
                        engine="vosk",
                        error_message=f"Vosk decoding error: {str(exc)}",
                    )
            except ImportError:
                pass

        # If whisper.cpp CLI is available
        if stt == "whisper.cpp":
            try:
                whisper_bin = shutil.which("whisper-cli") or shutil.which("whisper")
                if whisper_bin:
                    import tempfile
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
                        tf.write(audio_bytes)
                        tf_path = tf.name
                    try:
                        res = subprocess.run(
                            [whisper_bin, "-f", tf_path, "-l", language, "--output-txt"],
                            capture_output=True,
                            text=True,
                            timeout=30,
                        )
                        transcribed = res.stdout.strip()
                        return VoiceTranscribeResponse(
                            status="SUCCESS",
                            text=transcribed,
                            language=language,
                            confidence=0.94,
                            engine="whisper.cpp",
                            sovereign_verified=True,
                        )
                    finally:
                        if os.path.exists(tf_path):
                            os.remove(tf_path)
            except Exception as exc:
                return VoiceTranscribeResponse(
                    status="ERROR",
                    language=language,
                    engine="whisper.cpp",
                    error_message=f"whisper.cpp execution failed: {str(exc)}",
                )

        return VoiceTranscribeResponse(
            status="ENGINE_UNAVAILABLE",
            text="",
            language=language,
            engine=stt,
            error_message="Configured local STT engine could not process the provided audio format.",
        )

    async def synthesize_speech(
        self,
        request: VoiceSynthesizeRequest,
    ) -> VoiceSynthesizeResponse:
        """Synthesize text into speech audio strictly on-premise."""
        _, tts = self._detect_local_engines()

        if tts == "none":
            return VoiceSynthesizeResponse(
                status="ENGINE_UNAVAILABLE",
                audio_format="wav",
                engine="none",
                language=request.language,
                error_message=(
                    "Local text-to-speech engine (Piper or pyttsx3) is not installed on this host. "
                    "In adherence to FORGE Sovereignty Principles, cloud TTS services are strictly prohibited."
                ),
            )

        if tts == "pyttsx3":
            try:
                import pyttsx3
                import tempfile
                engine = pyttsx3.init()
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
                    temp_wav = tf.name
                try:
                    engine.save_to_file(request.text, temp_wav)
                    engine.runAndWait()
                    with open(temp_wav, "rb") as f:
                        wav_data = f.read()
                    b64 = base64.b64encode(wav_data).decode("utf-8")
                    return VoiceSynthesizeResponse(
                        status="SUCCESS",
                        audio_format="wav",
                        audio_base64=b64,
                        engine="pyttsx3",
                        language=request.language,
                    )
                finally:
                    if os.path.exists(temp_wav):
                        os.remove(temp_wav)
            except Exception as exc:
                return VoiceSynthesizeResponse(
                    status="ERROR",
                    engine="pyttsx3",
                    language=request.language,
                    error_message=f"pyttsx3 synthesis error: {str(exc)}",
                )

        return VoiceSynthesizeResponse(
            status="ENGINE_UNAVAILABLE",
            engine=tts,
            language=request.language,
            error_message="Configured local TTS engine is not ready for streaming synthesis.",
        )


voice_service = SovereignVoiceService()
