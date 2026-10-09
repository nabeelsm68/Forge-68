"""Typed schemas for FORGE Milestone 9 Demo Harness and Scenarios."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.core.schemas import AgentQueryResponse, AgentQueryStatus
from app.security.models import DataClassification, Role
from app.verification.calculations import CalculationResult
from app.vision.models import VisualFinding


class DemoScenarioId(str, Enum):
    """Typed identifiers for the four industrial demonstration scenarios."""
    R204_INVESTIGATION = "r204_investigation"
    R204_PRESSURE_VARIANCE = "r204_pressure_variance"
    POLICY_DENIAL = "policy_denial"
    PROMPT_INJECTION = "prompt_injection"


class DemoScenarioMetadata(BaseModel):
    """Declarative description and expectations for a demo scenario."""
    id: DemoScenarioId
    title: str
    description: str
    prompt: str
    role: Role
    clearance: DataClassification
    image_path: Optional[str] = None
    expected_status: AgentQueryStatus
    expected_verification: str
    highlights: List[str] = Field(default_factory=list)


class DemoRunRequest(BaseModel):
    """Payload to execute an end-to-end industrial demo mission."""
    scenario: DemoScenarioId = Field(..., description="Scenario identifier to execute")
    scenario_id: Optional[DemoScenarioId] = Field(default=None, description="Explicit scenario identifier alias")
    run_id: Optional[str] = Field(default=None, description="Unique execution run identifier")
    role: Optional[Role] = Field(default=None, description="Optional override role")
    classification: Optional[DataClassification] = Field(default=None, description="Optional override clearance")
    deterministic: bool = Field(default=True, description="Enforce deterministic sovereign execution mode")



class DemoExecutionTiming(BaseModel):
    """Monotonic execution timings for each phase in milliseconds."""
    total_duration_ms: float = Field(..., description="Total end-to-end mission execution time in ms")
    planning_duration_ms: float = Field(default=0.0, description="Model planning duration in ms")
    knowledge_retrieval_duration_ms: float = Field(default=0.0, description="Knowledge vector retrieval duration in ms")
    tool_execution_duration_ms: float = Field(default=0.0, description="Industrial tool invocation duration in ms")
    vision_duration_ms: float = Field(default=0.0, description="Multimodal image analysis duration in ms")
    verification_duration_ms: float = Field(default=0.0, description="Independent verification engine checks duration in ms")
    synthesis_duration_ms: float = Field(default=0.0, description="Evidence-grounded synthesis generation duration in ms")


class DemoResetResponse(BaseModel):
    """Response returned upon resetting transient demo execution state."""
    status: str = Field(default="RESET_COMPLETE")
    cleared_audit_events_count: int = Field(..., description="Number of transient audit/trace events cleared")
    cleared_security_events_count: int = Field(default=0, description="Number of security trace events cleared")
    reset_counters: Dict[str, int] = Field(default_factory=dict, description="Reset counters")
    knowledge_documents_preserved: int = Field(..., description="Count of preserved sovereign documents")
    equipment_records_preserved: int = Field(..., description="Count of preserved equipment records")
    models_preserved: bool = Field(default=True, description="Local model files and weights remained untouched")
    message: str = Field(..., description="Confirmation statement")


class DemoRunResponse(AgentQueryResponse):
    """Structured response for M8 UI containing complete auditable demo trajectory."""
    scenario: DemoScenarioId
    scenario_id: DemoScenarioId = Field(..., description="Explicit scenario identifier")
    run_id: str = Field(..., description="Unique execution run identifier")
    execution_state: str = Field(default="COMPLETED", description="Current execution state")
    scenario_title: str
    execution_phases: List[str] = Field(default_factory=list)
    audit_events: List[Dict[str, Any]] = Field(default_factory=list)
    security_events: List[Dict[str, Any]] = Field(default_factory=list)
    visual_findings: List[VisualFinding] = Field(default_factory=list)
    calculations: List[CalculationResult] = Field(default_factory=list)
    timing: Optional[DemoExecutionTiming] = Field(default=None, description="Monotonic execution timing breakdown in ms")
    is_synthetic: bool = True
    synthetic_notice: str = "SYNTHETIC INDUSTRIAL TELEMETRY — AIR-GAPPED DEMONSTRATION DATA ONLY"

