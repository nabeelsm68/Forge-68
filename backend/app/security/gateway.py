"""Sovereign Industrial Policy Gateway.

Enforces:
- Strict DEFAULT-DENY semantics
- Role-based authorization
- Data classification constraints
- Risk-based mandatory approval requirements
- Rejection of unknown tools
- Structured decision generation and auditable event emission
"""

from typing import Any, List, Optional
from app.security.events import ExecutionEvent, ExecutionStatus, audit_event_sink
from app.security.models import (
    DataClassification,
    PolicyDecision,
    PolicyDecisionType,
    PolicyEvaluationRequest,
    RiskLevel,
    Role,
)
from app.security.policies import DEFAULT_POLICIES, PolicyRule

# Numeric hierarchy for Risk Level comparison
RISK_ORDER = {
    RiskLevel.LOW: 1,
    RiskLevel.MEDIUM: 2,
    RiskLevel.HIGH: 3,
    RiskLevel.CRITICAL: 4,
}


class PolicyGateway:
    """Central sovereign policy enforcement gateway."""

    def __init__(
        self,
        registry: Optional[Any] = None,
        policies: Optional[List[PolicyRule]] = None,
    ):
        self._registry = registry
        self.policies = list(policies) if policies is not None else list(DEFAULT_POLICIES)

    @property
    def registry(self) -> Any:
        if self._registry is None:
            from app.tools.registry import tool_registry
            self._registry = tool_registry
        return self._registry

    def add_policy(self, rule: PolicyRule) -> None:
        """Register a new policy rule."""
        self.policies.append(rule)

    def evaluate(self, request: PolicyEvaluationRequest) -> PolicyDecision:
        """Evaluate an execution request against DEFAULT-DENY semantics and active policy rules."""
        tool = self.registry.get(request.tool_name)

        # 1. Reject unknown or unregistered tools
        if not tool:
            decision = PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Unknown or unregistered tool: '{request.tool_name}'. Arbitrary tool execution is strictly prohibited.",
                policy_id=None,
                requester=request.requester,
                role=request.role,
                tool=request.tool_name,
                classification=request.classification,
                risk=RiskLevel.HIGH,  # Unregistered actions are treated as high risk
                approval_required=False,
                approved=request.has_approval,
            )
            self._record_evaluation_event(request, decision, "unknown")
            return decision

        tool_meta = tool.to_metadata()
        risk = tool_meta.risk_level
        approval_required = tool_meta.approval_required or (risk == RiskLevel.CRITICAL)

        def _role_matches(req_r: Role, allowed_set: Any) -> bool:
            if req_r in allowed_set:
                return True
            if req_r == Role.ADMINISTRATOR and Role.ADMIN in allowed_set:
                return True
            if req_r == Role.ADMIN and Role.ADMINISTRATOR in allowed_set:
                return True
            return False

        # 1b. Role VIEWER is strictly read-only: zero tool execution permitted
        if request.role == Role.VIEWER:
            decision = PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Role 'VIEWER' is strictly read-only and is not permitted to execute tool '{tool_meta.name}'.",
                policy_id=None,
                requester=request.requester,
                role=request.role,
                tool=tool_meta.name,
                classification=request.classification,
                risk=risk,
                approval_required=approval_required,
                approved=request.has_approval,
            )
            self._record_evaluation_event(request, decision, tool_meta.version)
            return decision

        # 2. Check Tool-level allowed roles
        if not _role_matches(request.role, tool_meta.allowed_roles):
            decision = PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Role '{request.role.value}' is not authorized to execute tool '{tool_meta.name}'.",
                policy_id=None,
                requester=request.requester,
                role=request.role,
                tool=tool_meta.name,
                classification=request.classification,
                risk=risk,
                approval_required=approval_required,
                approved=request.has_approval,
            )
            self._record_evaluation_event(request, decision, tool_meta.version)
            return decision

        # 3. Check Tool-level data classification constraints
        if request.classification not in tool_meta.allowed_classifications:
            decision = PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Data classification '{request.classification.value}' is not permitted for tool '{tool_meta.name}'. Permitted: {[c.value for c in tool_meta.allowed_classifications]}",
                policy_id=None,
                requester=request.requester,
                role=request.role,
                tool=tool_meta.name,
                classification=request.classification,
                risk=risk,
                approval_required=approval_required,
                approved=request.has_approval,
            )
            self._record_evaluation_event(request, decision, tool_meta.version)
            return decision

        # 4. DEFAULT-DENY: Evaluate explicit matching policy rules
        matching_rules = [
            rule for rule in self.policies
            if rule.is_active and (rule.target_tool == tool_meta.name or rule.target_tool == "*")
        ]

        if not matching_rules:
            decision = PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Default-Deny: No matching policy rule explicitly permits tool '{tool_meta.name}'.",
                policy_id=None,
                requester=request.requester,
                role=request.role,
                tool=tool_meta.name,
                classification=request.classification,
                risk=risk,
                approval_required=approval_required,
                approved=request.has_approval,
            )
            self._record_evaluation_event(request, decision, tool_meta.version)
            return decision

        # Evaluate rules in order
        for rule in matching_rules:
            # Check role permission in rule
            if not _role_matches(request.role, rule.allowed_roles):
                continue

            # Check classification permission in rule
            if request.classification not in rule.allowed_classifications:
                continue

            # Check risk level constraint
            if RISK_ORDER[risk] > RISK_ORDER[rule.max_risk_level]:
                continue

            # Check approval requirements
            needs_approval = rule.require_approval or approval_required
            if needs_approval and not request.has_approval:
                decision = PolicyDecision(
                    decision=PolicyDecisionType.DENY,
                    reason=f"Policy '{rule.rule_id}' requires mandatory supervisor approval for {risk.value}-risk operations, but none was provided.",
                    policy_id=rule.rule_id,
                    requester=request.requester,
                    role=request.role,
                    tool=tool_meta.name,
                    classification=request.classification,
                    risk=risk,
                    approval_required=True,
                    approved=False,
                )
                self._record_evaluation_event(request, decision, tool_meta.version)
                return decision

            # Rule permits execution!
            decision = PolicyDecision(
                decision=PolicyDecisionType.ALLOW,
                reason=f"Explicitly permitted by policy '{rule.rule_id}' ({rule.name}).",
                policy_id=rule.rule_id,
                requester=request.requester,
                role=request.role,
                tool=tool_meta.name,
                classification=request.classification,
                risk=risk,
                approval_required=needs_approval,
                approved=request.has_approval if needs_approval else False,
            )
            self._record_evaluation_event(request, decision, tool_meta.version)
            return decision

        # If matching rules existed but none granted permission (e.g. role/classification didn't align with any rule)
        decision = PolicyDecision(
            decision=PolicyDecisionType.DENY,
            reason=f"Default-Deny: Request attributes (Role: {request.role.value}, Classification: {request.classification.value}) did not satisfy any active policy rule for tool '{tool_meta.name}'.",
            policy_id=None,
            requester=request.requester,
            role=request.role,
            tool=tool_meta.name,
            classification=request.classification,
            risk=risk,
            approval_required=approval_required,
            approved=request.has_approval,
        )
        self._record_evaluation_event(request, decision, tool_meta.version)
        return decision

    def _record_evaluation_event(
        self,
        request: PolicyEvaluationRequest,
        decision: PolicyDecision,
        tool_version: str,
    ) -> None:
        """Produce an auditable execution event for this evaluation attempt."""
        event = ExecutionEvent(
            requester=decision.requester,
            role=decision.role,
            tool=decision.tool,
            tool_version=tool_version,
            classification=decision.classification,
            risk=decision.risk,
            decision=decision.decision,
            reason=decision.reason,
            approval_required=decision.approval_required,
            approved=decision.approved,
            execution_status=ExecutionStatus.BLOCKED_BY_POLICY if decision.decision == PolicyDecisionType.DENY else ExecutionStatus.EXECUTED,
            parameters=request.parameters,
        )
        audit_event_sink.record_event(event)


# Global default policy gateway
policy_gateway = PolicyGateway()
