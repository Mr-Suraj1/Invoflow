# InvoiceFlow Agent Service

FastAPI + LangGraph service that turns unstructured purchase-bill input into proposed
database writes. Every proposal passes deterministic Pydantic and risk guardrails. Anything
above low risk pauses at a human approval gate.

The service never writes to the database. It returns proposals. The Next.js server stores
them in `agent_runs` / `agent_actions` / `approvals` and performs the writes.

## Layout

```
app/
  config.py      Settings (env prefix AGENT_)
  schemas.py     Pydantic contracts, mirror of src/lib/schemas.ts (Agent* schemas)
  guardrails.py  PII redaction, tool allow-list, arg validation, risk rules
  extract.py     Extractors: Anthropic (free text), structured payload, unconfigured fallback
  graph.py       LangGraph: ingest -> extract -> propose -> guard -> gate (interrupt) -> finalize
  main.py        FastAPI routes with X-Service-Token auth
tests/           pytest suite (guardrails + API behaviour)
```

## Run

```bash
cd services/agent
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt                   # macOS / Linux
```

Set the environment variables (or create `services/agent/.env`):

```bash
AGENT_SERVICE_TOKEN=<long random secret shared with the Next.js server>
AGENT_ANTHROPIC_API_KEY=<optional; enables free-text extraction>
```

```bash
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8001
.venv/Scripts/python.exe -m pytest -q
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness, no auth |
| POST | `/v1/runs` | Start a workflow. Returns `completed`, `awaiting_approval`, or `failed` |
| POST | `/v1/runs/{thread_id}/decisions` | Resume a paused run with `approved` / `rejected` / `modified` per `action_id` |

## Guardrail rules (current)

| Rule | Risk |
|---|---|
| Tool not on allow-list, or args fail schema (extra fields forbidden) | Rejected |
| Bill total > ₹50,000 | high |
| Line items do not sum to total | high |
| Extraction confidence < 0.85 | medium |
| Supplier not known to the account | medium |
| Invoice number missing | medium |
| Creating a supplier record | medium |
| Inventory change > 100 units | high |
| Inventory decrease | medium |

Only `low` proposals are cleared for auto-execution.

## Known limits

- The LangGraph checkpointer is in-memory (`MemorySaver`). Paused runs are lost on restart.
  Swap in a Postgres checkpointer before production use.
- The LLM extractor is untested against the live API in this repo. The test suite covers
  the deterministic paths only.
- Inventory and reconciliation tools are defined but not yet wired into a workflow.
