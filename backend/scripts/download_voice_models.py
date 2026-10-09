"""Download and verify local multilingual voice models for FORGE."""

import os
import sys
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "data" / "models" / "voice"
WHISPER_DIR = MODELS_DIR / "whisper"
PIPER_DIR = MODELS_DIR / "piper"
MMS_DIR = MODELS_DIR / "mms_tts" / "kan"

def setup_models():
    print("Checking offline voice model directories...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    WHISPER_DIR.mkdir(parents=True, exist_ok=True)
    PIPER_DIR.mkdir(parents=True, exist_ok=True)
    MMS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Piper English
    en_onnx = PIPER_DIR / "en_US-lessac-medium.onnx"
    en_json = PIPER_DIR / "en_US-lessac-medium.onnx.json"
    if not en_onnx.is_file():
        print("Downloading Piper English voice...")
        urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx", en_onnx)
        urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json", en_json)
    else:
        print("✓ Piper English voice already installed.")

    # 2. Piper Hindi
    hi_onnx = PIPER_DIR / "hi_IN-pratham-medium.onnx"
    hi_json = PIPER_DIR / "hi_IN-pratham-medium.onnx.json"
    if not hi_onnx.is_file():
        print("Downloading Piper Hindi voice...")
        urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx", hi_onnx)
        urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json", hi_json)
    else:
        print("✓ Piper Hindi voice already installed.")

    # 3. Meta MMS Kannada
    mms_weights = MMS_DIR / "model.safetensors"
    if not mms_weights.is_file():
        print("Downloading Meta MMS Kannada VITS model...")
        from transformers import VitsModel, AutoTokenizer
        m = VitsModel.from_pretrained("facebook/mms-tts-kan")
        t = AutoTokenizer.from_pretrained("facebook/mms-tts-kan")
        m.save_pretrained(str(MMS_DIR))
        t.save_pretrained(str(MMS_DIR))
    else:
        print("✓ Meta MMS Kannada voice already installed.")

    # 4. faster-whisper multilingual small
    print("Verifying faster-whisper multilingual small model...")
    from faster_whisper import WhisperModel
    _ = WhisperModel("small", device="cpu", compute_type="int8", download_root=str(WHISPER_DIR))
    print("✓ faster-whisper small model verified.")

if __name__ == "__main__":
    setup_models()
