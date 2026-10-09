"""Structured schemas for model decision extraction, agent plans, and queries."""

from enum import Enum
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

from app.security.models import DataClassification, PolicyDecision, Role
from app.verification.calculations import CalculationRequest
from app.verification.evidence import EvidenceRecord, EvidenceSet
from app.verification.models import VerificationResult



def validate_no_code_injection(args: Any) -> None:
    """Reject arbitrary Python, shell commands, or code execution patterns in tool arguments."""
    forbidden_patterns = [
        r"__import__",
        r"\beval\s*\(",
        r"\bexec\s*\(",
        r"\bos\.system\b",
        r"\bsubprocess\b",
        r"\bsh\s+-c\b",
        r"\bbash\s+-c\b",
        r"\bpowershell\b",
        r"<script\b",
    ]
    text_repr = str(args)
    for pattern in forbidden_patterns:
        if re.search(pattern, text_repr, re.IGNORECASE):
            raise ValueError(
                f"Security Exception: Suspicious code or shell execution pattern detected in arguments: '{pattern}'."
            )


# =========================================================================
# Milestone 3: Legacy Model Decision Schemas (Maintained for Compatibility)
# =========================================================================

class ModelActionType(str, Enum):
    """Action category determined by the reasoning model."""
    TOOL_CALL = "tool_call"
    FINAL = "final"


class ModelToolDecision(BaseModel):
    """Structured, machine-readable tool call or final answer requested by local model."""
    action: ModelActionType
    tool_name: Optional[str] = None
    arguments: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None
    answer: Optional[str] = None

    @model_validator(mode="after")
    def validate_action_fields(self) -> "ModelToolDecision":
        if self.action == ModelActionType.TOOL_CALL:
            if not self.tool_name or not self.tool_name.strip():
                raise ValueError("tool_name is required when action is 'tool_call'.")
            if not self.reason or not self.reason.strip():
                raise ValueError("reason is required when action is 'tool_call'.")
            
            # Security guard against code injection in arguments
            validate_no_code_injection(self.arguments)

        elif self.action == ModelActionType.FINAL:
            if not self.answer or not self.answer.strip():
                raise ValueError("answer is required when action is 'final'.")

        return self


# =========================================================================
# Milestone 5: Unified Structured Agent Plan
# =========================================================================

class AgentActionType(str, Enum):
    """Unified operational action category determined by Qwen3."""
    DIRECT = "direct"
    KNOWLEDGE = "knowledge"
    TOOL = "tool"
    COMBINED = "combined"


class KnowledgeQueryPlan(BaseModel):
    """Structured knowledge retrieval request proposed in an AgentPlan."""
    query: str = Field(..., description="Target retrieval search query")
    classification: Optional[DataClassification] = Field(
        default=None,
        description="Target classification context (cannot weaken or override stored classification)"
    )


class ToolCallPlan(BaseModel):
    """Structured industrial tool invocation proposed in an AgentPlan."""
    tool_name: str = Field(..., description="Target registered tool name")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Typed invocation arguments")

    @model_validator(mode="after")
    def validate_tool_call(self) -> "ToolCallPlan":
        if not self.tool_name or not self.tool_name.strip():
            raise ValueError("tool_name is required in tool call plan.")
        validate_no_code_injection(self.arguments)
        return self


class AgentPlan(BaseModel):
    """Typed, structured execution plan emitted by the sovereign reasoning model."""
    action: AgentActionType
    knowledge_queries: List[KnowledgeQueryPlan] = Field(
        default_factory=list,
        description="List of knowledge queries if knowledge retrieval is needed"
    )
    tool_calls: List[ToolCallPlan] = Field(
        default_factory=list,
        description="List of industrial tool invocations if tool execution is needed"
    )
    calculations: List[CalculationRequest] = Field(
        default_factory=list,
        description="List of deterministic industrial calculations requested"
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Technical justification for proposed actions"
    )
    direct_answer: Optional[str] = Field(
        default=None,
        description="Direct response text if action is direct"
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_decision(cls, data: Any) -> Any:
        """Seamlessly map legacy Milestone 3 tool_call / final JSON formats into AgentPlan."""
        if isinstance(data, dict):
            data = dict(data)
            raw_action = str(data.get("action", "")).lower()
            if raw_action == "tool_call":
                data["action"] = "tool"
                if "tool_name" in data and not data.get("tool_calls"):
                    data["tool_calls"] = [{
                        "tool_name": data["tool_name"],
                        "arguments": data.get("arguments", {})
                    }]
                if "reason" in data and not data.get("reasoning"):
                    data["reasoning"] = data["reason"]
            elif raw_action in ("final", "direct_answer"):
                data["action"] = "direct"
                if "answer" in data and not data.get("direct_answer"):
                    data["direct_answer"] = data["answer"]
        return data

    @model_validator(mode="after")
    def validate_plan_requirements(self) -> "AgentPlan":
        """Enforce strict presence of required queries or tool calls per action category."""
        if self.action == AgentActionType.KNOWLEDGE:
            if not self.knowledge_queries:
                raise ValueError("Agent plan action 'knowledge' requires at least one query in knowledge_queries.")
        elif self.action == AgentActionType.TOOL:
            if not self.tool_calls:
                raise ValueError("Agent plan action 'tool' requires at least one call in tool_calls.")
        elif self.action == AgentActionType.COMBINED:
            if not self.knowledge_queries:
                raise ValueError("Agent plan action 'combined' requires at least one query in knowledge_queries.")
            if not self.tool_calls:
                raise ValueError("Agent plan action 'combined' requires at least one call in tool_calls.")
        return self


# =========================================================================
# Query Request & Response Interfaces
# =========================================================================

class AgentQueryStatus(str, Enum):
    """Overall status of the agent query execution loop."""
    SUCCESS = "SUCCESS"
    POLICY_DENIED = "POLICY_DENIED"
    TOOL_ERROR = "TOOL_ERROR"
    DIRECT_ANSWER = "DIRECT_ANSWER"
    INVALID_MODEL_OUTPUT = "INVALID_MODEL_OUTPUT"


class AgentQueryRequest(BaseModel):
    """User or system request to the sovereign agent reasoning loop."""
    query: str = Field(..., description="Industrial operational or maintenance inquiry")
    role: Role = Field(default=Role.ENGINEER, description="Role context of the requester")
    requester: str = Field(default="engineer_operator", description="Identity of requester")
    classification: DataClassification = Field(
        default=DataClassification.INTERNAL,
        description="Data classification level of the query context"
    )
    has_approval: bool = Field(default=False, description="Whether human/supervisor approval is present")
    image_path: Optional[str] = Field(default=None, description="Optional path to local engineering image for multimodal reasoning")
    image_base64: Optional[str] = Field(default=None, description="Optional base64 encoded image for multimodal reasoning")
    scenario_id: Optional[str] = Field(default=None, description="Explicit scenario identifier for traceability")
    run_id: Optional[str] = Field(default=None, description="Unique execution run identifier")
    language: Optional[str] = Field(default="en", description="Target interaction language: 'en', 'hi', or 'kn'")


class AgentQueryResponse(BaseModel):
    """Complete, auditable trace of the unified evidence-grounded reasoning workflow."""
    query: str
    final_answer: str
    status: AgentQueryStatus
    language: str = Field(default="en", description="Interaction language")
    plan: Optional[AgentPlan] = None
    agent_plan: Optional[AgentPlan] = None
    knowledge_queries: List[KnowledgeQueryPlan] = Field(default_factory=list)
    tool_calls: List[ToolCallPlan] = Field(default_factory=list)
    policy_decisions: List[PolicyDecision] = Field(default_factory=list)
    evidence_set: Optional[EvidenceSet] = None
    verification: Optional[VerificationResult] = None
    execution_event_id: Optional[str] = None
    scenario_id: Optional[str] = Field(default=None, description="Explicit scenario identifier")
    run_id: Optional[str] = Field(default=None, description="Unique execution run identifier")
    execution_state: str = Field(default="COMPLETED", description="Current execution state")
    model_route: Optional[Dict[str, Any]] = Field(default=None, description="Task model routing decision")

    # Milestone 3 backward compatibility fields
    tool_call: Optional[Dict[str, Any]] = None
    policy_decision: Optional[PolicyDecision] = None
    tool_result: Optional[Dict[str, Any]] = None
    evidence: Optional[EvidenceRecord] = None
    timing: Optional[Any] = None
    latency_ms: Optional[float] = Field(default=None, description="End-to-end execution latency in milliseconds")

