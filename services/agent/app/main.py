"""HTTP API for the agent service. Called server-to-server by the Next.js app only.

Auth: every /v1 route requires the X-Service-Token header, compared in constant time.
The service fails closed: if AGENT_SERVICE_TOKEN is unset, /v1 returns 503.
"""

from __future__ import annotations

import hmac
import uuid
from functools import lru_cache
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

from .config import Settings, get_settings
from .extract import AnthropicExtractor, UnconfiguredExtractor
from .guardrails import GuardrailViolation
from .graph import build_graph, pending_action_ids, resume_run, start_run
from .schemas import AgentActionProposal, AgentRunInput, ApprovalDecision, RunResponse

app = FastAPI(title="InvoiceFlow Agent Service", version="0.1.0")


@lru_cache
def get_graph():
    settings: Settings = get_settings()
    extractor = AnthropicExtractor(settings) if settings.anthropic_api_key else UnconfiguredExtractor()
    return build_graph(settings, extractor=extractor)


def require_service_token(x_service_token: str | None = Header(default=None)) -> None:
    expected = get_settings().service_token
    if not expected:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Service token is not configured")
    if not x_service_token or not hmac.compare_digest(x_service_token, expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid service token")


class DecisionBatch(BaseModel):
    decisions: dict[str, ApprovalDecision] = Field(min_length=1)


def _to_response(run_id: str, thread_id: str, result: dict[str, Any]) -> RunResponse:
    proposals = [AgentActionProposal.model_validate(p) for p in result.get("proposals", [])]
    if result.get("__interrupt__"):
        run_status = "awaiting_approval"
    else:
        run_status = result.get("status", "running")
    draft = result.get("draft")
    return RunResponse(
        run_id=run_id,
        thread_id=thread_id,
        status=run_status,
        extracted=draft,
        confidence=draft.get("confidence") if draft else None,
        proposals=proposals,
        error=result.get("error"),
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/runs", response_model=RunResponse, dependencies=[Depends(require_service_token)])
def create_run(body: AgentRunInput) -> RunResponse:
    run_id = str(uuid.uuid4())
    thread_id = body.thread_id or str(uuid.uuid4())
    result = start_run(
        get_graph(),
        thread_id=thread_id,
        state_input={"workflow_type": body.workflow_type, "raw_input": body.raw_input},
    )
    return _to_response(run_id, thread_id, result)


@app.post(
    "/v1/runs/{thread_id}/decisions",
    response_model=RunResponse,
    dependencies=[Depends(require_service_token)],
)
def submit_decisions(thread_id: str, body: DecisionBatch) -> RunResponse:
    graph = get_graph()
    pending = pending_action_ids(graph, thread_id)
    if not pending:
        raise HTTPException(status.HTTP_409_CONFLICT, "No actions are awaiting approval for this thread")
    unknown = set(body.decisions) - pending
    if unknown:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown or non-pending action ids: {sorted(unknown)}")

    try:
        result = resume_run(
            graph,
            thread_id=thread_id,
            decisions={k: v.model_dump(mode="json") for k, v in body.decisions.items()},
        )
    except GuardrailViolation as exc:
        # A human-modified payload failed schema or allow-list checks. Nothing was committed.
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    return _to_response(str(uuid.uuid4()), thread_id, result)
