"""Quick test to verify server responds"""
import httpx
import time

# Give server a moment
time.sleep(1)

try:
    r = httpx.get("http://localhost:8080/health", timeout=5)
    print(f"✅ Health: {r.status_code} -> {r.json()}")
except Exception as e:
    print(f"❌ Cannot connect: {e}")

# Test form endpoint with a dummy audio
try:
    dummy_audio = b"RIFF" + b"\x00" * 100  # fake wav header
    r = httpx.post(
        "http://localhost:8080/analyze_complete",
        data={"first_name": "Test", "last_name": "User", "email": "test@test.com", "phone": "0501234567"},
        files={"audio_file": ("test.wav", dummy_audio, "audio/wav")},
        timeout=120
    )
    print(f"✅ Analyze: {r.status_code}")
    print(r.text[:500])
except Exception as e:
    print(f"❌ Analyze error: {e}")
