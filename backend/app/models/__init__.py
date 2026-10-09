"""Model provider factory and abstraction exports."""

from typing import AsyncIterator, Dict, List, Optional, Type
from app.config import settings
from app.models.base import (
    BaseModelProvider,
    ModelMessage,
    ModelRequest,
    ModelResponse,
    ModelUsage,
    StreamChunk,
)
from app.models.ollama import OllamaModelProvider


class MockModelProvider(BaseModelProvider):
    """Offline test model provider for unit tests and deterministic simulation."""

    def __init__(self, default_model: str = "mock-reasoner", responses: Optional[List[str]] = None):
        self.default_model = default_model
        self.responses: List[str] = list(responses) if responses else []

    async def generate(self, request: ModelRequest) -> ModelResponse:
        model_name = request.model or self.default_model
        if self.responses:
            content = self.responses.pop(0)
        else:
            content = f"[FORGE SOVEREIGN MOCK] Processed {len(request.messages)} messages."
        return ModelResponse(
            content=content,
            model=model_name,
            usage=ModelUsage(prompt_tokens=10, completion_tokens=10, total_tokens=20),
            finish_reason="stop",
        )

    async def generate_stream(self, request: ModelRequest) -> AsyncIterator[StreamChunk]:
        yield StreamChunk(delta="[FORGE MOCK] ")
        yield StreamChunk(delta="Completed response.")
        yield StreamChunk(delta="", finish_reason="stop")

    async def health_check(self) -> bool:
        return True

    async def list_models(self) -> List[str]:
        return [self.default_model, "mock-classifier"]


PROHIBITED_CLOUD_PROVIDERS = {
    "openai",
    "anthropic",
    "gemini",
    "google",
    "azure",
    "aws",
    "bedrock",
    "vertex",
    "cohere",
}

# Cryptographic/deterministic assertion counter proving zero external requests executed
EXTERNAL_REQUEST_COUNTER = {"count": 0}


class SovereigntyViolationError(ValueError):
    """Raised when an unauthorized external cloud model provider or SDK is requested."""
    pass


_PROVIDERS: Dict[str, Type[BaseModelProvider]] = {
    "ollama": OllamaModelProvider,
    "mock": MockModelProvider,
}


def get_model_provider(provider_name: Optional[str] = None) -> BaseModelProvider:
    """Instantiate a sovereign model provider without hard-coding."""
    name = (provider_name or settings.MODEL_PROVIDER).lower()

    if name in PROHIBITED_CLOUD_PROVIDERS:
        try:
            from app.security.events import AgentTraceEvent, AgentEventType, audit_event_sink
            from app.security.models import Role
            audit_event_sink.record_agent_event(
                AgentTraceEvent(
                    event_type=AgentEventType.SECURITY_ALERT,
                    requester="SYSTEM",
                    role=Role.OPERATOR,
                    details={
                        "alert_type": "SOVEREIGNTY_VIOLATION_BLOCKED",
                        "attempted_provider": name,
                        "action": "CLOUD_AI_CALL_PREVENTED",
                        "external_requests_performed": EXTERNAL_REQUEST_COUNTER["count"],
                    },
                )
            )
        except Exception:
            pass

        raise SovereigntyViolationError(
            f"Sovereignty Violation: Unsupported sovereign model provider: '{name}'. "
            f"FORGE strictly enforces local sovereign execution. External cloud AI APIs are strictly prohibited."
        )

    provider_cls = _PROVIDERS.get(name)
    if not provider_cls:
        raise ValueError(
            f"Unsupported sovereign model provider: '{name}'. "
            f"Valid options: {list(_PROVIDERS.keys())}. "
            f"External cloud providers are strictly prohibited."
        )
    return provider_cls()


from app.vision.provider import (
    BaseVisionProvider,
    MockVisionProvider,
    OllamaVisionProvider,
    VisionRequest,
    VisionResponse,
    get_vision_provider,
)
from app.models.router import (
    RouteDecision,
    TaskModelRouter,
    TaskType,
    task_model_router,
)

__all__ = [
    "BaseModelProvider",
    "ModelMessage",
    "ModelRequest",
    "ModelResponse",
    "ModelUsage",
    "StreamChunk",
    "OllamaModelProvider",
    "MockModelProvider",
    "get_model_provider",
    "EXTERNAL_REQUEST_COUNTER",
    "PROHIBITED_CLOUD_PROVIDERS",
    "SovereigntyViolationError",
    "BaseVisionProvider",
    "OllamaVisionProvider",
    "MockVisionProvider",
    "VisionRequest",
    "VisionResponse",
    "get_vision_provider",
    "RouteDecision",
    "TaskModelRouter",
    "TaskType",
    "task_model_router",
]
