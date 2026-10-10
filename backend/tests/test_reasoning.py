"""Tests for Milestone 3: Model-to-Tool Reasoning and Evidence Loop.

Strategy:
- All unit tests mock the ModelProvider to avoid requiring live Ollama.
- Integration path tests are marked and can run when Ollama is available.
- Existing 27 Milestone 1+2 tests must continue passing.
"""

import json
import pytest
from fastapi.testclient import TestClient

from app.core.prompts import parse_model_decision
from app.core.reasoning import AgentReasoningService
from app.core.schemas import AgentQueryRequest, AgentQueryStatus, ModelActionType, ModelToolDecision
from app.main import app
from app.models import MockModelProvider
from app.security import (
    DataClassification,
    ExecutionStatus,
    PolicyDecisionType,
    Role,
    audit_event_sink,
)
from app.tools import tool_registry
from app.verification.evidence import EvidenceRecord

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_audit_sink():
    audit_event_sink.clear()
    yield
    audit_event_sink.clear()


# ===========================================================================
# Prompt Parsing Unit Tests
# ===========================================================================

def test_parse_model_decision_tool_call():
    """Parse a well-formed tool_call JSON response."""
    raw = json.dumps({
        "action": "tool_call",
        "tool_name": "equipment_history",
        "arguments": {"equipment_id": "R-204"},
        "reason": "Retrieve maintenance history for reactor R-204."
    })
    decision = parse_model_decision(raw)
    assert decision.action == ModelActionType.TOOL_CALL
    assert decision.tool_name == "equipment_history"
    assert decision.arguments["equipment_id"] == "R-204"


def test_parse_model_decision_final_answer():
    """Parse a well-formed final answer JSON response."""
    raw = json.dumps({"action": "final", "answer": "No tool needed; the answer is documented."})
    decision = parse_model_decision(raw)
    assert decision.action == ModelActionType.FINAL
    assert "No tool needed" in decision.answer


def test_parse_model_decision_with_markdown_code_block():
    """Parse tool call wrapped in markdown code block (common model output)."""
    raw = '```json\n{"action": "tool_call", "tool_name": "equipment_history", "arguments": {"equipment_id": "P-201"}, "reason": "Fetch pump history."}\n```'
    decision = parse_model_decision(raw)
    assert decision.action == ModelActionType.TOOL_CALL
    assert decision.tool_name == "equipment_history"


def test_parse_model_decision_with_thinking_block():
    """Parse JSON following a <think>...</think> reasoning block."""
    raw = '<think>Let me analyze this request.</think>\n{"action": "final", "answer": "The equipment is operational."}'
    decision = parse_model_decision(raw)
    assert decision.action == ModelActionType.FINAL
    assert "operational" in decision.answer


def test_parse_model_decision_malformed_json_rejected():
    """Malformed model output is safely rejected with ValueError."""
    with pytest.raises(ValueError) as exc:
        parse_model_decision("This is just prose without JSON.")
    assert "not valid JSON" in str(exc.value) or "empty completion" in str(exc.value) or "Failed to parse" in str(exc.value)


def test_parse_model_decision_missing_required_fields_rejected():
    """tool_call without tool_name is rejected by Pydantic validation."""
    with pytest.raises(Exception):
        parse_model_decision(json.dumps({"action": "tool_call", "arguments": {}, "reason": "x"}))


def test_parse_model_decision_code_injection_in_arguments_rejected():
    """Embedded code injection in arguments is explicitly rejected."""
    with pytest.raises(ValueError) as exc:
        parse_model_decision(json.dumps({
            "action": "tool_call",
            "tool_name": "equipment_history",
            "arguments": {"equipment_id": "__import__('os').system('rm -rf /')"},
            "reason": "Legitimate reason."
        }))
    assert "code" in str(exc.value).lower() or "security" in str(exc.value).lower() or "suspicious" in str(exc.value).lower()


# ===========================================================================
# ModelToolDecision Schema Validation Tests
# ===========================================================================

def test_model_tool_decision_tool_call_valid():
    """Valid tool_call decision constructs cleanly."""
    d = ModelToolDecision(
        action=ModelActionType.TOOL_CALL,
        tool_name="equipment_history",
        arguments={"equipment_id": "E-301"},
        reason="Need inspection data for E-301."
    )
    assert d.tool_name == "equipment_history"


def test_model_tool_decision_final_valid():
    """Valid final action constructs cleanly."""
    d = ModelToolDecision(action=ModelActionType.FINAL, answer="The pump requires maintenance.")
    assert "maintenance" in d.answer


def test_model_tool_decision_tool_call_without_tool_name_fails():
    """tool_call without tool_name fails validation."""
    with pytest.raises(Exception):
        ModelToolDecision(action=ModelActionType.TOOL_CALL, arguments={}, reason="x")


# ===========================================================================
# AgentReasoningService Mock Tests (no live Ollama required)
# ===========================================================================

@pytest.mark.asyncio
async def test_agent_service_direct_answer():
    """Model returns final action: no tool call, no policy evaluation."""
    mock_response = json.dumps({"action": "final", "answer": "The reactor operates at 220°C."})
    provider = MockModelProvider(responses=[mock_response])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(query="What is reactor operating temperature?"))
    assert result.status == AgentQueryStatus.DIRECT_ANSWER
    assert result.tool_call is None
    assert result.policy_decision is None
    assert "220°C" in result.final_answer or "reactor" in result.final_answer.lower()


@pytest.mark.asyncio
async def test_agent_service_full_tool_pipeline_r204():
    """TEST 1: Valid R-204 query → policy ALLOW → equipment_history → evidence → grounded response."""
    tool_decision = json.dumps({
        "action": "tool_call",
        "tool_name": "equipment_history",
        "arguments": {"equipment_id": "R-204"},
        "reason": "Need historical maintenance data for reactor R-204."
    })
    grounded_answer = "Based on verified evidence, R-204 underwent two maintenance events including agitator seal replacement."

    provider = MockModelProvider(responses=[tool_decision, grounded_answer])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(
        query="Show me the maintenance history for R-204",
        role=Role.ENGINEER,
        requester="engineer_alice",
        classification=DataClassification.INTERNAL,
    ))

    assert result.status == AgentQueryStatus.SUCCESS
    assert result.tool_call is not None
    assert result.tool_call["tool_name"] == "equipment_history"
    assert result.policy_decision is not None
    assert result.policy_decision.decision == PolicyDecisionType.ALLOW
    assert result.tool_result is not None
    assert result.tool_result.get("equipment_id") == "R-204"
    assert result.evidence is not None
    assert isinstance(result.evidence, EvidenceRecord)
    assert result.evidence.tool_name == "equipment_history"
    assert result.evidence.verified is True
    assert result.execution_event_id is not None
    assert "R-204" in result.final_answer or "maintenance" in result.final_answer.lower()


@pytest.mark.asyncio
async def test_agent_service_policy_denied_does_not_execute_tool():
    """TEST 2: Unauthorized role → policy DENY → tool handler is never invoked."""
    tool_decision = json.dumps({
        "action": "tool_call",
        "tool_name": "equipment_history",
        "arguments": {"equipment_id": "P-201"},
        "reason": "Retrieve pump history."
    })
    provider = MockModelProvider(responses=[tool_decision])

    service = AgentReasoningService(model_provider=provider)

    # MANAGER is not authorized for equipment_history
    result = await service.process_query(AgentQueryRequest(
        query="Show pump P-201 history",
        role=Role.MANAGER,
        requester="manager_unauthorized",
        classification=DataClassification.INTERNAL,
    ))

    assert result.status == AgentQueryStatus.POLICY_DENIED
    assert result.policy_decision.decision == PolicyDecisionType.DENY
    assert result.tool_result is None
    assert result.evidence is None
    assert "blocked" in result.final_answer.lower() or "denied" in result.final_answer.lower()


@pytest.mark.asyncio
async def test_agent_service_malformed_model_output_rejected():
    """TEST 3: Malformed model JSON is safely rejected without tool execution."""
    provider = MockModelProvider(responses=["This is not JSON at all, just prose."])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(query="Malformed request"))
    assert result.status == AgentQueryStatus.INVALID_MODEL_OUTPUT
    assert result.tool_call is None
    assert result.evidence is None


@pytest.mark.asyncio
async def test_agent_service_unknown_tool_rejected():
    """TEST 4: Unknown tool name from model is rejected by policy gateway."""
    tool_decision = json.dumps({
        "action": "tool_call",
        "tool_name": "arbitrary_shell_exec",
        "arguments": {"command": "whoami"},
        "reason": "Get system info."
    })
    provider = MockModelProvider(responses=[tool_decision])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(
        query="Get system info",
        role=Role.ENGINEER,
        requester="engineer_test",
    ))

    assert result.status == AgentQueryStatus.POLICY_DENIED
    assert result.policy_decision.decision == PolicyDecisionType.DENY
    assert "unknown" in result.policy_decision.reason.lower() or "unregistered" in result.policy_decision.reason.lower()
    assert result.evidence is None


@pytest.mark.asyncio
async def test_agent_service_code_injection_in_tool_arguments_rejected():
    """TEST 5: Model cannot inject executable code through tool arguments."""
    tool_decision = json.dumps({
        "action": "tool_call",
        "tool_name": "equipment_history",
        "arguments": {"equipment_id": "__import__('os').system('rm -rf /')"},
        "reason": "Retrieve history."
    })
    provider = MockModelProvider(responses=[tool_decision])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(query="Inject code via arguments"))
    assert result.status == AgentQueryStatus.INVALID_MODEL_OUTPUT
    assert result.evidence is None
    assert result.tool_result is None


@pytest.mark.asyncio
async def test_agent_service_final_answer_from_evidence_path():
    """TEST 6: Final response was generated in the grounded second model pass."""
    tool_decision = json.dumps({
        "action": "tool_call",
        "tool_name": "equipment_history",
        "arguments": {"equipment_id": "E-301"},
        "reason": "Need heat exchanger history."
    })
    grounded_answer = "Evidence shows E-301 was hydroblasted in June 2025 with no active leaks detected."

    provider = MockModelProvider(responses=[tool_decision, grounded_answer])
    service = AgentReasoningService(model_provider=provider)

    result = await service.process_query(AgentQueryRequest(
        query="What is the maintenance status of E-301?",
        role=Role.INSPECTOR,
        requester="inspector_carlos",
        classification=DataClassification.INTERNAL,
    ))

    assert result.status == AgentQueryStatus.SUCCESS
    # Evidence path confirms grounded response
    assert result.evidence is not None
    assert result.evidence.source_reference == "tool:equipment_history"
    # Final answer comes from the grounded second model pass
    assert "E-301" in result.final_answer or "hydroblasted" in result.final_answer or "heat exchanger" in result.final_answer.lower()


# ===========================================================================
# API Integration Tests (mock provider via main app env override)
# ===========================================================================

def test_api_agent_query_endpoint_exists():
    """Verify /api/v1/agent/query endpoint is registered and accepts POST."""
    payload = {"query": "What is the maintenance history for R-204?"}
    # This will use the real Ollama provider but we check it responds (may be slow)
    # Just verify the endpoint schema is valid by looking at the response status
    resp = client.post("/api/v1/agent/query", json=payload)
    # Any 2xx or 422 (validation) is acceptable; 404 means endpoint is missing
    assert resp.status_code != 404, "Agent query endpoint must be registered"


@pytest.mark.asyncio
async def test_agent_conversational_greeting_routing():
    """Verify general conversational questions like 'Hi, how are you?' are answered directly."""
    service = AgentReasoningService(model_provider=MockModelProvider(responses=[]))
    result = await service.process_query(AgentQueryRequest(
        query="Hi, how are you?",
        language="en",
    ))
    assert result.status == AgentQueryStatus.DIRECT_ANSWER
    assert "optimally" in result.final_answer or "FORGE" in result.final_answer
    assert len(result.tool_calls) == 0


@pytest.mark.asyncio
async def test_agent_general_concept_routing():
    """Verify generic engineering concept questions like 'What is a reactor?' are answered directly."""
    service = AgentReasoningService(model_provider=MockModelProvider(responses=["A chemical reactor is an enclosed pressure vessel for reactions."]))
    result = await service.process_query(AgentQueryRequest(
        query="What is a reactor?",
        language="en",
    ))
    assert result.status == AgentQueryStatus.DIRECT_ANSWER
    assert "reactor" in result.final_answer.lower()
    assert len(result.tool_calls) == 0
