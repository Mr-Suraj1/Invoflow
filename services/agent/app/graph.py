"""LangGraph workflow: ingest -> extract -> propose -> guard -> (auto | human gate) -> finalize.

Design rules:
- The service never writes to the database. It returns proposals. The Next.js server
  persists them as agent_actions and performs the writes, so there is one write path.
- Low-risk proposals are cleared for auto-execution. Anything else pauses at `interrupt()`
  until a human decides in the approval queue. The checkpointer keeps the paused state.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any, Optional, TypedDict

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from .config import Settings
from .extract import ExtractionError, Extractor, StructuredPayloadExtractor
from .guardrails import (
    GuardrailViolation,
    RiskVerdict,
    check_draft,
    check_new_supplier,
    redact_obj,
    validate_tool_args,
)
from .schemas import ApprovalDecision, PurchaseBillDraft


class GraphState(TypedDict, total=False):
    workflow_type: str
    raw_input: Any  # already redacted
    draft: Optional[dict]
    proposals: list[dict]
    status: str  # running | awaiting_approval | completed | rejected | failed
    error: Optional[str]


def _money(value: Decimal) -> str:
    return format(value, "f")


def build_graph(
    settings: Settings,
    extractor: Extractor | None = None,
    checkpointer: BaseCheckpointSaver | None = None,
):
    structured = StructuredPayloadExtractor()

    # ---- nodes -----------------------------------------------------------------

    def ingest(state: GraphState) -> dict:
        # Redact before anything downstream (LLM, logs, checkpoints) sees the payload.
        return {"raw_input": redact_obj(state["raw_input"]), "status": "running", "proposals": []}

    def extract(state: GraphState) -> dict:
        if state["workflow_type"] != "purchase_bill_ingestion":
            return {"status": "failed", "error": f"Workflow '{state['workflow_type']}' is not implemented yet"}
        try:
            raw = state["raw_input"]
            if isinstance(raw, dict):
                draft = structured.extract_payload(raw)
            else:
                draft = extractor.extract(raw)  # type: ignore[union-attr]
        except ExtractionError as exc:
            return {"status": "failed", "error": str(exc)}
        return {"draft": draft.model_dump(mode="json")}

    def propose(state: GraphState) -> dict:
        if state.get("status") == "failed":
            return {}
        draft = PurchaseBillDraft.model_validate(state["draft"])
        proposals: list[dict] = []
        try:
            bill_args = validate_tool_args("create_purchase_bill", {
                "supplier_name": draft.supplier_name,
                "invoice_number": draft.invoice_number,
                "bill_date": draft.bill_date.isoformat() if draft.bill_date else None,
                "items": [item.model_dump(mode="json") for item in draft.items],
                "total_amount": _money(draft.total_amount),
            })
            proposals.append({"action_id": str(uuid.uuid4()), "tool_name": "create_purchase_bill",
                              "args_json": bill_args, "_verdict": check_draft(draft, settings)})

            if not draft.supplier_is_known:
                supplier_args = validate_tool_args("create_supplier", {"name": draft.supplier_name})
                proposals.append({"action_id": str(uuid.uuid4()), "tool_name": "create_supplier",
                                  "args_json": supplier_args, "_verdict": check_new_supplier(supplier_args)})
        except GuardrailViolation as exc:
            return {"status": "failed", "error": str(exc)}
        return {"proposals": _finalize_verdicts(proposals)}

    def gate(state: GraphState) -> dict:
        # Nothing before interrupt() may have side effects: on resume, this node re-runs from the top.
        pending = [p for p in state["proposals"] if p["risk_level"] != "low"]
        resume = interrupt({"action_ids": [p["action_id"] for p in pending], "proposals": pending})
        return {"proposals": _apply_decisions(state["proposals"], resume or {}, settings)}

    def finalize(state: GraphState) -> dict:
        if state.get("status") == "failed":
            return {}
        proposals = state["proposals"]
        all_rejected = bool(proposals) and all(p["status"] == "rejected" for p in proposals)
        return {"status": "rejected" if all_rejected else "completed"}

    def after_propose(state: GraphState) -> str:
        if state.get("status") == "failed":
            return "finalize"
        if any(p["risk_level"] != "low" for p in state["proposals"]):
            return "gate"
        return "finalize"

    # ---- wiring ----------------------------------------------------------------

    builder = StateGraph(GraphState)
    builder.add_node("ingest", ingest)
    builder.add_node("extract", extract)
    builder.add_node("propose", propose)
    builder.add_node("gate", gate)
    builder.add_node("finalize", finalize)

    builder.add_edge(START, "ingest")
    builder.add_edge("ingest", "extract")
    builder.add_edge("extract", "propose")
    builder.add_conditional_edges("propose", after_propose, {"gate": "gate", "finalize": "finalize"})
    builder.add_edge("gate", "finalize")
    builder.add_edge("finalize", END)

    return builder.compile(checkpointer=checkpointer or MemorySaver())


def _finalize_verdicts(proposals: list[dict]) -> list[dict]:
    """Attach the risk verdict and the initial status to each proposal, then drop the helper key."""
    out = []
    for p in proposals:
        verdict: RiskVerdict = p.pop("_verdict")
        p["risk_level"] = verdict.level
        p["risk_reasons"] = verdict.reasons
        p["diff_json"] = None
        p["status"] = "auto_executed" if verdict.auto_executable else "pending_approval"
        out.append(p)
    return out


def _apply_decisions(proposals: list[dict], decisions: dict, settings: Settings) -> list[dict]:
    """Apply human decisions keyed by action_id. Missing decisions leave a gated action pending."""
    updated = []
    for p in proposals:
        p = dict(p)
        if p["status"] == "auto_executed":
            updated.append(p)
            continue
        raw = decisions.get(p["action_id"])
        if raw is None:
            updated.append(p)
            continue
        decision = ApprovalDecision.model_validate(raw)
        if decision.decision == "approved":
            p["status"] = "approved"
        elif decision.decision == "rejected":
            p["status"] = "rejected"
        else:  # modified: human edits are re-validated and re-checked by the guardrails
            p["args_json"] = validate_tool_args(p["tool_name"], decision.modified_args_json or {})
            p["status"] = "approved"
        updated.append(p)
    return updated


def start_run(graph, *, thread_id: str, state_input: dict) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    return graph.invoke(state_input, config)


def resume_run(graph, *, thread_id: str, decisions: dict[str, Any]) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    return graph.invoke(Command(resume=decisions), config)


def pending_action_ids(graph, thread_id: str) -> set[str]:
    snapshot = graph.get_state({"configurable": {"thread_id": thread_id}})
    return {p["action_id"] for p in snapshot.values.get("proposals", []) if p["status"] == "pending_approval"}
