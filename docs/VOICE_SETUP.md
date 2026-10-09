# FORGE Sovereign Voice Subsystem — Setup & Verification Guide

This guide documents the local-only, sovereign voice architecture in FORGE for Speech-to-Text (STT) and Text-to-Speech (TTS).

---

## 1. Sovereignty & Compliance Principles

- **Zero Cloud AI / Egress:** FORGE strictly forbids Google Cloud Speech, Apple Dictation, OpenAI Whisper API, Azure Speech, or browser Web Speech cloud recognition.
- **Microphone Privacy:** Audio captured in the browser is encoded locally as standard 16-bit PCM RIFF WAV (16kHz mono) via `AudioContext` and submitted exclusively to `http://127.0.0.1:8000/api/v1/voice/transcribe`.
- **Review Before Execution:** Speech transcripts are transferred to the operator query field or reviewed explicitly before running the sovereign investigation loop.
- **Truthful Diagnostics:** The system reports a voice engine as `READY` only if the required engine is importable **and** the specific model/voice file for that language is loaded and verified on-disk.

---

## 2. Active Multilingual Architecture

| Subsystem | Primary Engine | Languages Supported | Offline Model Path |
| :--- | :--- | :--- | :--- |
| **STT (Speech-to-Text)** | `faster-whisper` (CTranslate2) | English (`en`), Hindi (`hi`), Kannada (`kn`) | `backend/data/models/voice/whisper/` (multilingual `small` model ~483MB) |
| **TTS: English** | `piper-tts` (ONNX) | English (`en`) | `backend/data/models/voice/piper/en_US-lessac-medium.onnx` (~63MB) |
| **TTS: Hindi** | `piper-tts` (ONNX) | Hindi (`hi`) | `backend/data/models/voice/piper/hi_IN-pratham-medium.onnx` (~63MB) |
| **TTS: Kannada** | Meta MMS (`transformers` VITS) | Kannada (`kn`) | `backend/data/models/voice/mms_tts/kan/` (~140MB) |
| **TTS: Fallback** | Windows SAPI5 (`pyttsx3`) | English (`en`) | Host SAPI5 tokens (Microsoft David Desktop) |

---

## 3. Automated One-Click Setup & Activation

Run the automated PowerShell setup script from the repository root using the project's Python 3.12 virtual environment:

```powershell
# Complete setup, model download, and automated 3-language verification
powershell -ExecutionPolicy Bypass -File .\scripts\setup_voice_models.ps1

# Or verify existing installed models without re-downloading
powershell -ExecutionPolicy Bypass -File .\scripts\setup_voice_models.ps1 -VerifyOnly
```

---

## 4. Manual Installation & Verification Commands

### 4.1 Dependencies Installation
Run inside the project root using the active Python 3.12 virtual environment:
```powershell
cd c:\Users\nabee\Documents\Kingdoms\Forge\backend
.\.venv\Scripts\pip.exe install -r requirements.txt
```
Key packages:
- `faster-whisper>=1.0.0` & `av<14` (for multilingual CTranslate2 transcription)
- `piper-tts>=1.8.0` (for neural ONNX voice synthesis)
- `transformers>=4.40.0` & `torch>=2.2.0` (for Meta MMS Kannada VITS synthesis)
- `pyttsx3>=2.98` (for host SAPI5 offline fallback)

### 4.2 Verify Backend Voice Status via CLI
```powershell
cd c:\Users\nabee\Documents\Kingdoms\Forge\backend
.\.venv\Scripts\python.exe -c "from app.voice.service import voice_service; print(voice_service.get_status().model_dump_json(indent=2))"
```

Expected output:
```json
{
  "stt_available": true,
  "tts_available": true,
  "stt_engine": "faster-whisper",
  "tts_engine": "piper + mms_tts",
  "supported_languages": ["en", "hi", "kn"],
  "stt_models": { "en": "ready", "hi": "ready", "kn": "ready" },
  "tts_voices": { "en": "ready", "hi": "ready", "kn": "ready" },
  "cloud_providers_configured": 0,
  "sovereign_guarantee": "100% On-Premise Sovereign Audio Pipeline. Zero third-party cloud speech APIs, zero telemetry egress."
}
```

### 4.3 Run Offline Multilingual Synthesis & Transcription Test
```powershell
cd c:\Users\nabee\Documents\Kingdoms\Forge\backend
.\.venv\Scripts\python.exe scripts\verify_voice.py
```

---

## 5. Troubleshooting & Diagnostics

| Symptom | Diagnostic Cause | Resolution |
| :--- | :--- | :--- |
| `STT: model_missing` | Model weights not found in `backend/data/models/voice/whisper/` | Run `powershell .\scripts\setup_voice_models.ps1` to download the `small` multilingual Whisper model. |
| `TTS: voice_missing (hi)` | Piper Hindi ONNX file missing in `backend/data/models/voice/piper/` | Ensure `hi_IN-pratham-medium.onnx` and its `.json` are present in `data/models/voice/piper/`. |
| `TTS: voice_missing (kn)` | Meta MMS Kannada files missing in `backend/data/models/voice/mms_tts/kan/` | Ensure `model.safetensors`, `config.json`, and `vocab.json` are present in `data/models/voice/mms_tts/kan/`. |
| Browser: `Microphone permission denied` | Browser blocked audio access for `localhost` | Click the lock/tune icon in the browser address bar, set **Microphone** to **Allow**, and reload. |
| Audio playback silent | Missing host audio output device | Ensure audio output device is connected and volume is non-zero. System falls back gracefully without crashing. |
