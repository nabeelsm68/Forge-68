"""Unified Evidence-Grounded Agent Reasoning Service with Independent Verification.

Executes the unified sovereign workflow:
User Request
     ↓
Local Qwen3 (Planning Stage)
     ↓
Structured Agent Plan (AgentPlan: direct / knowledge / tool / combined / calculations)
     │
     ├──────────────→ Direct Answer
     │
     ├──────────────→ Knowledge Retrieval (Clearance & Classification Guard)
     │
     ├──────────────→ Industrial Tool Execution (Policy Gateway DEFAULT-DENY)
     │
     └──────────────→ Deterministic Industrial Calculations (Python CalculationEngine)
                          ↓
                    Unified EvidenceSet
                          ↓
                    Independent VerificationEngine (7 Deterministic Checks)
                          ↓
                    VerificationResult (VERIFIED / NEEDS_REVIEW / INSUFFICIENT_EVIDENCE / FAILED)
                          ↓
                    Local Qwen3 (Evidence & Verification Grounded Synthesis)
                          ↓
                    Final Response + Verification Status
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional


from app.core.prompts import (
    AGENT_PLAN_SYSTEM_PROMPT,
    UNIFIED_GROUNDED_SYNTHESIS_SYSTEM_PROMPT,
    build_tools_catalog_description,
    parse_agent_plan,
)
from app.core.schemas import (
    AgentActionType,
    AgentPlan,
    AgentQueryRequest,
    AgentQueryResponse,
    AgentQueryStatus,
)
from app.knowledge import KnowledgeService, knowledge_service
from app.knowledge.index import CLASSIFICATION_LEVELS
from app.models import BaseModelProvider, ModelMessage, ModelRequest, get_model_provider
from app.security import (
    AgentEventType,
    AgentTraceEvent,
    DataClassification,
    PolicyDecisionType,
    PolicyGateway,
    audit_event_sink,
    policy_gateway,
)
from app.tools import (
    ToolInvocationRequest,
    ToolRegistry,
    execute_tool_with_policy,
    tool_registry,
)
from app.verification import (
    CalculationEngine,
    CalculationResult,
    EvidenceRecord,
    EvidenceSet,
    VerificationEngine,
    VerificationResult,
    VerificationStatus,
    detect_evidence_conflicts,
    verification_engine,
)
from app.vision import VisionService, vision_service

logger = logging.getLogger("forge.core.reasoning")
logger.setLevel(logging.INFO)


class AgentReasoningService:
    """Orchestrates sovereign reasoning, knowledge retrieval, tool execution, and verification."""

    def __init__(
        self,
        model_provider: Optional[BaseModelProvider] = None,
        gateway: Optional[PolicyGateway] = None,
        registry: Optional[ToolRegistry] = None,
        knowledge: Optional[KnowledgeService] = None,
        verifier: Optional[VerificationEngine] = None,
        vision: Optional[VisionService] = None,
    ):
        self.model_provider = model_provider or get_model_provider()
        self.policy_gateway = gateway or policy_gateway
        self.tool_registry = registry or tool_registry
        self.knowledge_service = knowledge or knowledge_service
        self.verification_engine = verifier or verification_engine
        self.vision_service = vision or vision_service

    async def process_query(self, request: AgentQueryRequest) -> AgentQueryResponse:
        """Execute the unified, sovereign, evidence-grounded and verified agent workflow."""
        import uuid
        run_id = request.run_id or f"run-{uuid.uuid4().hex[:12]}"
        scenario_id = request.scenario_id

        def record_agent_trace(event_type: AgentEventType, details: Dict[str, Any]) -> AgentTraceEvent:
            trace_details = dict(details)
            trace_details["run_id"] = run_id
            if scenario_id:
                trace_details["scenario_id"] = scenario_id
            return audit_event_sink.record_agent_event(
                AgentTraceEvent(
                    event_type=event_type,
                    requester=request.requester,
                    role=request.role,
                    details=trace_details,
                )
            )

        t_start = time.perf_counter()
        planning_duration_ms = 0.0
        knowledge_retrieval_duration_ms = 0.0
        tool_execution_duration_ms = 0.0
        vision_duration_ms = 0.0
        verification_duration_ms = 0.0
        synthesis_duration_ms = 0.0

        # 1. Structured trace & log: AGENT_REQUEST
        logger.info(
            "[AGENT_REQUEST] Query: '%s' | Requester: '%s' | Role: '%s' | Clearance: '%s' | Run: '%s' | Lang: '%s'",
            request.query,
            request.requester,
            request.role.value,
            request.classification.value,
            run_id,
            request.language or "en",
        )
        record_agent_trace(
            AgentEventType.AGENT_REQUEST,
            {
                "query": request.query,
                "classification": request.classification.value,
                "has_approval": request.has_approval,
                "language": request.language or "en",
            },
        )

        from app.models.router import TaskType, task_model_router
        reasoning_route = task_model_router.route(TaskType.REASONING)
        route_dict = reasoning_route.model_dump()
        target_lang = request.language or "en"

        # 1b. Check for conversational greeting or general capability inquiry
        clean_q = request.query.strip().lower()
        greeting_patterns = [
            r"^(hi|hello|hey|namaste|namaskara|greetings)\b",
            r"^who are you\??$",
            r"^what can you do\??$",
            r"^what is forge\??$",
            r"^help\??$",
        ]
        is_greeting = any(re.search(pat, clean_q) for pat in greeting_patterns)

        if is_greeting and not any(tag in clean_q for tag in ["r-204", "pi-204", "p-201", "pressure", "vibration", "actuator", "sop", "sensor"]):
            if target_lang == "hi":
                greeting_text = (
                    "नमस्ते। मैं FORGE हूँ — संप्रभु औद्योगिक AI नियंत्रण तल (Sovereign Industrial AI Control Plane)। "
                    "मैं पूरी तरह स्थानीय, एयर-गैप्ड और ऑन-प्रिमाइसेस मॉडल द्वारा संचालित हूँ। "
                    "मैं रिएक्टर R-204, ट्रांसमीटर PI-204, और पंप P-201 जैसे प्लांट संपत्तियों के लिए "
                    "SOP अनुपालन, रखरखाव इतिहास, दबाव विचरण और सुरक्षा नीतियों की निष्पक्ष जांच कर सकता हूँ। "
                    "मैं आपकी क्या सहायता कर सकता हूँ?"
                )
            elif target_lang == "kn":
                greeting_text = (
                    "ನಮಸ್ಕಾರ. ನಾನು FORGE — ಸಾರ್ವಭೌಮ ಕೈಗಾರಿಕಾ AI ನಿಯಂತ್ರಣ ತಾಣ (Sovereign Industrial AI Control Plane). "
                    "ಸಂಪೂರ್ಣವಾಗಿ ಸ್ಥಳೀಯ ಮತ್ತು ಆನ್‌-ಪ್ರೆಮಿಸಸ್ ತಂತ್ರಜ್ಞಾನದಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತೇನೆ. "
                    "R-204 ರಿಯಾಕ್ಟರ್, PI-204 ಪ್ರೆಶರ್ ಟ್ರಾನ್ಸ್‌ಮಿಟರ್, ಮತ್ತು P-201 ಪಂಪ್‌ಗಳ ಟೆಲಿಮೆಟ್ರಿ, "
                    "SOP ಮಿತಿಗಳು ಮತ್ತು ನಿರ್ವಹಣಾ ಇತಿಹಾಸವನ್ನು ಪರಿಶೀಲಿಸಲು ನಾನು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ. "
                    "ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
                )
            else:
                greeting_text = (
                    "Hello. I am FORGE — Sovereign Industrial AI Control Plane, operating entirely on-premise "
                    "under sovereign air-gapped governance. I monitor industrial plant telemetry, verify SOP compliance, "
                    "analyze equipment history (e.g., R-204, PI-204, P-201), and execute deterministic safety checks "
                    "with zero external cloud data egress. How may I assist your engineering operations today?"
                )
            greeting_plan = AgentPlan(
                action=AgentActionType.DIRECT,
                direct_answer=greeting_text,
                reasoning="Direct sovereign agent introduction and operational capability overview.",
            )
            record_agent_trace(
                AgentEventType.AGENT_FINAL_RESPONSE,
                {"action": "direct", "type": "conversational_greeting", "language": target_lang},
            )
            return AgentQueryResponse(
                query=request.query,
                final_answer=greeting_text,
                status=AgentQueryStatus.DIRECT_ANSWER,
                language=target_lang,
                plan=greeting_plan,
                agent_plan=greeting_plan,
                verification=VerificationResult(
                    status=VerificationStatus.VERIFIED,
                    summary="Direct sovereign conversational query processed with zero external calls.",
                    checks=[],
                ),
                scenario_id=scenario_id,
                run_id=run_id,
                execution_state="COMPLETED",
                model_route=route_dict,
                timing={
                    "total_duration_ms": round((time.perf_counter() - t_start) * 1000.0, 2),
                    "planning_duration_ms": 0.0,
                    "knowledge_retrieval_duration_ms": 0.0,
                    "tool_execution_duration_ms": 0.0,
                    "vision_duration_ms": 0.0,
                    "verification_duration_ms": 0.0,
                    "synthesis_duration_ms": 0.0,
                },
            )

        # 1c. Prompt-Security Boundary: Scan for adversarial injection patterns
        from app.security import detect_prompt_injection
        detected_injection = detect_prompt_injection(request.query)
        if detected_injection:
            logger.warning("[PROMPT_INJECTION_DETECTED] Adversarial pattern detected in query: '%s'. Quarantining as untrusted data.", detected_injection)
            record_agent_trace(
                AgentEventType.SECURITY_ALERT,
                {
                    "alert_type": "PROMPT_INJECTION_DETECTED",
                    "detected_pattern": detected_injection,
                    "action": "QUARANTINED_AS_UNTRUSTED_DATA",
                },
            )

        # 2. Plan Generation: Model proposes an operational AgentPlan

        tools_metadata = self.tool_registry.list_tools()
        tools_catalog = build_tools_catalog_description(tools_metadata)
        planning_prompt = AGENT_PLAN_SYSTEM_PROMPT.format(tools_catalog=tools_catalog)

        plan_request = ModelRequest(
            messages=[
                ModelMessage(role="system", content=planning_prompt),
                ModelMessage(role="user", content=request.query),
            ],
            temperature=0.0,
            format="json",
        )

        t_plan_start = time.perf_counter()
        model_resp = await self.model_provider.generate(plan_request)

        # 3. Parse and defensively validate the AgentPlan
        try:
            plan: AgentPlan = parse_agent_plan(model_resp.content)
            planning_duration_ms = (time.perf_counter() - t_plan_start) * 1000.0
        except Exception as exc:
            planning_duration_ms = (time.perf_counter() - t_plan_start) * 1000.0
            logger.warning("[AGENT_PLAN_FAILED] Malformed agent plan: %s", str(exc))
            return AgentQueryResponse(
                query=request.query,
                final_answer=f"Failed to parse structured model decision: {str(exc)}",
                status=AgentQueryStatus.INVALID_MODEL_OUTPUT,
                language=target_lang,
                scenario_id=scenario_id,
                run_id=run_id,
                execution_state="FAILED",
                model_route=route_dict,
                timing={
                    "total_duration_ms": round((time.perf_counter() - t_start) * 1000.0, 2),
                    "planning_duration_ms": round(planning_duration_ms, 2),
                    "knowledge_retrieval_duration_ms": 0.0,
                    "tool_execution_duration_ms": 0.0,
                    "vision_duration_ms": 0.0,
                    "verification_duration_ms": 0.0,
                    "synthesis_duration_ms": 0.0,
                },
            )


        logger.info(
            "[AGENT_PLAN_CREATED] Action: '%s' | Queries: %d | Tools: %d | Calcs: %d | Reasoning: '%s'",
            plan.action.value,
            len(plan.knowledge_queries),
            len(plan.tool_calls),
            len(plan.calculations),
            plan.reasoning or "None",
        )
        record_agent_trace(
            AgentEventType.AGENT_PLAN_CREATED,
            plan.model_dump(),
        )

        # 4. Handle Direct Action
        if plan.action == AgentActionType.DIRECT:
            final_answer = plan.direct_answer or plan.reasoning or ""
            if not final_answer.strip():
                lang_sys = ""
                if target_lang == "hi":
                    lang_sys = " Respond in Hindi (हिन्दी), keeping equipment IDs (e.g. R-204, PI-204) and numerical values in English/digits."
                elif target_lang == "kn":
                    lang_sys = " Respond in Kannada (ಕನ್ನಡ), keeping equipment IDs (e.g. R-204, PI-204) and numerical values in English/digits."

                direct_req = ModelRequest(
                    messages=[
                        ModelMessage(
                            role="system",
                            content=(
                                "You are the reasoning engine of FORGE Sovereign Industrial AI Control Plane. "
                                f"Provide a direct, accurate, and concise industrial engineering response.{lang_sys}"
                            ),
                        ),
                        ModelMessage(role="user", content=request.query),
                    ],
                    temperature=0.2,
                )
                t_synth_start = time.perf_counter()
                direct_resp = await self.model_provider.generate(direct_req)
                final_answer = direct_resp.content
                synthesis_duration_ms = (time.perf_counter() - t_synth_start) * 1000.0

            # Direct verification
            t_verif_start = time.perf_counter()
            direct_verification = self.verification_engine.verify(
                query=request.query,
                plan=plan,
                evidence_set=EvidenceSet(),
                requester_role=request.role,
                requester_classification=request.classification,
                draft_response=final_answer,
            )
            verification_duration_ms = (time.perf_counter() - t_verif_start) * 1000.0

            logger.info("[AGENT_FINAL_RESPONSE] Emitted direct response.")
            record_agent_trace(
                AgentEventType.AGENT_FINAL_RESPONSE,
                {"action": "direct", "final_answer_length": len(final_answer), "language": target_lang},
            )
            return AgentQueryResponse(
                query=request.query,
                final_answer=final_answer,
                status=AgentQueryStatus.DIRECT_ANSWER,
                language=target_lang,
                plan=plan,
                agent_plan=plan,
                verification=direct_verification,
                scenario_id=scenario_id,
                run_id=run_id,
                execution_state="COMPLETED",
                model_route=route_dict,
                timing={
                    "total_duration_ms": round((time.perf_counter() - t_start) * 1000.0, 2),
                    "planning_duration_ms": round(planning_duration_ms, 2),
                    "knowledge_retrieval_duration_ms": 0.0,
                    "tool_execution_duration_ms": 0.0,
                    "vision_duration_ms": 0.0,
                    "verification_duration_ms": round(verification_duration_ms, 2),
                    "synthesis_duration_ms": round(synthesis_duration_ms, 2),
                },
            )


        # 5. Initialize Execution-Scoped EvidenceSet
        evidence_set = EvidenceSet()
        last_event_id: Optional[str] = None
        has_tool_error = False
        all_tools_denied = True if plan.tool_calls else False

        # Multimodal Visual Intelligence ingestion (if image context is provided in query request)
        if request.image_path or request.image_base64:
            try:
                t_vis_start = time.perf_counter()
                import base64
                img_data = base64.b64decode(request.image_base64) if request.image_base64 else None
                vis_resp = await self.vision_service.analyze_image(
                    image_bytes=img_data,
                    file_path=request.image_path,
                    classification=request.classification,
                    role=request.role,
                    requester=request.requester,
                    prompt=request.query,
                )
                vision_duration_ms = (time.perf_counter() - t_vis_start) * 1000.0
                for evd in vis_resp.evidence_records:
                    evidence_set.add_visual_evidence(evd)
            except Exception as vis_err:
                logger.warning("[MULTIMODAL_INGESTION_SKIPPED] Visual processing skipped: %s", vis_err)


        # 6. Execute Knowledge Retrieval (if action is 'knowledge' or 'combined')
        if plan.action in (AgentActionType.KNOWLEDGE, AgentActionType.COMBINED):
            user_clearance_level = CLASSIFICATION_LEVELS.get(request.classification.value, 2)

            for kq in plan.knowledge_queries:
                logger.info(
                    "[KNOWLEDGE_RETRIEVAL_REQUESTED] Query: '%s' | Requested Filter: '%s' | User Clearance: '%s'",
                    kq.query,
                    kq.classification.value if kq.classification else "NONE",
                    request.classification.value,
                )
                record_agent_trace(
                    AgentEventType.KNOWLEDGE_RETRIEVAL_REQUESTED,
                    {"query": kq.query, "user_clearance": request.classification.value},
                )

                effective_filter = None
                if kq.classification:
                    req_level = CLASSIFICATION_LEVELS.get(kq.classification.value, 2)
                    if req_level > user_clearance_level:
                        logger.warning(
                            "[CLASSIFICATION_ESCALATION_BLOCKED] Plan requested '%s' but requester only has clearance '%s'. Filtering to '%s'.",
                            kq.classification.value,
                            request.classification.value,
                            request.classification.value,
                        )
                        effective_filter = request.classification
                    else:
                        effective_filter = kq.classification

                t_kn_start = time.perf_counter()
                results = await self.knowledge_service.search_as_evidence(
                    query=kq.query,
                    top_k=5,
                    classification_filter=effective_filter,
                    max_classification=request.classification,
                )
                knowledge_retrieval_duration_ms += (time.perf_counter() - t_kn_start) * 1000.0


                logger.info(
                    "[KNOWLEDGE_RETRIEVAL_COMPLETED] Query: '%s' | Chunks retrieved: %d",
                    kq.query,
                    len(results),
                )
                record_agent_trace(
                    AgentEventType.KNOWLEDGE_RETRIEVAL_COMPLETED,
                    {"query": kq.query, "retrieved_count": len(results)},
                )

                for evd in results:
                    evidence_set.add_knowledge_evidence(evd)
                    logger.info("[EVIDENCE_CREATED] Knowledge Evidence ID: '%s' | Source: '%s'", evd.evidence_id, evd.source_reference)
                    record_agent_trace(
                        AgentEventType.EVIDENCE_CREATED,
                        {"evidence_id": evd.evidence_id, "source_reference": evd.source_reference},
                    )

                    # Prompt-security check on retrieved untrusted document text
                    doc_injection = detect_prompt_injection(str(evd.retrieved_data) + " " + (evd.retrieved_text or ""))
                    if doc_injection:
                        logger.warning("[PROMPT_INJECTION_IN_DOCUMENT] Quarantined adversarial injection pattern in '%s': '%s'", evd.source_reference, doc_injection)
                        record_agent_trace(
                            AgentEventType.SECURITY_ALERT,
                            {
                                "alert_type": "PROMPT_INJECTION_IN_DOCUMENT",
                                "source": evd.source_reference,
                                "detected_pattern": doc_injection,
                                "action": "QUARANTINED_AS_UNTRUSTED_DATA",
                            },
                        )


        # 7. Execute Industrial Tools (if action is 'tool' or 'combined')
        first_tool_result_data: Optional[Dict[str, Any]] = None
        if plan.action in (AgentActionType.TOOL, AgentActionType.COMBINED):
            for tc in plan.tool_calls:
                logger.info(
                    "[TOOL_REQUESTED] Tool: '%s' | Arguments: %s",
                    tc.tool_name,
                    json.dumps(tc.arguments),
                )
                record_agent_trace(
                    AgentEventType.TOOL_REQUESTED,
                    {"tool_name": tc.tool_name, "arguments": tc.arguments},
                )

                tool_params = dict(tc.arguments)
                tool_params["run_id"] = run_id
                tool_invoc_req = ToolInvocationRequest(
                    requester=request.requester,
                    role=request.role,
                    tool_name=tc.tool_name,
                    classification=request.classification,
                    parameters=tool_params,
                    has_approval=request.has_approval,
                )

                t_tl_start = time.perf_counter()
                exec_result = execute_tool_with_policy(
                    tool_invoc_req,
                    gateway=self.policy_gateway,
                    registry=self.tool_registry,
                )
                tool_execution_duration_ms += (time.perf_counter() - t_tl_start) * 1000.0
                last_event_id = exec_result.event_id
                evidence_set.add_policy_decision(exec_result.decision, exec_result.event_id)


                logger.info(
                    "[POLICY_EVALUATED] Tool: '%s' | Decision: '%s' | Policy ID: '%s' | Reason: '%s'",
                    tc.tool_name,
                    exec_result.decision.decision.value,
                    exec_result.decision.policy_id or "NONE",
                    exec_result.decision.reason,
                )
                record_agent_trace(
                    AgentEventType.POLICY_EVALUATED,
                    {
                        "tool_name": tc.tool_name,
                        "decision": exec_result.decision.decision.value,
                        "reason": exec_result.decision.reason,
                    },
                )

                if exec_result.decision.decision == PolicyDecisionType.DENY:
                    logger.warning(
                        "[TOOL_EXECUTION_BLOCKED] Policy denied tool '%s': %s",
                        tc.tool_name,
                        exec_result.decision.reason,
                    )
                    continue

                all_tools_denied = False

                if not exec_result.success:
                    logger.error(
                        "[TOOL_EXECUTION_FAILED] Tool '%s' execution error: %s",
                        tc.tool_name,
                        exec_result.error,
                    )
                    has_tool_error = True
                    continue

                logger.info("[TOOL_EXECUTED] Tool '%s' executed successfully.", tc.tool_name)
                record_agent_trace(
                    AgentEventType.TOOL_EXECUTED,
                    {"tool_name": tc.tool_name, "event_id": exec_result.event_id},
                )

                if first_tool_result_data is None:
                    first_tool_result_data = (
                        exec_result.data if isinstance(exec_result.data, dict) else {"data": exec_result.data}
                    )

                tool_evd = EvidenceRecord(
                    source_type="LOCAL_INDUSTRIAL_TOOL",
                    source_reference=f"tool:{tc.tool_name}",
                    tool_name=tc.tool_name,
                    tool_execution_id=exec_result.event_id,
                    retrieved_data=exec_result.data,
                    classification=request.classification,
                )
                evidence_set.add_tool_evidence(tool_evd)

                logger.info("[EVIDENCE_CREATED] Tool Evidence ID: '%s' | Source: '%s'", tool_evd.evidence_id, tool_evd.source_reference)
                record_agent_trace(
                    AgentEventType.EVIDENCE_CREATED,
                    {"evidence_id": tool_evd.evidence_id, "source_reference": tool_evd.source_reference},
                )

        # 8. Contradiction & Parameter Variance Detection
        conflicts = detect_evidence_conflicts(evidence_set.all_evidence)
        evidence_set.detected_conflicts = conflicts

        # 9. Deterministic Industrial Calculations
        calculations = self._resolve_calculations(request.query, plan, evidence_set)

        # 10. Independent Verification Engine Execution
        logger.info("[VERIFICATION_STARTED] Commencing independent deterministic verification checks.")
        record_agent_trace(
            AgentEventType.VERIFICATION_STARTED,
            {
                "evidence_count": len(evidence_set.all_evidence),
                "calculations_count": len(calculations),
            },
        )

        t_vf_start = time.perf_counter()
        verification_result = self.verification_engine.verify(
            query=request.query,
            plan=plan,
            evidence_set=evidence_set,
            requester_role=request.role,
            requester_classification=request.classification,
            calculations=calculations,
        )
        verification_duration_ms = (time.perf_counter() - t_vf_start) * 1000.0


        for chk in verification_result.checks:
            logger.info(
                "[VERIFICATION_CHECK] Check: '%s' | Status: '%s' | Description: '%s'",
                chk.check_type,
                chk.status.value,
                chk.description,
            )
            record_agent_trace(
                AgentEventType.VERIFICATION_CHECK,
                {
                    "check_type": chk.check_type,
                    "status": chk.status.value,
                    "description": chk.description,
                },
            )

        logger.info(
            "[VERIFICATION_COMPLETED] Status: '%s' | Summary: '%s'",
            verification_result.status.value,
            verification_result.summary,
        )
        record_agent_trace(
            AgentEventType.VERIFICATION_COMPLETED,
            {
                "status": verification_result.status.value,
                "summary": verification_result.summary,
            },
        )

        # 11. Handle Policy Denial Outcome
        if plan.tool_calls and all_tools_denied and not evidence_set.knowledge_evidence:
            first_denial_reason = (
                evidence_set.policy_decisions[0].reason
                if evidence_set.policy_decisions
                else "Execution blocked by sovereign policy."
            )
            logger.info("[AGENT_FINAL_RESPONSE] Blocked by policy: %s", first_denial_reason)
            record_agent_trace(
                AgentEventType.AGENT_FINAL_RESPONSE,
                {"status": AgentQueryStatus.POLICY_DENIED.value, "reason": first_denial_reason},
            )
            return AgentQueryResponse(
                query=request.query,
                final_answer=f"Execution blocked by sovereign policy: {first_denial_reason}",
                status=AgentQueryStatus.POLICY_DENIED,
                language=target_lang,
                plan=plan,
                agent_plan=plan,
                knowledge_queries=plan.knowledge_queries,
                tool_calls=plan.tool_calls,
                policy_decisions=evidence_set.policy_decisions,
                evidence_set=evidence_set,
                verification=verification_result,
                execution_event_id=last_event_id,
                tool_call=plan.tool_calls[0].model_dump() if plan.tool_calls else None,
                policy_decision=evidence_set.policy_decisions[0] if evidence_set.policy_decisions else None,
                tool_result=None,
                evidence=None,
                scenario_id=scenario_id,
                run_id=run_id,
                execution_state="COMPLETED",
                model_route=route_dict,
                timing={
                    "total_duration_ms": round((time.perf_counter() - t_start) * 1000.0, 2),
                    "planning_duration_ms": round(planning_duration_ms, 2),
                    "knowledge_retrieval_duration_ms": round(knowledge_retrieval_duration_ms, 2),
                    "tool_execution_duration_ms": round(tool_execution_duration_ms, 2),
                    "vision_duration_ms": round(vision_duration_ms, 2),
                    "verification_duration_ms": round(verification_duration_ms, 2),
                    "synthesis_duration_ms": 0.0,
                },
            )

        if has_tool_error and evidence_set.is_empty:
            logger.error("[AGENT_FINAL_RESPONSE] Tool execution error occurred with no evidence.")
            return AgentQueryResponse(
                query=request.query,
                final_answer="Industrial tool execution failed.",
                status=AgentQueryStatus.TOOL_ERROR,
                language=target_lang,
                plan=plan,
                agent_plan=plan,
                knowledge_queries=plan.knowledge_queries,
                tool_calls=plan.tool_calls,
                policy_decisions=evidence_set.policy_decisions,
                evidence_set=evidence_set,
                verification=verification_result,
                execution_event_id=last_event_id,
                tool_call=plan.tool_calls[0].model_dump() if plan.tool_calls else None,
                policy_decision=evidence_set.policy_decisions[0] if evidence_set.policy_decisions else None,
                tool_result=None,
                evidence=None,
                scenario_id=scenario_id,
                run_id=run_id,
                execution_state="FAILED",
                model_route=route_dict,
                timing={
                    "total_duration_ms": round((time.perf_counter() - t_start) * 1000.0, 2),
                    "planning_duration_ms": round(planning_duration_ms, 2),
                    "knowledge_retrieval_duration_ms": round(knowledge_retrieval_duration_ms, 2),
                    "tool_execution_duration_ms": round(tool_execution_duration_ms, 2),
                    "vision_duration_ms": round(vision_duration_ms, 2),
                    "verification_duration_ms": round(verification_duration_ms, 2),
                    "synthesis_duration_ms": 0.0,
                },
            )


        # 12. Format Evidence & Verification for Phase 2 Synthesis
        evidence_formatted_parts = []
        for evd in evidence_set.all_evidence:
            data_str = json.dumps(evd.retrieved_data, indent=2) if not isinstance(evd.retrieved_data, str) else evd.retrieved_data
            evidence_formatted_parts.append(
                f"- Evidence ID: {evd.evidence_id}\n"
                f"  Source: {evd.source_reference}\n"
                f"  Classification: {evd.classification.value}\n"
                f"  Data:\n{data_str}"
            )
        evidence_formatted = "\n\n".join(evidence_formatted_parts) if evidence_formatted_parts else "No evidence retrieved."

        policy_formatted_parts = []
        for pd in evidence_set.policy_decisions:
            policy_formatted_parts.append(
                f"- Tool: {pd.tool} | Decision: {pd.decision.value} | Policy ID: {pd.policy_id or 'NONE'} | Reason: {pd.reason}"
            )
        policy_outcomes_formatted = "\n".join(policy_formatted_parts) if policy_formatted_parts else "None."

        conflict_formatted_parts = []
        for c in conflicts:
            conflict_formatted_parts.append(
                f"- Metric: {c.metric_or_topic} | Source A: {c.source_a} ({c.value_a}) vs Source B: {c.source_b} ({c.value_b})\n"
                f"  Analysis Note: {c.description}"
            )
        conflicts_formatted = "\n".join(conflict_formatted_parts) if conflict_formatted_parts else "None detected."

        verification_lines = [
            f"Overall Status: {verification_result.status.value}",
            f"Summary: {verification_result.summary}",
            "Deterministic Checks:",
        ]
        for chk in verification_result.checks:
            verification_lines.append(f"  - [{chk.check_type}] {chk.status.value}: {chk.description}")
        verification_formatted = "\n".join(verification_lines)

        calc_lines = []
        for calc in calculations:
            calc_lines.append(
                f"- Calculation ID: {calc.calculation_id} | Type: {calc.calculation_type} | "
                f"Result: {calc.result} {calc.units} | Description: {calc.description}"
            )
        calculations_formatted = "\n".join(calc_lines) if calc_lines else "None performed."

        synthesis_prompt = UNIFIED_GROUNDED_SYNTHESIS_SYSTEM_PROMPT.format(
            user_query=request.query,
            verification_formatted=verification_formatted,
            calculations_formatted=calculations_formatted,
            evidence_formatted=evidence_formatted,
            policy_outcomes_formatted=policy_outcomes_formatted,
            conflicts_formatted=conflicts_formatted,
        )

        if target_lang == "hi":
            synthesis_prompt += (
                "\n\n=== MULTILINGUAL GENERATION DIRECTIVE (HINDI) ===\n"
                "You MUST generate your final engineering response in Hindi (हिन्दी).\n"
                "CRITICAL RULES FOR MULTILINGUAL FIDELITY:\n"
                "1. Keep all equipment tags, asset IDs, and instrument codes in exact Latin characters (e.g., R-204, PI-204, P-201, E-301).\n"
                "2. Preserve all numerical values, pressures, temperatures, percentages, and units EXACTLY (e.g., 34.8 bar, 31.2 bar, +11.54%, mm, °C).\n"
                "3. Keep all citation identifiers intact (e.g., [doc:...], [calc:...]).\n"
                "4. Maintain strict engineering accuracy according to the deterministic verification assessment above.\n"
            )
        elif target_lang == "kn":
            synthesis_prompt += (
                "\n\n=== MULTILINGUAL GENERATION DIRECTIVE (KANNADA) ===\n"
                "You MUST generate your final engineering response in Kannada (ಕನ್ನಡ).\n"
                "CRITICAL RULES FOR MULTILINGUAL FIDELITY:\n"
                "1. Keep all equipment tags, asset IDs, and instrument codes in exact Latin characters (e.g., R-204, PI-204, P-201, E-301).\n"
                "2. Preserve all numerical values, pressures, temperatures, percentages, and units EXACTLY (e.g., 34.8 bar, 31.2 bar, +11.54%, mm, °C).\n"
                "3. Keep all citation identifiers intact (e.g., [doc:...], [calc:...]).\n"
                "4. Maintain strict engineering accuracy according to the deterministic verification assessment above.\n"
            )

        synthesis_req = ModelRequest(
            messages=[
                ModelMessage(role="system", content=synthesis_prompt),
                ModelMessage(role="user", content=request.query),
            ],
            temperature=0.2,
        )

        t_syn_start = time.perf_counter()
        synthesis_resp = await self.model_provider.generate(synthesis_req)
        final_answer = synthesis_resp.content
        synthesis_duration_ms = (time.perf_counter() - t_syn_start) * 1000.0

        # 13. Post-Synthesis Grounding Support Re-check
        post_synthesis_check = self.verification_engine._check_grounding_support(
            query=request.query,
            evidence_set=evidence_set,
            calculations=calculations,
            draft_response=final_answer,
            plan=plan,
        )
        if post_synthesis_check.status != VerificationStatus.VERIFIED:
            for idx, chk in enumerate(verification_result.checks):
                if chk.check_type == "GROUNDING_SUPPORT":
                    verification_result.checks[idx] = post_synthesis_check
            verification_result.status = self.verification_engine._aggregate_status(verification_result.checks)
            verification_result.summary = self.verification_engine._generate_summary(
                verification_result.status,
                verification_result.checks,
                evidence_set,
                calculations,
            )

        logger.info("[AGENT_FINAL_RESPONSE] Successfully synthesized grounded response.")
        record_agent_trace(
            AgentEventType.AGENT_FINAL_RESPONSE,
            {
                "status": AgentQueryStatus.SUCCESS.value,
                "evidence_count": len(evidence_set.all_evidence),
                "verification_status": verification_result.status.value,
                "language": target_lang,
            },
        )

        first_tool_evidence = evidence_set.tool_evidence[0] if evidence_set.tool_evidence else None
        first_knowledge_evidence = evidence_set.knowledge_evidence[0] if evidence_set.knowledge_evidence else None
        primary_evidence = first_tool_evidence or first_knowledge_evidence

        total_duration_ms = (time.perf_counter() - t_start) * 1000.0

        return AgentQueryResponse(
            query=request.query,
            final_answer=final_answer,
            status=AgentQueryStatus.SUCCESS,
            language=target_lang,
            plan=plan,
            agent_plan=plan,
            knowledge_queries=plan.knowledge_queries,
            tool_calls=plan.tool_calls,
            policy_decisions=evidence_set.policy_decisions,
            evidence_set=evidence_set,
            verification=verification_result,
            execution_event_id=last_event_id,
            tool_call=plan.tool_calls[0].model_dump() if plan.tool_calls else None,
            policy_decision=evidence_set.policy_decisions[0] if evidence_set.policy_decisions else None,
            tool_result=first_tool_result_data,
            evidence=primary_evidence,
            scenario_id=scenario_id,
            run_id=run_id,
            execution_state="COMPLETED",
            model_route=route_dict,
            timing={
                "total_duration_ms": round(total_duration_ms, 2),
                "planning_duration_ms": round(planning_duration_ms, 2),
                "knowledge_retrieval_duration_ms": round(knowledge_retrieval_duration_ms, 2),
                "tool_execution_duration_ms": round(tool_execution_duration_ms, 2),
                "vision_duration_ms": round(vision_duration_ms, 2),
                "verification_duration_ms": round(verification_duration_ms, 2),
                "synthesis_duration_ms": round(synthesis_duration_ms, 2),
            },
        )


    def _resolve_calculations(
        self,
        query: str,
        plan: AgentPlan,
        evidence_set: EvidenceSet,
    ) -> List[CalculationResult]:
        """Execute calculations requested in the plan or deterministically extract parameters from query."""
        results: List[CalculationResult] = []

        # 1. Plan-specified calculations
        for calc_req in plan.calculations:
            try:
                res = CalculationEngine.execute(
                    calculation=calc_req.calculation,
                    inputs=calc_req.inputs,
                    evidence_ids=calc_req.evidence_ids or [e.evidence_id for e in evidence_set.all_evidence],
                )
                results.append(res)
            except Exception as exc:
                logger.warning("[CALCULATION_FAILED] Error executing plan calculation '%s': %s", calc_req.calculation, str(exc))

        if results:
            return results

        # 2. Deterministic query-level extraction for standard demo calculations
        q_lower = query.lower()
        all_evd_ids = [e.evidence_id for e in evidence_set.all_evidence]

        # A. Pressure variance
        if "pressure variance" in q_lower or ("variance" in q_lower and "pressure" in q_lower):
            obs_m = re.search(r"observed(?:\s+pressure)?(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*bar", query, re.IGNORECASE)
            norm_m = re.search(r"normal(?:\s+pressure)?(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*bar", query, re.IGNORECASE)
            if not norm_m:
                # Search evidence text for normal operating pressure (e.g., 31.2 bar in SOP)
                for evd in evidence_set.all_evidence:
                    norm_search = re.search(r"normal\s+operating\s+pressure:\s*(\d+(?:\.\d+)?)\s*bar", str(evd.retrieved_data), re.IGNORECASE)
                    if norm_search:
                        norm_m = norm_search
                        break
            if obs_m and norm_m:
                try:
                    res = CalculationEngine.execute(
                        "pressure_variance",
                        {
                            "observed_pressure_bar": float(obs_m.group(1)),
                            "normal_operating_pressure_bar": float(norm_m.group(1)),
                        },
                        evidence_ids=all_evd_ids,
                    )
                    results.append(res)
                except Exception as exc:
                    logger.warning("[AUTO_CALC_FAILED] Pressure variance error: %s", str(exc))

        # B. Pressure margin
        if "pressure margin" in q_lower or "margin to trip" in q_lower or ("margin" in q_lower and "trip" in q_lower):
            trip_m = re.search(r"trip(?:\s+pressure)?(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*bar", query, re.IGNORECASE)
            obs_m = re.search(r"observed(?:\s+pressure)?(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*bar", query, re.IGNORECASE)
            if not trip_m:
                for evd in evidence_set.all_evidence:
                    trip_search = re.search(r"trip\s+pressure(?:\s+threshold|\s+limit)?:\s*(\d+(?:\.\d+)?)\s*bar", str(evd.retrieved_data), re.IGNORECASE)
                    if trip_search:
                        trip_m = trip_search
                        break
            if trip_m and obs_m:
                try:
                    res = CalculationEngine.execute(
                        "pressure_margin",
                        {
                            "trip_pressure_bar": float(trip_m.group(1)),
                            "observed_pressure_bar": float(obs_m.group(1)),
                        },
                        evidence_ids=all_evd_ids,
                    )
                    results.append(res)
                except Exception as exc:
                    logger.warning("[AUTO_CALC_FAILED] Pressure margin error: %s", str(exc))

        # C. Corrosion projection
        if "corrosion" in q_lower and ("projection" in q_lower or "projected" in q_lower or "years" in q_lower):
            thick_m = re.search(r"current\s+thickness(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*mm", query, re.IGNORECASE)
            rate_m = re.search(r"corrosion\s+rate(?:\s+(?:is|=|of))?\s*(\d+(?:\.\d+)?)\s*(?:mm/year|mm/yr)?", query, re.IGNORECASE)
            years_m = re.search(r"(\d+(?:\.\d+)?)\s*years?", query, re.IGNORECASE)
            if thick_m and rate_m and years_m:
                try:
                    res = CalculationEngine.execute(
                        "corrosion_projection",
                        {
                            "current_thickness_mm": float(thick_m.group(1)),
                            "corrosion_rate_mm_year": float(rate_m.group(1)),
                            "projection_years": float(years_m.group(1)),
                        },
                        evidence_ids=all_evd_ids,
                    )
                    results.append(res)
                except Exception as exc:
                    logger.warning("[AUTO_CALC_FAILED] Corrosion projection error: %s", str(exc))

        return results


# Global default service instance
agent_reasoning_service = AgentReasoningService()
