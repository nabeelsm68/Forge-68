"""Task-based Sovereign Local Model Router for FORGE Control Plane.

Enforces zero-cloud execution, explicit task-to-model routing, and hardware awareness
for RTX 4060 Laptop GPU (~8GB VRAM) environments.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

from app.config import settings
from app.models import get_model_provider


class TaskType(str, Enum):
    REASONING = "reasoning"
    VISION = "vision"
    EMBEDDING = "embedding"
    OCR = "ocr"


class RouteDecision(BaseModel):
    task: TaskType
    assigned_model: str
    assigned_provider: str
    target_model: str = ""
    provider: str = ""
    status: str  # "AVAILABLE", "LOCAL_CV_ACTIVE", "OCR_READY", "DEGRADED", "UNAVAILABLE"
    vram_profile: str
    reason: str
    is_cloud: bool = False
    is_local: bool = True
    hardware_notes: str
    notes: str = ""

    @model_validator(mode="after")
    def populate_aliases(self) -> "RouteDecision":
        if not self.target_model:
            self.target_model = self.assigned_model
        if not self.provider:
            self.provider = self.assigned_provider
        if not self.notes:
            self.notes = self.hardware_notes
        return self


class TaskModelRouter:
    """Sovereign task router selecting and managing local models based on resource boundaries."""

    def __init__(self):
        self._provider = get_model_provider()

    async def get_installed_ollama_models(self) -> List[str]:
        """Query local Ollama instance for currently loaded or pulled model tags."""
        try:
            return await self._provider.list_models()
        except Exception:
            return []

    def route(self, task: TaskType) -> RouteDecision:
        """Synchronously route an operational task based on sovereign configuration."""
        if task == TaskType.REASONING:
            return RouteDecision(
                task=TaskType.REASONING,
                assigned_model=settings.DEFAULT_MODEL or "qwen3:8b",
                assigned_provider=settings.MODEL_PROVIDER or "ollama",
                status="AVAILABLE",
                vram_profile="~5.2GB Q4_K_M (active in RTX 4060 8GB VRAM)",
                reason="Primary sovereign reasoning, operational query planning, and grounded answer synthesis",
                hardware_notes="Sequential VRAM management enforced to prevent 8GB VRAM exhaustion",
                is_cloud=False,
            )

        elif task == TaskType.VISION:
            return RouteDecision(
                task=TaskType.VISION,
                assigned_model="sovereign-cv-analyzer",
                assigned_provider="local-cv-engine",
                status="LOCAL_CV_ACTIVE",
                vram_profile="0MB GPU VRAM (CPU rule-based computer vision)",
                reason="Deterministic gauge telemetry extraction and defect feature inspection without cloud fallback",
                hardware_notes="To activate neural multimodal LLM: run 'ollama pull moondream' or 'ollama pull llava:7b'",
                is_cloud=False,
            )

        elif task == TaskType.EMBEDDING:
            return RouteDecision(
                task=TaskType.EMBEDDING,
                assigned_model=settings.EMBEDDING_MODEL or "sovereign-tfidf-v1",
                assigned_provider=settings.EMBEDDING_PROVIDER or "local-sovereign",
                status="AVAILABLE",
                vram_profile="0MB GPU VRAM (System RAM)",
                reason="Deterministic mathematical vector space for Plant Knowledge Fabric similarity search",
                hardware_notes="Zero GPU VRAM impact, guaranteeing reasoning model stays resident in GPU memory",
                is_cloud=False,
            )

        elif task == TaskType.OCR:
            return RouteDecision(
                task=TaskType.OCR,
                assigned_model="pypdf-digital-stream",
                assigned_provider="local-extractor",
                status="AVAILABLE",
                vram_profile="0MB GPU VRAM (Native Stream Processor)",
                reason="Direct digital extraction from PDF, Markdown, and TXT documentation",
                hardware_notes="Scanned image PDFs are automatically flagged as OCR_REQUIRED to prevent hallucinated text",
                is_cloud=False,
            )

        return RouteDecision(
            task=task,
            assigned_model="unknown",
            assigned_provider="none",
            status="UNAVAILABLE",
            vram_profile="0MB",
            reason="Unknown task type",
            hardware_notes="",
            is_cloud=False,
        )

    async def route_task(self, task: TaskType) -> RouteDecision:
        """Route an operational task to its appropriate sovereign local model."""
        installed = await self.get_installed_ollama_models()

        if task == TaskType.REASONING:
            target_model = settings.DEFAULT_MODEL
            is_present = any(target_model in m for m in installed) or len(installed) > 0
            model_name = target_model if is_present else (installed[0] if installed else "qwen3:8b")
            return RouteDecision(
                task=TaskType.REASONING,
                assigned_model=model_name,
                assigned_provider=settings.MODEL_PROVIDER,
                status="AVAILABLE" if is_present else "DEGRADED",
                vram_profile="~5.2GB Q4_K_M (active in RTX 4060 8GB VRAM)",
                reason="Primary sovereign reasoning, operational query planning, and grounded answer synthesis",
                hardware_notes="Sequential VRAM management enforced to prevent 8GB VRAM exhaustion",
                is_cloud=False,
            )

        elif task == TaskType.VISION:
            vision_candidates = ["llava", "moondream", "minicpm", "bakllava"]
            installed_vision = [m for m in installed if any(vc in m.lower() for vc in vision_candidates)]

            if installed_vision:
                selected_model = installed_vision[0]
                return RouteDecision(
                    task=TaskType.VISION,
                    assigned_model=selected_model,
                    assigned_provider=settings.MODEL_PROVIDER,
                    status="AVAILABLE",
                    vram_profile="~2.5GB - ~4.5GB VRAM (swapped sequentially)",
                    reason="Local multimodal vision inspection and optical gauge analysis",
                    hardware_notes="Loaded on demand; unloads or shares VRAM sequentially with reasoning model",
                    is_cloud=False,
                )
            else:
                return self.route(TaskType.VISION)

        elif task == TaskType.EMBEDDING:
            return self.route(TaskType.EMBEDDING)

        elif task == TaskType.OCR:
            return self.route(TaskType.OCR)

        return self.route(task)

    async def get_all_routes(self) -> List[RouteDecision]:
        """Inspect and return routing decisions for all supported sovereign tasks."""
        return [
            await self.route_task(TaskType.REASONING),
            await self.route_task(TaskType.VISION),
            await self.route_task(TaskType.EMBEDDING),
            await self.route_task(TaskType.OCR),
        ]


task_model_router = TaskModelRouter()
