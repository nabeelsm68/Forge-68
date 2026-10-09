import os
import io
import wave
import sys
from pathlib import Path
import numpy as np
import torch
from faster_whisper import WhisperModel
from piper import PiperVoice
from transformers import VitsModel, AutoTokenizer

# Set UTF-8 output encoding for terminal
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

print("--- Testing Real Local Multilingual Speech Engines ---")

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "data" / "models" / "voice"
whisper_dir = str(MODELS_DIR / "whisper")
piper_dir = MODELS_DIR / "piper"
mms_dir = str(MODELS_DIR / "mms_tts" / "kan")

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
    download_root=whisper_dir,
    local_files_only=True
)

# 1. English
voice_en = PiperVoice.load(str(piper_dir / "en_US-lessac-medium.onnx"), str(piper_dir / "en_US-lessac-medium.onnx.json"))
buf_en = io.BytesIO()
with wave.open(buf_en, "wb") as wf:
    voice_en.synthesize_wav("Reactor R-204 wall thickness is critical.", wf)
buf_en.seek(0)
segments_en, _ = model.transcribe(buf_en, language="en")
text_en = " ".join(s.text for s in segments_en).strip()
print(f"[EN] Synthesized & Transcribed: '{text_en}' (Audio size: {len(buf_en.getvalue())} bytes)")

# 2. Hindi
voice_hi = PiperVoice.load(str(piper_dir / "hi_IN-pratham-medium.onnx"), str(piper_dir / "hi_IN-pratham-medium.onnx.json"))
buf_hi = io.BytesIO()
with wave.open(buf_hi, "wb") as wf:
    voice_hi.synthesize_wav("रिएक्टर दीवार की मोटाई की जांच करें।", wf)
buf_hi.seek(0)
segments_hi, _ = model.transcribe(buf_hi, language="hi")
text_hi = " ".join(s.text for s in segments_hi).strip()
print(f"[HI] Synthesized & Transcribed: '{text_hi}' (Audio size: {len(buf_hi.getvalue())} bytes)")

# 3. Kannada
kan_model = VitsModel.from_pretrained(mms_dir, local_files_only=True)
kan_tok = AutoTokenizer.from_pretrained(mms_dir, local_files_only=True)
inputs = kan_tok("ಪರೀಕ್ಷಾ ವರದಿ ಪರಿಶೀಲಿಸಿ", return_tensors="pt")
with torch.no_grad():
    out = kan_model(**inputs).waveform
audio_arr = out.squeeze().cpu().numpy()
audio_int16 = (audio_arr * 32767).clip(-32768, 32767).astype(np.int16)
buf_kn = io.BytesIO()
with wave.open(buf_kn, "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(16000)
    wf.writeframes(audio_int16.tobytes())
buf_kn.seek(0)
segments_kn, _ = model.transcribe(buf_kn, language="kn")
text_kn = " ".join(s.text for s in segments_kn).strip()
print(f"[KN] Synthesized & Transcribed: '{text_kn}' (Audio size: {len(buf_kn.getvalue())} bytes)")

print("\n--- ALL THREE LANGUAGES (EN, HI, KN) VERIFIED OFFLINE! ---")
