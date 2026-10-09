import sys
sys.path.insert(0, ".")
import asyncio
import base64
from app.voice.service import voice_service
from app.voice.schemas import VoiceSynthesizeRequest

async def test_transcribe():
    print("Testing Voice Service Transcription...")
    
    # 1. English
    synth_en = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="Check reactor wall thickness immediately.", language="en"))
    audio_en = base64.b64decode(synth_en.audio_base64)
    trans_en = await voice_service.transcribe_audio(audio_en, language="en")
    print(f"EN: Transcribed '{trans_en.text}' (engine: {trans_en.engine}, confidence: {trans_en.confidence:.2f})")
    
    # 2. Hindi
    synth_hi = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="दबाव वाल्व का निरीक्षण करें।", language="hi"))
    audio_hi = base64.b64decode(synth_hi.audio_base64)
    trans_hi = await voice_service.transcribe_audio(audio_hi, language="hi")
    print(f"HI: Transcribed '{trans_hi.text}' (engine: {trans_hi.engine}, confidence: {trans_hi.confidence:.2f})")
    
    # 3. Kannada
    synth_kn = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="ಪರೀಕ್ಷಾ ವರದಿ ಪರಿಶೀಲಿಸಿ", language="kn"))
    audio_kn = base64.b64decode(synth_kn.audio_base64)
    trans_kn = await voice_service.transcribe_audio(audio_kn, language="kn")
    print(f"KN: Transcribed '{trans_kn.text}' (engine: {trans_kn.engine}, confidence: {trans_kn.confidence:.2f})")

if __name__ == "__main__":
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    asyncio.run(test_transcribe())
