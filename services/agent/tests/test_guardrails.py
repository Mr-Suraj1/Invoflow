from decimal import Decimal

import pytest

from app.config import Settings
from app.guardrails import (
    GuardrailViolation,
    check_draft,
    check_inventory_adjustment,
    redact_pii,
    validate_tool_args,
)
from app.schemas import PurchaseBillDraft


def _settings(**overrides) -> Settings:
    return Settings(service_token="t", **overrides)


def _draft(**overrides) -> PurchaseBillDraft:
    data = {
        "supplier_name": "Acme Pharma",
        "supplier_is_known": True,
        "invoice_number": "INV-001",
        "bill_date": "2026-11-01",
        "items": [
            {"name": "Paracetamol 500mg", "quantity": "10", "unit_cost": "12.50"},
            {"name": "Syringe 5ml", "quantity": "100", "unit_cost": "1.00"},
        ],
        "total_amount": "225.00",
        "confidence": 0.95,
    }
    data.update(overrides)
    return PurchaseBillDraft.model_validate(data)


# ---- PII redaction --------------------------------------------------------------

def test_redacts_email_phone_and_pan():
    text = "Contact ravi@example.com or 98765 43210, PAN ABCDE1234F"
    out = redact_pii(text)
    assert "ravi@example.com" not in out
    assert "98765 43210" not in out
    assert "ABCDE1234F" not in out
    assert "[REDACTED_EMAIL]" in out and "[REDACTED_PHONE]" in out and "[REDACTED_PAN]" in out


def test_leaves_plain_amounts_alone():
    assert redact_pii("Total 225.00 for 10 units") == "Total 225.00 for 10 units"


# ---- Purchase-bill risk rules ---------------------------------------------------

def test_clean_draft_is_low_risk():
    verdict = check_draft(_draft(), _settings())
    assert verdict.level == "low"
    assert verdict.auto_executable


def test_amount_over_threshold_is_high():
    verdict = check_draft(_draft(items=[{"name": "Gold", "quantity": "1", "unit_cost": "60000"}],
                                 total_amount="60000"), _settings())
    assert verdict.level == "high"
    assert any("Amount >" in r for r in verdict.reasons)


def test_low_confidence_is_medium():
    verdict = check_draft(_draft(confidence=0.70), _settings())
    assert verdict.level == "medium"
    assert any("Confidence" in r for r in verdict.reasons)


def test_unknown_supplier_is_medium():
    verdict = check_draft(_draft(supplier_is_known=False), _settings())
    assert verdict.level == "medium"
    assert "New unverified supplier" in verdict.reasons


def test_line_total_mismatch_is_high():
    verdict = check_draft(_draft(total_amount="999.00"), _settings())
    assert verdict.level == "high"
    assert any("Line items sum" in r for r in verdict.reasons)


def test_missing_invoice_number_is_medium():
    verdict = check_draft(_draft(invoice_number=None), _settings())
    assert verdict.level == "medium"


# ---- Tool allow-list and args ---------------------------------------------------

def test_unknown_tool_is_rejected():
    with pytest.raises(GuardrailViolation, match="allow-list"):
        validate_tool_args("drop_table", {})


def test_invalid_args_are_rejected():
    with pytest.raises(GuardrailViolation):
        validate_tool_args("adjust_inventory", {"inventory_id": "", "quantity_delta": "1", "reason": "x"})


def test_extra_fields_are_rejected():
    with pytest.raises(GuardrailViolation):
        validate_tool_args("create_supplier", {"name": "A", "is_admin": True})


def test_large_inventory_change_is_high_and_decrease_is_medium():
    settings = _settings()
    big = check_inventory_adjustment({"quantity_delta": "500"}, settings)
    dec = check_inventory_adjustment({"quantity_delta": "-5"}, settings)
    assert big.level == "high"
    assert dec.level == "medium"
    assert Decimal("0") < Decimal("5")
