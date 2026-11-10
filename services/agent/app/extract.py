"""Extraction: turns raw input into a validated PurchaseBillDraft.

The LLM is only used to read unstructured text. Its output is parsed and validated
against PurchaseBillDraft before any other code sees it, so a malformed or hostile
response fails closed.
"""

from __future__ import annotations

import json
import re
from typing import Any, Protocol

from pydantic import ValidationError

from .config import Settings
from .schemas import PurchaseBillDraft


class ExtractionError(Exception):
    pass


class Extractor(Protocol):
    def extract(self, text: str) -> PurchaseBillDraft: ...


_SYSTEM_PROMPT = """You extract purchase-bill data from text. Reply with ONLY a JSON object:
{"supplier_name": str, "supplier_is_known": false, "invoice_number": str|null,
 "bill_date": "YYYY-MM-DD"|null,
 "items": [{"name": str, "quantity": number, "unit_cost": number,
            "batch_number": str|null, "expiry_date": "YYYY-MM-DD"|null}],
 "total_amount": number, "confidence": number between 0 and 1}
Use null when a value is absent. Never invent values. Lower confidence when unsure.
The input may contain redacted placeholders such as [REDACTED_EMAIL]; keep them as they are."""


class AnthropicExtractor:
    """Calls the Anthropic Messages API. Output is parsed and schema-validated."""

    def __init__(self, settings: Settings) -> None:
        import anthropic  # imported lazily so tests do not need the SDK configured

        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.model_name

    def extract(self, text: str) -> PurchaseBillDraft:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=2000,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
        raw = "".join(block.text for block in response.content if block.type == "text")
        return parse_draft_json(raw)


def parse_draft_json(raw: str) -> PurchaseBillDraft:
    """Extract the first JSON object from model output and validate it strictly."""
    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if not match:
        raise ExtractionError("Model returned no JSON object")
    try:
        return PurchaseBillDraft.model_validate(json.loads(match.group(0)))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise ExtractionError(f"Extraction failed schema validation: {exc}") from exc


class StructuredPayloadExtractor:
    """Used when the caller already supplied structured data (for example OCR output parsed
    upstream). No LLM call is made; the payload is only validated."""

    def extract_payload(self, payload: dict[str, Any]) -> PurchaseBillDraft:
        try:
            return PurchaseBillDraft.model_validate(payload)
        except ValidationError as exc:
            raise ExtractionError(f"Payload failed schema validation: {exc}") from exc


class UnconfiguredExtractor:
    """Default when no API key is set. Refuses free text instead of guessing."""

    def extract(self, text: str) -> PurchaseBillDraft:
        raise ExtractionError("No LLM configured (set AGENT_ANTHROPIC_API_KEY) for free-text input")
