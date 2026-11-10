from __future__ import annotations

from decimal import Decimal
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Read from environment variables (or services/agent/.env)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_prefix="AGENT_")

    # Shared secret that the Next.js server sends in the X-Service-Token header.
    service_token: str = ""

    # Guardrail thresholds
    auto_approve_max_amount: Decimal = Decimal("50000")
    min_confidence: float = 0.85
    max_inventory_delta_auto: Decimal = Decimal("100")

    # LLM extraction. If anthropic_api_key is unset the service uses the
    # deterministic fallback extractor, which is what tests use.
    anthropic_api_key: str | None = None
    model_name: str = "claude-sonnet-5-5"


@lru_cache
def get_settings() -> Settings:
    return Settings()
