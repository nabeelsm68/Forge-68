"""Comprehensive unit test suite for the FORGE Sovereign Policy Gateway."""

import pytest
from app.security import (
    DataClassification,
    ExecutionStatus,
    PolicyDecisionType,
    PolicyEvaluationRequest,
    PolicyGateway,
    policy_gateway,
    PolicyRule,
    RiskLevel,
    Role,
    audit_event_sink,
)
from app.tools import (
    BaseTool,
    ToolDefinition,
    ToolRegistry,
    tool_registry,
)
from pydantic import BaseModel


class DummyInput(BaseModel):
    command: str = "test"


class DummyOutput(BaseModel):
    result: str = "ok"


def dummy_handler(inp: DummyInput) -> DummyOutput:
    return DummyOutput(result=inp.command)


@pytest.fixture(autouse=True)
def clean_audit_sink():
    """Clear audit event sink before each test."""
    audit_event_sink.clear()
    yield
    audit_event_sink.clear()


@pytest.fixture
def custom_gateway():
    """Build isolated gateway with custom registry and policies."""
    registry = ToolRegistry()
    # Add dummy critical tool
    crit_tool = ToolDefinition(
        name="emergency_valve_actuation",
        version="1.0.0",
        description="Trigger emergency valve shutdown",
        risk_level=RiskLevel.CRITICAL,
        allowed_roles=[Role.ENGINEER, Role.ADMIN, Role.SECURITY_OFFICER],
        allowed_classifications=[DataClassification.INTERNAL, DataClassification.CRITICAL],
        approval_required=True,
        input_model=DummyInput,
        output_model=DummyOutput,
        handler=dummy_handler,
    )
    registry.register(crit_tool)

    policies = [
        PolicyRule(
            rule_id="POL-TEST-001",
            name="Equipment History Access Policy",
            description="Permits Engineers and Inspectors to access equipment history.",
            target_tool="equipment_history",
            allowed_roles={Role.ENGINEER, Role.INSPECTOR},
            allowed_classifications={DataClassification.INTERNAL, DataClassification.CONFIDENTIAL},
            max_risk_level=RiskLevel.LOW,
            require_approval=False,
        ),
        PolicyRule(
            rule_id="POL-TEST-002",
            name="Emergency Valve Actuation Policy",
            description="Permits Engineers with supervisor approval.",
            target_tool="emergency_valve_actuation",
            allowed_roles={Role.ENGINEER, Role.ADMIN},
            allowed_classifications={DataClassification.INTERNAL, DataClassification.CRITICAL},
            max_risk_level=RiskLevel.CRITICAL,
            require_approval=True,
        ),
    ]

    # Include equipment_history from global registry
    eq_tool = tool_registry.get("equipment_history")
    if eq_tool:
        registry.register(eq_tool)

    return PolicyGateway(registry=registry, policies=policies)


# =========================================================================
# The 8 Mandated Specification Cases
# =========================================================================

def test_case_1_engineer_equipment_history_internal_allow(custom_gateway):
    """CASE 1: ENGINEER + equipment_history + INTERNAL -> ALLOW."""
    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.ALLOW
    assert "Explicitly permitted by policy" in decision.reason
    assert decision.policy_id == "POL-TEST-001"
    assert decision.role == Role.ENGINEER
    assert decision.tool == "equipment_history"
    assert decision.classification == DataClassification.INTERNAL
    assert decision.risk == RiskLevel.LOW
    assert decision.approval_required is False


def test_case_2_inspector_equipment_history_internal_allow(custom_gateway):
    """CASE 2: INSPECTOR + equipment_history + INTERNAL -> ALLOW."""
    req = PolicyEvaluationRequest(
        requester="inspector_bob",
        role=Role.INSPECTOR,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.ALLOW
    assert decision.policy_id == "POL-TEST-001"
    assert decision.role == Role.INSPECTOR


def test_case_3_unauthorized_role_deny(custom_gateway):
    """CASE 3: UNAUTHORIZED ROLE -> DENY."""
    # MANAGER is not in the allowed roles for equipment_history
    req = PolicyEvaluationRequest(
        requester="manager_charlie",
        role=Role.MANAGER,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.DENY
    assert "is not authorized to execute tool" in decision.reason
    assert decision.policy_id is None


def test_case_4_unknown_tool_deny(custom_gateway):
    """CASE 4: UNKNOWN TOOL -> DENY."""
    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="arbitrary_python_eval",
        classification=DataClassification.INTERNAL,
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.DENY
    assert "Unknown or unregistered tool" in decision.reason
    assert "arbitrary_python_eval" in decision.reason


def test_case_5_no_matching_policy_deny():
    """CASE 5: NO MATCHING POLICY -> DENY (Default-Deny)."""
    # Create a gateway with registered tool but ZERO active policies
    reg = ToolRegistry()
    eq = tool_registry.get("equipment_history")
    if eq:
        reg.register(eq)

    empty_policy_gateway = PolicyGateway(registry=reg, policies=[])

    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = empty_policy_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.DENY
    assert "Default-Deny: No matching policy rule explicitly permits tool" in decision.reason


def test_case_6_classification_mismatch_deny(custom_gateway):
    """CASE 6: CLASSIFICATION MISMATCH -> DENY."""
    # equipment_history only permits INTERNAL and CONFIDENTIAL; RESTRICTED must be rejected
    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="equipment_history",
        classification=DataClassification.RESTRICTED,
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.DENY
    assert "Data classification 'RESTRICTED' is not permitted" in decision.reason


def test_case_7_critical_risk_without_approval_deny(custom_gateway):
    """CASE 7: CRITICAL-RISK TOOL WITHOUT APPROVAL -> DENY."""
    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="emergency_valve_actuation",
        classification=DataClassification.CRITICAL,
        has_approval=False,  # NO approval provided
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.DENY
    assert "requires mandatory supervisor approval" in decision.reason
    assert decision.approval_required is True
    assert decision.approved is False


def test_case_8_valid_tool_role_classification_approval_allow(custom_gateway):
    """CASE 8: VALID TOOL + VALID ROLE + VALID CLASSIFICATION + APPROVAL -> ALLOW."""
    req = PolicyEvaluationRequest(
        requester="engineer_alice",
        role=Role.ENGINEER,
        tool_name="emergency_valve_actuation",
        classification=DataClassification.CRITICAL,
        has_approval=True,  # Approval supplied!
    )
    decision = custom_gateway.evaluate(req)

    assert decision.decision == PolicyDecisionType.ALLOW
    assert decision.policy_id == "POL-TEST-002"
    assert decision.approval_required is True
    assert decision.approved is True


# =========================================================================
# Additional Robustness & Event Tests
# =========================================================================

def test_auditable_execution_event_emitted(custom_gateway):
    """Verify that every evaluation produces an auditable event in the event sink."""
    audit_event_sink.clear()
    assert len(audit_event_sink.get_events()) == 0

    req = PolicyEvaluationRequest(
        requester="auditor_dave",
        role=Role.AUDITOR,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = custom_gateway.evaluate(req)
    assert decision.decision == PolicyDecisionType.DENY

    events = audit_event_sink.get_events()
    assert len(events) == 1
    event = events[0]
    assert event.requester == "auditor_dave"
    assert event.tool == "equipment_history"
    assert event.decision == PolicyDecisionType.DENY
    assert event.execution_status == ExecutionStatus.BLOCKED_BY_POLICY
    assert event.event_id is not None
    assert event.timestamp is not None


def test_case_viewer_read_only_denies_all_tools():
    """Verify that Role.VIEWER is strictly read-only and denied tool execution."""
    req = PolicyEvaluationRequest(
        requester="viewer_bob",
        role=Role.VIEWER,
        tool_name="equipment_history",
        classification=DataClassification.INTERNAL,
    )
    decision = policy_gateway.evaluate(req)
    assert decision.decision == PolicyDecisionType.DENY
    assert "VIEWER" in decision.reason
    assert "read-only" in decision.reason


def test_case_administrator_critical_actuation_without_approval_denied():
    """Verify that ADMINISTRATOR without supervisor approval is still DENIED critical actuation."""
    req = PolicyEvaluationRequest(
        requester="admin_carol",
        role=Role.ADMINISTRATOR,
        tool_name="calibrate_pressure_relief_valve",
        classification=DataClassification.CRITICAL,
        has_approval=False,
    )
    decision = policy_gateway.evaluate(req)
    assert decision.decision == PolicyDecisionType.DENY
    assert "requires mandatory supervisor approval" in decision.reason


def test_case_administrator_critical_actuation_with_approval_allowed():
    """Verify that ADMINISTRATOR with supervisor approval and critical clearance is permitted."""
    req = PolicyEvaluationRequest(
        requester="admin_carol",
        role=Role.ADMINISTRATOR,
        tool_name="calibrate_pressure_relief_valve",
        classification=DataClassification.CRITICAL,
        has_approval=True,
    )
    decision = policy_gateway.evaluate(req)
    assert decision.decision == PolicyDecisionType.ALLOW
