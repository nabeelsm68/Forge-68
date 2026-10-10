from enum import Enum, EnumMeta
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RoleMeta(EnumMeta):
    """Metaclass to safely map any legacy role queries strictly to canonical roles."""
    def __getattr__(cls, name: str) -> Any:
        if name in ("ADMIN", "SECURITY_OFFICER"):
            return cls.ADMINISTRATOR
        if name == "INSPECTOR":
            return cls.ENGINEER
        if name in ("MANAGER", "AUDITOR", "AI_OPERATOR"):
            return cls.VIEWER
        return super().__getattr__(name)


class Role(str, Enum, metaclass=RoleMeta):
    """Sovereign Industrial System Roles."""
    VIEWER = "VIEWER"
    ENGINEER = "ENGINEER"
    ADMINISTRATOR = "ADMINISTRATOR"

    @classmethod
    def _missing_(cls, value: object):
        if isinstance(value, str):
            val_upper = value.upper()
            if val_upper in ("ADMIN", "SECURITY_OFFICER"):
                return cls.ADMINISTRATOR
            if val_upper == "INSPECTOR":
                return cls.ENGINEER
            if val_upper in ("MANAGER", "AUDITOR", "AI_OPERATOR"):
                return cls.VIEWER
        return None


class DataClassification(str, Enum):
    """Industrial Data Classification Tiers."""
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"
    CRITICAL = "CRITICAL"


class RiskLevel(str, Enum):
    """Tool and Action Risk Tiers."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PolicyDecisionType(str, Enum):
    """Binary policy evaluation outcome."""
    ALLOW = "ALLOW"
    DENY = "DENY"


class PolicyEvaluationRequest(BaseModel):
    """Input payload to evaluate an action against the Policy Gateway."""
    requester: str = Field(..., description="Identity of the requesting agent, operator, or system")
    role: Role = Field(..., description="Role assigned to the requester")
    tool_name: str = Field(..., description="Name of the requested tool")
    classification: DataClassification = Field(
        default=DataClassification.INTERNAL,
        description="Data classification level of the requested operation"
    )
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Tool invocation parameters")
    has_approval: bool = Field(default=False, description="Whether human/supervisor cryptographic approval is present")


class PolicyDecision(BaseModel):
    """Structured policy evaluation outcome."""
    decision: PolicyDecisionType
    reason: str
    policy_id: Optional[str] = None
    requester: str
    role: Role
    tool: str
    classification: DataClassification
    risk: RiskLevel
    approval_required: bool
    approved: bool = False
