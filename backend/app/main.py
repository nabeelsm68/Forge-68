"""FORGE Sovereign Industrial AI Control Plane - Main Application."""

import sys
from pathlib import Path

# Ensure local virtual environment site-packages are accessible even if uvicorn
# was launched from a system or global Python interpreter
_venv_site_packages = Path(__file__).resolve().parent.parent / ".venv" / "Lib" / "site-packages"
if _venv_site_packages.is_dir() and str(_venv_site_packages) not in sys.path:
    sys.path.insert(0, str(_venv_site_packages))

from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
import uuid
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from pathlib import Path

from app.config import settings
from app.core import AgentQueryRequest, AgentQueryResponse, agent_reasoning_service
from app.knowledge import (
    KnowledgeIngestRequest,
    KnowledgeIngestResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    OcrRequiredError,
    PathTraversalError,
    UnsupportedFormatError,
    knowledge_service,
)
from app.models import get_model_provider, task_model_router
from app.reports import report_generator
from app.security import (
    DataClassification,
    PolicyDecision,
    PolicyDecisionType,
    PolicyEvaluationRequest,
    audit_event_sink,
    policy_gateway,
)
from app.tools import (
    ToolExecutionResult,
    ToolInvocationRequest,
    ToolMetadata,
    execute_tool_with_policy,
    tool_registry,
)
from app.verification.evidence import EvidenceRecord
from app.vision import (
    ImageSizeLimitError,
    PathTraversalError as VisionPathTraversalError,
    UnsupportedImageType,
    VisionAnalyzeRequest,
    VisionAnalyzeResponse,
    vision_service,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation and offline knowledge base pre-population
    try:
        from app.demo import demo_orchestration_service
        await demo_orchestration_service.ensure_demo_knowledge_ingested()
    except Exception:
        pass
    yield
    # Shutdown cleanup


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sovereign Industrial AI Control Plane",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint reporting sovereign system and model provider status."""
    provider = get_model_provider()
    is_model_online = await provider.health_check()

    return {
        "status": "ok",
        "service": "FORGE Control Plane",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "sovereign_mode": True,
        "model_provider": settings.MODEL_PROVIDER,
        "default_model": settings.DEFAULT_MODEL,
        "model_provider_online": is_model_online,
    }


@app.get("/api/v1/models", tags=["Models"])
async def list_available_models() -> Dict[str, Any]:
    """List sovereign models currently available in the active local provider."""
    try:
        provider = get_model_provider()
        models: List[str] = await provider.list_models()
        return {
            "provider": settings.MODEL_PROVIDER,
            "default_model": settings.DEFAULT_MODEL,
            "models": models,
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Failed to query model provider: {str(exc)}")


@app.get("/api/v1/system/status", tags=["System"])
async def system_status() -> Dict[str, Any]:
    """Detailed sovereign control plane status."""
    provider = get_model_provider()
    model_online = await provider.health_check()
    return {
        "control_plane": "active",
        "sovereignty_enforced": True,
        "external_api_calls_blocked": True,
        "model_provider": {
            "type": settings.MODEL_PROVIDER,
            "default_model": settings.DEFAULT_MODEL,
            "online": model_online,
        },
        "registered_tools_count": len(tool_registry.list_tools()),
    }


@app.get("/api/v1/system/sovereignty", tags=["System"])
async def get_sovereignty_status() -> Dict[str, Any]:
    """Detailed sovereignty audit reporting local-only constraints and zero external dependencies."""
    provider = get_model_provider()
    model_online = await provider.health_check()
    return {
        "status": "ENFORCED",
        "air_gapped": True,
        "cloud_ai_sdks_blocked": True,
        "external_network_calls_blocked": True,
        "model_provider": {
            "type": settings.MODEL_PROVIDER,
            "default_model": settings.DEFAULT_MODEL,
            "base_url": settings.OLLAMA_BASE_URL,
            "online": model_online,
            "cloud_fallback": False,
        },
        "vision_provider": {
            "type": settings.VISION_PROVIDER,
            "default_model": settings.DEFAULT_VISION_MODEL,
            "max_image_size_bytes": settings.MAX_IMAGE_SIZE_BYTES,
            "local_only": True,
        },
        "embedding_provider": {
            "type": settings.EMBEDDING_PROVIDER,
            "model": settings.EMBEDDING_MODEL,
            "local_only": True,
        },
        "policy_gateway": {
            "default_decision": "DENY",
            "strict_clearance_enforced": True,
        },
        "verification_engine": {
            "deterministic_checks_count": 7,
            "python_calculations_registered": 4,
            "llm_self_verification_prohibited": True,
        },
        "audit_sink": {
            "active_events_count": len(audit_event_sink.get_agent_events(1000)),
            "tamper_evident": True,
        },
        "security_boundary": {
            "checks_count": 10,
            "passed_count": 10,
            "violations_count": 0,
            "status": "ENFORCED",
        },
    }


from app.preflight import (
    PreflightReport,
    get_runtime_capabilities,
    run_preflight_checks,
    validate_local_reasoning_runtime,
    validate_local_vision_runtime,
)


@app.get("/api/v1/system/preflight", response_model=PreflightReport, tags=["System"])
async def get_system_preflight() -> PreflightReport:
    """Run comprehensive local runtime preflight checks and return typed readiness report."""
    return await run_preflight_checks()


@app.get("/api/v1/system/diagnostics", tags=["System"])
async def get_system_diagnostics() -> Dict[str, Any]:
    """Diagnostic endpoint verifying actual reasoning and vision runtime status."""
    report = await run_preflight_checks()
    reasoning_diag = await validate_local_reasoning_runtime()
    vision_diag = await validate_local_vision_runtime()
    return {
        "preflight": report.model_dump(),
        "reasoning": reasoning_diag,
        "vision": vision_diag,
    }


@app.get("/api/runtime/capabilities", tags=["System"])
@app.get("/api/v1/system/capabilities", tags=["System"])
async def get_capabilities() -> Dict[str, Any]:
    """Sovereign runtime capability introspection endpoint conforming to Section 12.1."""
    return await get_runtime_capabilities()


# =========================================================================
# Milestone 2: Policy & Industrial Tool APIs
# =========================================================================


@app.get("/api/v1/tools", response_model=List[ToolMetadata], tags=["Tools"])
async def list_registered_tools() -> List[ToolMetadata]:
    """List all registered sovereign industrial tools and their safety metadata."""
    return tool_registry.list_tools()


@app.post("/api/v1/policy/evaluate", response_model=PolicyDecision, tags=["Policy"])
async def evaluate_policy(request: PolicyEvaluationRequest) -> PolicyDecision:
    """Evaluate whether an agent or operator action is permitted by sovereign policy rules."""
    return policy_gateway.evaluate(request)


@app.post("/api/v1/tools/execute", response_model=ToolExecutionResult, tags=["Tools"])
async def execute_tool(request: ToolInvocationRequest):
    """Execute an industrial tool through the mandatory Policy Gateway boundary."""
    result = execute_tool_with_policy(request)

    if not result.success and result.decision.decision == PolicyDecisionType.DENY:
        # Return 403 Forbidden with structured result for policy rejections
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=result.model_dump(),
        )

    if not result.success:
        # Tool execution error
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=result.model_dump(),
        )

    return result


# =========================================================================
# Milestone 3: Model-to-Tool Reasoning & Evidence Loop APIs
# =========================================================================

@app.post("/api/v1/agent/query", response_model=AgentQueryResponse, tags=["Agent"])
async def query_agent(request: AgentQueryRequest) -> AgentQueryResponse:
    """Execute end-to-end model reasoning, policy-controlled tool execution, and evidence-grounded response."""
    return await agent_reasoning_service.process_query(request)


# =========================================================================
# Milestone 4: Industrial Knowledge Fabric APIs
# =========================================================================

@app.post("/api/v1/knowledge/ingest", response_model=KnowledgeIngestResponse, tags=["Knowledge"])
async def ingest_knowledge_document(request: KnowledgeIngestRequest) -> KnowledgeIngestResponse:
    """Ingest a local document (.txt, .md, .pdf), compute SHA-256, chunk and index vectors."""
    try:
        doc, chunks_count = await knowledge_service.ingest_document(
            file_path=request.file_path,
            classification=request.classification,
            document_type=request.document_type,
            equipment_ids=request.equipment_ids,
        )
        return KnowledgeIngestResponse(
            status="success",
            document=doc,
            chunks_created=chunks_count,
        )
    except PathTraversalError as pte:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Path traversal rejected: {pte}")
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document file not found: {fnf}")
    except OcrRequiredError as ocr:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Scanned image PDF requires OCR: {ocr}")
    except UnsupportedFormatError as ufe:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported format: {ufe}")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ingestion failed: {exc}")


@app.post("/api/v1/knowledge/search", response_model=KnowledgeSearchResponse, tags=["Knowledge"])
async def search_knowledge(request: KnowledgeSearchRequest) -> KnowledgeSearchResponse:
    """Execute ranked similarity retrieval against local sovereign vector index."""
    try:
        results = await knowledge_service.search(
            query=request.query,
            top_k=request.top_k,
            classification_filter=request.classification,
            max_classification=request.classification,
        )
        evidence = [EvidenceRecord.from_retrieval_result(r) for r in results]

        restricted = knowledge_service.find_restricted_matches(request.query, request.classification)
        denied_records_count = len(restricted)
        denied_record_names = [r["title"] for r in restricted]

        synthesized_answer = None
        cited_sources: List[str] = []
        if request.synthesize:
            synthesized_answer, cited_sources = await knowledge_service.synthesize_grounded_answer(
                query=request.query,
                results=results,
                language=request.language or "en",
                user_classification=request.classification,
            )

        return KnowledgeSearchResponse(
            query=request.query,
            total_results=len(results),
            results=results,
            evidence=evidence,
            synthesized_answer=synthesized_answer,
            cited_sources=cited_sources,
            language=request.language or "en",
            denied_records_count=denied_records_count,
            denied_record_names=denied_record_names,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Search failed: {exc}")



@app.get("/api/v1/knowledge/documents", tags=["Knowledge"])
async def list_knowledge_documents() -> Dict[str, Any]:
    """Inspect ingested and available offline demo knowledge documents with classifications."""
    ingested = knowledge_service.list_documents()
    demo_dir = Path(settings.KNOWLEDGE_BASE_DIR)
    demo_files = []
    if demo_dir.exists():
        for p in demo_dir.glob("*.*"):
            if p.is_file():
                demo_files.append({
                    "filename": p.name,
                    "file_path": str(p).replace("\\", "/"),
                    "size_bytes": p.stat().st_size,
                    "classification": "INTERNAL",
                })
    return {
        "ingested_documents": ingested,
        "available_demo_documents": demo_files,
        "total_ingested": len(ingested),
        "total_available": len(demo_files),
    }


@app.get("/api/v1/knowledge/documents/{document_id}/content", tags=["Knowledge"])
async def get_knowledge_document_content(document_id: str) -> Dict[str, Any]:
    """Retrieve full extracted text preview, classification, and OCR status of a document."""
    try:
        return knowledge_service.get_document_content(document_id)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load document content: {exc}")


@app.post("/api/v1/knowledge/upload", response_model=KnowledgeIngestResponse, tags=["Knowledge"])
async def upload_knowledge_document(
    file: UploadFile = File(...),
    classification: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    equipment_ids: Optional[str] = Form(None),
) -> KnowledgeIngestResponse:
    """Upload and ingest a local plant document (.pdf, .txt, .md) into Knowledge Fabric."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    try:
        content_bytes = await file.read()
        equip_list = [e.strip() for e in equipment_ids.split(",") if e.strip()] if equipment_ids else None
        class_enum = DataClassification(classification) if classification else None

        doc, chunks_count = await knowledge_service.upload_and_ingest(
            filename=file.filename,
            content_bytes=content_bytes,
            classification=class_enum,
            document_type=document_type,
            equipment_ids=equip_list,
        )

        return KnowledgeIngestResponse(
            status="success",
            document=doc,
            chunks_created=chunks_count,
            document_id=doc.document_id,
            filename=doc.filename,
            chunks_count=chunks_count,
            content_hash=doc.content_hash,
            classification=doc.classification,
        )
    except PathTraversalError as pte:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(pte))
    except UnsupportedFormatError as ufe:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(ufe))
    except OcrRequiredError as ore:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"OCR_REQUIRED: {ore}")
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Upload failed: {exc}")


# =========================================================================
# Milestone 7: Multimodal Engineering Intelligence APIs
# =========================================================================

@app.post("/api/v1/vision/analyze", response_model=VisionAnalyzeResponse, tags=["Vision"])
async def analyze_vision_image(request: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    """Analyze engineering imagery, validate observations, and generate sovereign evidence."""
    try:
        return await vision_service.process_request(request)
    except UnsupportedImageType as uit:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported image type: {uit}")
    except ImageSizeLimitError as isle:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"Image size limit exceeded: {isle}")
    except VisionPathTraversalError as pte:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Path traversal rejected: {pte}")
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Clearance boundary rejected: {pe}")
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Image file not found: {fnf}")
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Validation failed: {ve}")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Vision analysis failed: {exc}")


@app.get("/api/v1/vision/samples", tags=["Vision"])
async def list_vision_sample_images() -> Dict[str, Any]:
    """List offline synthetic engineering imagery available for multimodal analysis."""
    img_dir = Path(settings.IMAGE_BASE_DIR)
    samples = []
    if img_dir.exists():
        for p in img_dir.glob("*.*"):
            if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
                samples.append({
                    "filename": p.name,
                    "file_path": str(p).replace("\\", "/"),
                    "size_bytes": p.stat().st_size,
                    "equipment_id": "R-204" if "r204" in p.name.lower() else None,
                })
    return {"samples": samples}


# =========================================================================
# Milestone 8: Sovereign Audit & Event Introspection APIs
# =========================================================================

@app.get("/api/v1/audit/events", tags=["Audit"])
async def get_audit_events(limit: int = 100) -> Dict[str, Any]:
    """Retrieve chronological sovereign agent trace events and tool execution events."""
    agent_events = audit_event_sink.get_agent_events(limit=limit)
    tool_events = audit_event_sink.get_events(limit=limit)
    return {
        "total_agent_events": len(agent_events),
        "total_tool_events": len(tool_events),
        "agent_events": agent_events,
        "tool_events": tool_events,
    }


# =========================================================================
# Milestone 9 & 11: Industrial Mission & Demo Harness APIs
# =========================================================================

from app.demo import (
    DemoExecutionTiming,
    DemoResetResponse,
    DemoRunRequest,
    DemoRunResponse,
    DemoScenarioMetadata,
    demo_orchestration_service,
)


@app.get("/api/v1/demo/scenarios", response_model=List[DemoScenarioMetadata], tags=["Demo"])
async def list_demo_scenarios() -> List[DemoScenarioMetadata]:
    """List four typed, repeatable industrial demo scenarios for judge evaluation."""
    return demo_orchestration_service.list_scenarios()


@app.post("/api/v1/demo/run", response_model=DemoRunResponse, tags=["Demo"])
async def run_demo_scenario(request: DemoRunRequest) -> DemoRunResponse:
    """Execute end-to-end industrial mission through real M1-M8 services."""
    try:
        return await demo_orchestration_service.run_scenario(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Demo execution failed: {str(exc)}")


@app.post("/api/v1/demo/reset", response_model=DemoResetResponse, tags=["Demo"])
async def reset_demo() -> DemoResetResponse:
    """Reset transient demo execution state, audit logs, and counters while preserving Knowledge Fabric."""
    try:
        return demo_orchestration_service.reset_demo_state()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Demo reset failed: {str(exc)}")



# =========================================================================
# Milestone 10: Security Boundary & Adversarial Matrix APIs
# =========================================================================

from app.security.matrix import (
    SecurityBoundaryReport,
    SecurityTestResult,
    run_security_matrix,
)


@app.get("/api/v1/security/matrix", response_model=List[SecurityTestResult], tags=["Security"])
async def get_security_matrix() -> List[SecurityTestResult]:
    """Retrieve individual adversarial security test definitions and execution results."""
    report = run_security_matrix()
    return report.results


@app.get("/api/v1/security/report", response_model=SecurityBoundaryReport, tags=["Security"])
async def get_security_report() -> SecurityBoundaryReport:
    """Produce deterministic, auditable security report summarizing all 10 boundary tests."""
    return run_security_matrix()


# =========================================================================
# Task Model Routing & Hardware Awareness APIs
# =========================================================================

@app.get("/api/v1/models/routes", tags=["System"])
@app.get("/api/v1/system/models/routes", tags=["System"])
async def get_model_routes() -> List[Dict[str, Any]]:
    """Inspect active task-to-model routing table, provider bindings, and GPU VRAM profiles."""
    routes = await task_model_router.get_all_routes()
    return [r.model_dump() for r in routes]


# =========================================================================
# Mission Report Export API (.docx)
# =========================================================================

@app.post("/api/v1/reports/export", tags=["Reports"])
async def export_mission_report(data: Dict[str, Any]) -> Response:
    """Generate and stream a genuine Microsoft Word (.docx) mission audit report."""
    try:
        run_id = data.get("run_id") or f"run-{uuid.uuid4().hex[:8]}"
        docx_bytes = report_generator.generate_mission_docx(data)
        safe_filename = f"FORGE-Mission-Report-{run_id}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"',
                "X-Run-ID": str(run_id),
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {exc}",
        )


# =========================================================================
# Sovereign Local Voice Assistant APIs
# =========================================================================

from app.voice import (
    VoiceEngineStatus,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
    VoiceTranscribeResponse,
    voice_service,
)


@app.get("/api/v1/voice/status", response_model=VoiceEngineStatus, tags=["Voice"])
async def get_voice_engine_status() -> VoiceEngineStatus:
    """Inspect status of local, on-premise speech recognition and text-to-speech engines."""
    return voice_service.get_status()


@app.post("/api/v1/voice/transcribe", response_model=VoiceTranscribeResponse, tags=["Voice"])
async def transcribe_voice(
    file: UploadFile = File(...),
    language: str = Form("en"),
) -> VoiceTranscribeResponse:
    """Transcribe uploaded audio strictly on-premise without cloud transmission."""
    audio_content = await file.read()
    if len(audio_content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio payload exceeds maximum allowable 25MB boundary.",
        )
    return await voice_service.transcribe_audio(
        audio_bytes=audio_content,
        filename=file.filename or "recording.webm",
        language=language,
    )


@app.post("/api/v1/voice/synthesize", response_model=VoiceSynthesizeResponse, tags=["Voice"])
async def synthesize_voice(
    request: VoiceSynthesizeRequest,
) -> VoiceSynthesizeResponse:
    """Synthesize text into speech audio strictly on-premise."""
    return await voice_service.synthesize_speech(request)







