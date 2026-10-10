"""Sovereign Multimodal Vision Intelligence Service for FORGE."""

import base64
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge.index import CLASSIFICATION_LEVELS
from app.security import (
    AgentEventType,
    AgentTraceEvent,
    DataClassification,
    Role,
    audit_event_sink,
)
from app.verification.engine import VerificationEngine, verification_engine
from app.verification.evidence import EvidenceRecord, EvidenceSet
from app.vision.ingestion import (
    validate_and_load_image_file,
    validate_image_bytes,
)
from app.vision.models import (
    ImageProvenance,
    VisionAnalyzeRequest,
    VisionAnalyzeResponse,
    VisualFinding,
)
from app.vision.provider import (
    BaseVisionProvider,
    VisionRequest,
    VisionResponse,
    get_vision_provider,
)

logger = logging.getLogger("forge.vision.service")
logger.setLevel(logging.INFO)

# Map Role to maximum clearance tier
ROLE_CLEARANCE: Dict[Role, DataClassification] = {
    Role.ADMINISTRATOR: DataClassification.CRITICAL,
    Role.ENGINEER: DataClassification.RESTRICTED,
    Role.VIEWER: DataClassification.INTERNAL,
}


class VisionService:
    """Orchestrates sovereign image ingestion, multimodal analysis, and evidence conversion."""

    def __init__(
        self,
        provider: Optional[BaseVisionProvider] = None,
        verifier: Optional[VerificationEngine] = None,
    ):
        self.provider = provider or get_vision_provider()
        self.verification_engine = verifier or verification_engine

    async def analyze_image(
        self,
        image_bytes: Optional[bytes] = None,
        file_path: Optional[str] = None,
        filename: Optional[str] = None,
        equipment_id: Optional[str] = None,
        prompt: Optional[str] = None,
        classification: DataClassification = DataClassification.INTERNAL,
        role: Role = Role.ENGINEER,
        requester: str = "engineer_operator",
        verify_against_limits: bool = False,
    ) -> VisionAnalyzeResponse:
        """Analyze an engineering image, convert findings to evidence, and enforce sovereign safety rules."""
        # 1. Image ingestion & provenance extraction
        if file_path:
            data, provenance = validate_and_load_image_file(
                file_path=file_path,
                classification=classification,
            )
        elif image_bytes:
            safe_name = filename or "uploaded_image.png"
            provenance = validate_image_bytes(
                data=image_bytes,
                filename=safe_name,
                classification=classification,
            )
            data = image_bytes
        else:
            raise ValueError("Either image_bytes or file_path must be provided for visual analysis.")

        # 2. Audit Event: VISION_ANALYSIS_REQUESTED
        audit_event_sink.record_agent_event(
            AgentTraceEvent(
                event_type=AgentEventType.VISION_ANALYSIS_REQUESTED,
                requester=requester,
                role=role,
                details={
                    "filename": provenance.filename,
                    "sha256": provenance.sha256_hash,
                    "classification": provenance.classification.value,
                    "equipment_id": equipment_id,
                },
            )
        )

        # 3. Role clearance check against image classification
        max_clearance = ROLE_CLEARANCE.get(role, DataClassification.PUBLIC)
        if CLASSIFICATION_LEVELS[provenance.classification] > CLASSIFICATION_LEVELS[max_clearance]:
            raise PermissionError(
                f"Classification boundary violation: Requester with role '{role.value}' "
                f"(clearance '{max_clearance.value}') cannot access {provenance.classification.value} imagery."
            )

        # 4. Invoke Sovereign Vision Provider
        req = VisionRequest(
            image_bytes=data,
            provenance=provenance,
            prompt=prompt,
            equipment_id=equipment_id,
        )
        response: VisionResponse = await self.provider.analyze_image(req)

        # 5. Convert Visual Findings into Evidence Records
        evd_set = EvidenceSet()
        evidence_records: List[EvidenceRecord] = []
        for finding in response.findings:
            evd_record = EvidenceRecord.from_visual_finding(finding, provenance)
            evidence_records.append(evd_record)
            evd_set.add_visual_evidence(evd_record)

        # 6. Audit Event: EVIDENCE_CREATED
        for evd in evidence_records:
            audit_event_sink.record_agent_event(
                AgentTraceEvent(
                    event_type=AgentEventType.EVIDENCE_CREATED,
                    requester=requester,
                    role=role,
                    details={
                        "evidence_id": evd.evidence_id,
                        "source_type": evd.source_type,
                        "source_reference": evd.source_reference,
                        "finding_type": evd.finding_type,
                        "classification": evd.classification.value,
                    },
                )
            )

        # 7. Optional Verification Engine audit
        verification_result = None
        if verify_against_limits:
            verification_result = self.verification_engine.verify(
                query=prompt or f"Visual inspection analysis for {equipment_id or 'asset'}",
                evidence_set=evd_set,
                requester_role=role,
                requester_classification=provenance.classification,
            )

        # 8. Audit Event: VISION_ANALYSIS_COMPLETED
        audit_event_sink.record_agent_event(
            AgentTraceEvent(
                event_type=AgentEventType.VISION_ANALYSIS_COMPLETED,
                requester=requester,
                role=role,
                details={
                    "image_id": provenance.image_id,
                    "findings_count": len(response.findings),
                    "evidence_count": len(evidence_records),
                    "provider": response.provider,
                    "model": response.model,
                },
            )
        )

        return VisionAnalyzeResponse(
            status="SUCCESS",
            image_provenance=provenance,
            findings=response.findings,
            evidence_records=evidence_records,
            model_metadata={
                "provider": response.provider,
                "model": response.model,
                "usage": response.usage.model_dump(),
            },
            classification=provenance.classification,
            verification=verification_result,
        )

    async def process_request(self, request: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
        """Process API request payload."""
        image_bytes = None
        if request.image_base64:
            try:
                image_bytes = base64.b64decode(request.image_base64)
            except Exception as exc:
                raise ValueError(f"Invalid base64 image encoding: {exc}")

        return await self.analyze_image(
            image_bytes=image_bytes,
            file_path=request.image_path,
            filename=request.filename,
            equipment_id=request.equipment_id,
            prompt=request.prompt,
            classification=request.classification,
            role=request.role,
            requester=request.requester,
            verify_against_limits=True,
        )


vision_service = VisionService()
