"""Deterministic guardrails. These run after extraction and before any proposal reaches
the approval queue. They never call an LLM, so their verdicts are reproducible and auditable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal

from pydantic import ValidationError

from .config import Settings
from .schemas import TOOL_ARG_MODELS, PurchaseBillDraft, RiskLevel

_RISK_ORDER: dict[str, int] = {"low": 0, "medium": 1, "high": 2, "critical": 3}

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)")
_AADHAAR_RE = re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)")
_PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")


class GuardrailViolation(Exception):
    """Raised when a proposal must be rejected outright (not merely escalated)."""


@dataclass
class RiskVerdict:
    level: RiskLevel
    reasons: list[str] = field(default_factory=list)

    @property
    def auto_executable(self) -> bool:
        return self.level == "low"


def redact_pii(text: str) -> str:
    """Mask emails, Indian phone numbers, Aadhaar-like and PAN-like identifiers before the
    text is sent to an LLM or written to logs."""
    text = _EMAIL_RE.sub("[REDACTED_EMAIL]", text)
    text = _PAN_RE.sub("[REDACTED_PAN]", text)
    text = _AADHAAR_RE.sub("[REDACTED_ID]", text)
    text = _PHONE_RE.sub("[REDACTED_PHONE]", text)
    return text


def redact_obj(value: object) -> object:
    """Recursively redact every string inside a JSON-like structure."""
    if isinstance(value, str):
        return redact_pii(value)
    if isinstance(value, dict):
        return {k: redact_obj(v) for k, v in value.items()}
    if isinstance(value, list):
        return [redact_obj(v) for v in value]
    return value


def validate_tool_args(tool_name: str, args: dict) -> dict:
    """Reject tools that are not on the allow-list and args that fail their schema."""
    model = TOOL_ARG_MODELS.get(tool_name)
    if model is None:
        raise GuardrailViolation(f"Tool '{tool_name}' is not on the allow-list")
    try:
        return model.model_validate(args).model_dump(mode="json")
    except ValidationError as exc:
        raise GuardrailViolation(f"Invalid args for '{tool_name}': {exc.errors()[0]['msg']}") from exc


def check_draft(draft: PurchaseBillDraft, settings: Settings) -> RiskVerdict:
    """Risk verdict for a purchase-bill draft as a whole."""
    reasons: list[str] = []
    level: RiskLevel = "low"

    def escalate(to: RiskLevel, reason: str) -> None:
        nonlocal level
        reasons.append(reason)
        if _RISK_ORDER[to] > _RISK_ORDER[level]:
            level = to

    if draft.total_amount > settings.auto_approve_max_amount:
        escalate("high", f"Amount > ₹{settings.auto_approve_max_amount:,.0f}")
    if draft.confidence < settings.min_confidence:
        escalate("medium", f"Confidence {draft.confidence:.2f} < {settings.min_confidence:.2f}")
    if not draft.supplier_is_known:
        escalate("medium", "New unverified supplier")
    if not draft.invoice_number:
        escalate("medium", "Missing invoice number")

    # The line items must add up to the stated total (within one paisa per line).
    computed = sum((i.quantity * i.unit_cost for i in draft.items), Decimal("0"))
    tolerance = Decimal("0.01") * len(draft.items)
    if abs(computed - draft.total_amount) > tolerance:
        escalate("high", f"Line items sum to ₹{computed:,.2f} but total is ₹{draft.total_amount:,.2f}")

    return RiskVerdict(level=level, reasons=reasons)


def check_inventory_adjustment(args: dict, settings: Settings) -> RiskVerdict:
    reasons: list[str] = []
    level: RiskLevel = "low"
    delta = Decimal(str(args["quantity_delta"]))
    if abs(delta) > settings.max_inventory_delta_auto:
        level = "high"
        reasons.append(f"Stock change {delta} exceeds auto limit {settings.max_inventory_delta_auto}")
    elif delta < 0:
        level = "medium"
        reasons.append(f"Stock decrease of {abs(delta)}")
    return RiskVerdict(level=level, reasons=reasons)


def check_new_supplier(args: dict) -> RiskVerdict:
    # Creating a supplier always needs a human: it changes master data used by future bills.
    return RiskVerdict(level="medium", reasons=["New supplier master record"])


def overall_risk(verdicts: list[RiskVerdict]) -> RiskVerdict:
    level: RiskLevel = "low"
    reasons: list[str] = []
    for v in verdicts:
        reasons.extend(v.reasons)
        if _RISK_ORDER[v.level] > _RISK_ORDER[level]:
            level = v.level
    return RiskVerdict(level=level, reasons=reasons)
