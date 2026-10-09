"""Ollama local model provider implementation for FORGE."""

import json
from typing import AsyncIterator, List, Optional
import httpx

from app.config import settings
from app.models.base import (
    BaseModelProvider,
    ModelMessage,
    ModelRequest,
    ModelResponse,
    ModelUsage,
    StreamChunk,
)


class OllamaUnavailableError(RuntimeError):
    """Raised when the local Ollama service cannot be contacted."""
    pass


class LocalModelNotFoundError(RuntimeError):
    """Raised when the requested model is not found in the local Ollama library."""
    pass


class OllamaModelProvider(BaseModelProvider):
    """Sovereign model provider connecting to a local Ollama instance."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or settings.DEFAULT_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

    def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout)

    def _resolve_model(self, requested_model: Optional[str]) -> str:
        return requested_model if requested_model else self.default_model

    async def generate(self, request: ModelRequest) -> ModelResponse:
        """Execute chat completion via local Ollama instance."""
        target_model = self._resolve_model(request.model)
        payload = {
            "model": target_model,
            "messages": [msg.model_dump() for msg in request.messages],
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        if request.stop:
            payload["options"]["stop"] = request.stop
        if request.format:
            payload["format"] = request.format

        try:
            async with self._get_client() as client:
                resp = await client.post("/api/chat", json=payload)
                if resp.status_code == 404:
                    raise LocalModelNotFoundError(
                        f"Local model '{target_model}' not found in Ollama library. "
                        f"Manual command to install: 'ollama pull {target_model}'. Zero external cloud calls permitted."
                    )
                resp.raise_for_status()
                data = resp.json()

                message_data = data.get("message", {})
                content = message_data.get("content", "")
                if not content or not content.strip():
                    thinking = message_data.get("thinking", "")
                    if thinking:
                        content = thinking

                usage = ModelUsage(
                    prompt_tokens=data.get("prompt_eval_count", 0),
                    completion_tokens=data.get("eval_count", 0),
                    total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
                )

                return ModelResponse(
                    content=content,
                    model=target_model,
                    usage=usage,
                    finish_reason="stop" if data.get("done") else None,
                )
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            raise OllamaUnavailableError(
                f"Local Ollama service is unreachable at {self.base_url}. Ensure 'ollama serve' is running locally. "
                f"External cloud AI fallback is strictly prohibited by FORGE sovereignty policies."
            ) from exc


    async def generate_stream(self, request: ModelRequest) -> AsyncIterator[StreamChunk]:
        """Execute streaming chat completion via local Ollama instance."""
        target_model = self._resolve_model(request.model)
        payload = {
            "model": target_model,
            "messages": [msg.model_dump() for msg in request.messages],
            "stream": True,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        if request.stop:
            payload["options"]["stop"] = request.stop
        if request.format:
            payload["format"] = request.format

        async with self._get_client() as client:
            async with client.stream("POST", "/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk_data = json.loads(line)
                        delta = chunk_data.get("message", {}).get("content", "")
                        done = chunk_data.get("done", False)
                        yield StreamChunk(
                            delta=delta,
                            finish_reason="stop" if done else None,
                        )
                    except json.JSONDecodeError:
                        continue

    async def health_check(self) -> bool:
        """Check if local Ollama daemon is reachable."""
        try:
            async with self._get_client() as client:
                resp = await client.get("/api/tags", timeout=5.0)
                return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> List[str]:
        """Fetch list of local models installed in Ollama."""
        try:
            async with self._get_client() as client:
                resp = await client.get("/api/tags")
                resp.raise_for_status()
                data = resp.json()
                models = [item.get("name") for item in data.get("models", []) if item.get("name")]
                return models
        except Exception:
            return []
