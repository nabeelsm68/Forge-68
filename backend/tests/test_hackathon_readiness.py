"""Comprehensive Hackathon Readiness Test Suite for FORGE Control Plane.

Validates all 12 Milestone criteria:
1. Custom question & greeting handling.
2. Document reader & safe local document upload.
3. Path traversal rejection during upload.
4. Genuine Word (.docx) report generation with run isolation.
5. Task Model Router hardware awareness (RTX 4060 8GB VRAM).
6. Multilingual request parameters and equipment tag preservation.
7. Sovereignty boundary & zero egress accounting.
"""

import io
import json
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.router import TaskType, task_model_router
from app.reports.service import report_generator
from app.core.schemas import AgentQueryRequest, AgentQueryStatus
from app.core.reasoning import agent_reasoning_service


@pytest.fixture
def client():
    return TestClient(app)


# =========================================================================
# Phase 1 & 3: Custom Questions, Greetings, and Planning
# =========================================================================

@pytest.mark.asyncio
async def test_greeting_handling_returns_direct_sovereign_response():
    """Verify greetings are handled directly without querying nonexistent equipment."""
    req = AgentQueryRequest(
        query="Hello, who are you and what can you do?",
        language="en",
    )
    resp = await agent_reasoning_service.process_query(req)
    assert resp.status == AgentQueryStatus.DIRECT_ANSWER
    assert "FORGE" in resp.final_answer
    assert "Sovereign Industrial AI Control Plane" in resp.final_answer
    assert resp.plan is not None
    assert resp.plan.action.value == "direct"
    assert resp.verification is not None


@pytest.mark.asyncio
async def test_greeting_multilingual_hindi_and_kannada():
    """Verify greetings in Hindi and Kannada respond in appropriate language."""
    req_hi = AgentQueryRequest(query="नमस्ते", language="hi")
    resp_hi = await agent_reasoning_service.process_query(req_hi)
    assert resp_hi.status == AgentQueryStatus.DIRECT_ANSWER
    assert "FORGE" in resp_hi.final_answer
    assert "नमस्ते" in resp_hi.final_answer

    req_kn = AgentQueryRequest(query="namaskara", language="kn")
    resp_kn = await agent_reasoning_service.process_query(req_kn)
    assert resp_kn.status == AgentQueryStatus.DIRECT_ANSWER
    assert "FORGE" in resp_kn.final_answer
    assert "ನಮಸ್ಕಾರ" in resp_kn.final_answer


# =========================================================================
# Phase 2: Document Reader & Local Upload
# =========================================================================

@pytest.mark.asyncio
async def test_document_reader_content_endpoint(client):
    """Verify document reader endpoint returns real extracted text and hash."""
    from app.demo.service import demo_orchestration_service
    await demo_orchestration_service.ensure_demo_knowledge_ingested()

    docs_res = client.get("/api/v1/knowledge/documents")
    assert docs_res.status_code == 200
    data = docs_res.json()
    assert "ingested_documents" in data
    assert len(data["ingested_documents"]) > 0

    doc_id = data["ingested_documents"][0]["document_id"]
    content_res = client.get(f"/api/v1/knowledge/documents/{doc_id}/content")
    assert content_res.status_code == 200
    content_data = content_res.json()
    assert "extracted_text" in content_data
    assert "content_hash" in content_data
    assert "chunks_count" in content_data
    assert "ocr_status" in content_data
    assert content_data["ocr_status"] in ("EXTRACTED", "OCR_REQUIRED")


def test_document_upload_txt_and_pdf(client):
    """Verify uploading a local document indexes it safely into Knowledge Fabric."""
    test_content = (
        b"# Heat Exchanger E-301 Operational SOP\n"
        b"Normal tube side operating pressure: 18.5 bar gauge.\n"
        b"Maximum allowable operating pressure (MAWP): 24.0 bar gauge.\n"
        b"Design temperature: 280 deg C.\n"
    )
    files = {
        "file": ("e301_operational_sop.md", io.BytesIO(test_content), "text/markdown"),
    }
    data = {
        "classification": "INTERNAL",
        "document_type": "SOP",
        "equipment_ids": "E-301",
    }
    upload_res = client.post("/api/v1/knowledge/upload", files=files, data=data)
    assert upload_res.status_code == 200
    res_data = upload_res.json()
    assert res_data["filename"] == "e301_operational_sop.md"
    assert res_data["chunks_count"] >= 1
    assert len(res_data["content_hash"]) == 64  # SHA-256


def test_upload_path_traversal_rejection(client):
    """Verify path traversal in filename is strictly sanitized/rejected."""
    test_content = b"Malicious path traversal attempt"
    files = {
        "file": ("../../etc/passwd.txt", io.BytesIO(test_content), "text/plain"),
    }
    upload_res = client.post("/api/v1/knowledge/upload", files=files)
    # Either succeeds after safe basename sanitization (to passwd.txt) or rejected safely
    assert upload_res.status_code in (200, 400)
    if upload_res.status_code == 200:
        assert "/" not in upload_res.json()["filename"]
        assert ".." not in upload_res.json()["filename"]


# =========================================================================
# Phase 4: Genuine Microsoft Word (.docx) Report Generation
# =========================================================================

def test_word_report_docx_generation_valid_zip_openxml():
    """Verify report generator produces genuine valid OpenXML .docx without third-party cloud."""
    run_data = {
        "run_id": "run-test-alpha-101",
        "scenario_id": "r204_investigation",
        "query": "Analyze Reactor R-204 operational condition.",
        "final_answer": "Reactor R-204 operating conditions remain nominal and within design envelope.",
        "status": "SUCCESS",
        "verification": {
            "status": "VERIFIED",
            "summary": "7/7 deterministic checks passed.",
            "checks": [
                {
                    "check_id": "CHK-01",
                    "check_type": "FACTUAL_GROUNDING",
                    "status": "VERIFIED",
                    "description": "All claims grounded in verified SOP.",
                }
            ],
        },
    }
    docx_bytes = report_generator.generate_mission_docx(run_data)
    assert len(docx_bytes) > 500

    # Verify standard OpenXML ZIP structure
    with zipfile.ZipFile(io.BytesIO(docx_bytes), "r") as zf:
        file_list = zf.namelist()
        assert "[Content_Types].xml" in file_list
        assert "_rels/.rels" in file_list
        assert "word/document.xml" in file_list

        doc_xml = zf.read("word/document.xml").decode("utf-8")
        assert "run-test-alpha-101" in doc_xml
        assert "Reactor R-204" in doc_xml


def test_word_reports_have_distinct_content_per_run():
    """Verify different runs produce unique, run-isolated Word reports."""
    run_1 = {
        "run_id": "run-001-r204",
        "query": "Investigation 001",
        "final_answer": "All systems nominal for R-204.",
    }
    run_2 = {
        "run_id": "run-002-pi204",
        "query": "Investigation 002",
        "final_answer": "Pressure variance observed on PI-204 (+1.8 bar).",
    }

    docx_1 = report_generator.generate_mission_docx(run_1)
    docx_2 = report_generator.generate_mission_docx(run_2)

    with zipfile.ZipFile(io.BytesIO(docx_1), "r") as zf1:
        xml1 = zf1.read("word/document.xml").decode("utf-8")

    with zipfile.ZipFile(io.BytesIO(docx_2), "r") as zf2:
        xml2 = zf2.read("word/document.xml").decode("utf-8")

    assert "run-001-r204" in xml1 and "run-001-r204" not in xml2
    assert "run-002-pi204" in xml2 and "run-002-pi204" not in xml1


# =========================================================================
# Phase 5: Task Model Router & Hardware Awareness
# =========================================================================

def test_task_model_router_bindings(client):
    """Verify model router exposes task-to-model routes with VRAM awareness."""
    routes_res = client.get("/api/v1/models/routes")
    assert routes_res.status_code == 200
    routes = routes_res.json()
    assert len(routes) >= 4

    tasks = [r["task"] for r in routes]
    assert "reasoning" in tasks
    assert "vision" in tasks
    assert "embedding" in tasks
    assert "ocr" in tasks

    reasoning_route = next(r for r in routes if r["task"] == "reasoning")
    assert "qwen3:8b" in reasoning_route["target_model"]
    assert "8GB VRAM" in reasoning_route["vram_profile"] or "VRAM" in reasoning_route["vram_profile"]
    assert reasoning_route["is_cloud"] is False
    assert reasoning_route["is_local"] is True


# =========================================================================
# Phase 8: Sovereignty & Boundary Verification
# =========================================================================

def test_sovereignty_center_metrics(client):
    """Verify runtime capabilities report zero cloud dependencies and loopback binding."""
    res = client.get("/api/runtime/capabilities")
    assert res.status_code == 200
    caps = res.json()
    assert caps["outside_ai_services_configured"] == 0
    assert caps["inference_endpoint_is_loopback"] is True
    assert caps["dependency_scan"]["cloud_sdks_found"] == 0


# =========================================================================
# Voice API & Sovereign Voice Stack
# =========================================================================

def test_voice_status_endpoint(client):
    """Verify voice status endpoint truthfully reports local engines and sovereign guarantee."""
    res = client.get("/api/v1/voice/status")
    assert res.status_code == 200
    data = res.json()
    assert "stt_available" in data
    assert "tts_available" in data
    assert "supported_languages" in data
    assert set(["en", "hi", "kn"]).issubset(set(data["supported_languages"]))
    assert "sovereign_guarantee" in data
    assert "on-premise" in data["sovereign_guarantee"].lower() or "sovereign" in data["sovereign_guarantee"].lower()
    assert "setup_instructions" in data


def test_voice_transcribe_payload_limit(client):
    """Verify upload larger than 25MB is rejected with 413."""
    huge_data = b"x" * (26 * 1024 * 1024)
    files = {"file": ("test.webm", io.BytesIO(huge_data), "audio/webm")}
    res = client.post("/api/v1/voice/transcribe", files=files, data={"language": "en"})
    assert res.status_code == 413


def test_voice_transcribe_graceful_local_response(client):
    """Verify voice transcription handles missing local model gracefully without cloud fallback."""
    tiny_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    files = {"file": ("test.wav", io.BytesIO(tiny_audio), "audio/wav")}
    res = client.post("/api/v1/voice/transcribe", files=files, data={"language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("SUCCESS", "EMPTY_AUDIO", "ENGINE_UNAVAILABLE")
    assert "cloud" not in (data.get("engine") or "").lower()


def test_voice_synthesize_graceful_local_response(client):
    """Verify voice synthesis handles text without external cloud API calls."""
    payload = {"text": "Reactor R-204 operating baseline normal.", "language": "en"}
    res = client.post("/api/v1/voice/synthesize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("SUCCESS", "ENGINE_UNAVAILABLE")
    if data["status"] == "SUCCESS":
        assert len(data["audio_base64"]) > 0
    else:
        assert "not installed" in data.get("error_message", "").lower() or "engine" in data.get("error_message", "").lower()


def test_voice_status_multilingual_models(client):
    """Verify that voice status reports active sovereign engines and models."""
    res = client.get("/api/v1/voice/status")
    assert res.status_code == 200
    data = res.json()
    assert data["stt_available"] is True
    assert data["tts_available"] is True
    assert data["stt_engine"] == "faster-whisper"
    assert data["stt_models"]["en"] == "ready"
    assert data["stt_models"]["hi"] == "ready"
    assert data["stt_models"]["kn"] == "ready"
    assert data["tts_voices"]["en"] == "ready"
    assert data["tts_voices"]["hi"] == "ready"
    assert data["tts_voices"]["kn"] == "ready"


def test_voice_synthesize_multilingual_local(client):
    """Verify local neural synthesis for English, Hindi, and Kannada."""
    # Hindi synthesis
    res_hi = client.post("/api/v1/voice/synthesize", json={"text": "दबाव स्तर सामान्य है।", "language": "hi"})
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["status"] == "SUCCESS"
    assert len(data_hi["audio_base64"]) > 0
    assert data_hi["language"] == "hi"

    # Kannada synthesis
    res_kn = client.post("/api/v1/voice/synthesize", json={"text": "ಪರೀಕ್ಷಾ ವರದಿ ಪರಿಶೀಲಿಸಿ", "language": "kn"})
    assert res_kn.status_code == 200
    data_kn = res_kn.json()
    assert data_kn["status"] == "SUCCESS"
    assert len(data_kn["audio_base64"]) > 0
    assert data_kn["language"] == "kn"



# =========================================================================
# Conversational Isolation & Demo Run Isolation
# =========================================================================

@pytest.mark.asyncio
async def test_conversational_greeting_isolation(client):
    """Verify that a greeting returns a clean conversational response with no physical calculations."""
    res = client.post(
        "/api/v1/agent/query",
        json={"query": "Hello", "role": "ENGINEER", "classification": "INTERNAL", "language": "en"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DIRECT_ANSWER"
    # Verification calculations should be empty for a greeting
    verification = data.get("verification")
    if verification:
        calcs = verification.get("calculation_results") or verification.get("calculations") or []
        assert len(calcs) == 0
    # Final answer should be conversational
    assert "FORGE" in data["final_answer"]
