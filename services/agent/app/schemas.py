"""Pydantic contracts for the agent service.

These mirror the Zod contracts in `src/lib/schemas.ts` (AgentRunInputSchema,
AgentActionProposalSchema, ApprovalDecisionSchema). Keep the enum values in
sync with `AGENT_*` constants there.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

WorkflowType = Literal["purchase_bill_ingestion", "inventory_reconciliation", "invoice_draft"]
ToolName = Literal["create_purchase_bill", "adjust_inventory", "create_supplier"]
RiskLevel = Literal["low", "medium", "high", "critical"]
RunStatus = Literal["running", "awaiting_approval", "completed", "failed", "rejected"]
ActionStatus = Literal["pending_approval", "auto_executed", "approved", "rejected", "failed"]
DecisionKind = Literal["approved", "rejected", "modified"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AgentRunInput(_Strict):
    workflow_type: WorkflowType
    thread_id: Optional[str] = Field(default=None, min_length=1)
    raw_input: Union[str, dict[str, Any]]

    @model_validator(mode="after")
    def _non_empty(self) -> "AgentRunInput":
        if isinstance(self.raw_input, str) and not self.raw_input.strip():
            raise ValueError("Input text is required")
        return self


class LineItem(_Strict):
    name: str = Field(min_length=1, max_length=200)
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None


class PurchaseBillDraft(_Strict):
    """Structured output the extractor must produce. Validated before any guardrail runs."""

    supplier_name: str = Field(min_length=1, max_length=200)
    supplier_is_known: bool = False
    invoice_number: Optional[str] = None
    bill_date: Optional[date] = None
    items: list[LineItem] = Field(min_length=1)
    total_amount: Decimal = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0)


class CreatePurchaseBillArgs(_Strict):
    supplier_name: str
    invoice_number: Optional[str] = None
    bill_date: Optional[date] = None
    items: list[LineItem] = Field(min_length=1)
    total_amount: Decimal = Field(ge=0)


class AdjustInventoryArgs(_Strict):
    inventory_id: str = Field(min_length=1)
    quantity_delta: Decimal
    reason: str = Field(min_length=1, max_length=500)


class CreateSupplierArgs(_Strict):
    name: str = Field(min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


TOOL_ARG_MODELS: dict[str, type[BaseModel]] = {
    "create_purchase_bill": CreatePurchaseBillArgs,
    "adjust_inventory": AdjustInventoryArgs,
    "create_supplier": CreateSupplierArgs,
}


class AgentActionProposal(_Strict):
    tool_name: ToolName
    args_json: dict[str, Any]
    diff_json: Optional[dict[str, Any]] = None
    risk_level: RiskLevel
    risk_reasons: list[str] = Field(default_factory=list)
    status: ActionStatus = "pending_approval"
    action_id: str


class ApprovalDecision(_Strict):
    decision: DecisionKind
    modified_args_json: Optional[dict[str, Any]] = None
    reason: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _modified_needs_args(self) -> "ApprovalDecision":
        if self.decision == "modified" and not self.modified_args_json:
            raise ValueError('modified_args_json is required when decision is "modified"')
        return self


class RunResponse(BaseModel):
    run_id: str
    thread_id: str
    status: RunStatus
    extracted: Optional[dict[str, Any]] = None
    confidence: Optional[float] = None
    proposals: list[AgentActionProposal] = Field(default_factory=list)
    error: Optional[str] = None
