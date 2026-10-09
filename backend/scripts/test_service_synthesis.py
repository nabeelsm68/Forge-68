import sys
sys.path.insert(0, ".")
import asyncio
from app.voice.service import voice_service
from app.voice.schemas import VoiceSynthesizeRequest

async def test_all():
    print("Testing Voice Service Synthesis...")
    
    # 1. Synthesize English
    res_en = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="Reactor R-204 operational status normal.", language="en"))
    print(f"EN Synthesis: {res_en.status}, engine: {res_en.engine}, voice: {res_en.voice_name}, base64 len: {len(res_en.audio_base64 or '')}")
    
    # 2. Synthesize Hindi
    res_hi = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="रिएक्टर आर-204 सामान्य स्थिति में है।", language="hi"))
    print(f"HI Synthesis: {res_hi.status}, engine: {res_hi.engine}, voice: {res_hi.voice_name}, base64 len: {len(res_hi.audio_base64 or '')}")
    
    # 3. Synthesize Kannada
    res_kn = await voice_service.synthesize_speech(VoiceSynthesizeRequest(text="ರಿಯಾಕ್ಟರ್ ಆರ್‌-204 ಸ್ಥಿತಿ ಸಹಜವಾಗಿದೆ.", language="kn"))
    print(f"KN Synthesis: {res_kn.status}, engine: {res_kn.engine}, voice: {res_kn.voice_name}, base64 len: {len(res_kn.audio_base64 or '')}")

if __name__ == "__main__":
    asyncio.run(test_all())
