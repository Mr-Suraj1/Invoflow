import pytest
from fastapi.testclient import TestClient

from app import main
from app.config import get_settings

TOKEN = "test-service-token"


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("AGENT_SERVICE_TOKEN", TOKEN)
    monkeypatch.delenv("AGENT_ANTHROPIC_API_KEY", raising=False)
    get_settings.cache_clear()
    main.get_graph.cache_clear()
    yield
    get_settings.cache_clear()
    main.get_graph.cache_clear()


@pytest.fixture
def client():
    return TestClient(main.app)


def _auth():
    return {"X-Service-Token": TOKEN}


def _payload(**overrides):
    draft = {
        "supplier_name": "Acme Pharma",
        "supplier_is_known": True,
        "invoice_number": "INV-001",
        "bill_date": "2026-11-01",
        "items": [{"name": "Paracetamol", "quantity": "10", "unit_cost": "12.50"}],
        "total_amount": "125.00",
        "confidence": 0.95,
    }
    draft.update(overrides)
    return draft


def _run(client, payload):
    return client.post("/v1/runs", headers=_auth(), json={
        "workflow_type": "purchase_bill_ingestion",
        "raw_input": payload,
    })


def test_health_is_public(client):
    assert client.get("/healthz").json() == {"status": "ok"}


def test_missing_or_wrong_token_is_rejected(client):
    body = {"workflow_type": "purchase_bill_ingestion", "raw_input": _payload()}
    assert client.post("/v1/runs", json=body).status_code == 401
    assert client.post("/v1/runs", headers={"X-Service-Token": "nope"}, json=body).status_code == 401


def test_service_fails_closed_without_configured_token(client, monkeypatch):
    monkeypatch.setenv("AGENT_SERVICE_TOKEN", "")
    get_settings.cache_clear()
    resp = client.post("/v1/runs", headers=_auth(), json={
        "workflow_type": "purchase_bill_ingestion", "raw_input": _payload()})
    assert resp.status_code == 503


def test_low_risk_run_completes_without_approval(client):
    resp = _run(client, _payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert [p["tool_name"] for p in body["proposals"]] == ["create_purchase_bill"]
    assert body["proposals"][0]["status"] == "auto_executed"


def test_high_risk_run_pauses_for_approval_then_approves(client):
    resp = _run(client, _payload(total_amount="125.00", items=[
        {"name": "Gold", "quantity": "1", "unit_cost": "60000"}], confidence=0.95))
    body = resp.json()
    assert body["status"] == "awaiting_approval"
    action_ids = [p["action_id"] for p in body["proposals"] if p["risk_level"] != "low"]
    assert action_ids

    decisions = {aid: {"decision": "approved"} for aid in action_ids}
    done = client.post(f"/v1/runs/{body['thread_id']}/decisions", headers=_auth(),
                       json={"decisions": decisions}).json()
    assert done["status"] == "completed"
    assert all(p["status"] == "approved" for p in done["proposals"] if p["action_id"] in action_ids)


def test_rejecting_everything_marks_run_rejected(client):
    body = _run(client, _payload(supplier_is_known=False)).json()
    assert body["status"] == "awaiting_approval"
    decisions = {p["action_id"]: {"decision": "rejected", "reason": "not this supplier"}
                 for p in body["proposals"] if p["risk_level"] != "low"}
    done = client.post(f"/v1/runs/{body['thread_id']}/decisions", headers=_auth(),
                       json={"decisions": decisions}).json()
    assert done["status"] == "rejected"


def test_unknown_action_id_is_rejected(client):
    body = _run(client, _payload(supplier_is_known=False)).json()
    resp = client.post(f"/v1/runs/{body['thread_id']}/decisions", headers=_auth(),
                       json={"decisions": {"not-a-real-id": {"decision": "approved"}}})
    assert resp.status_code == 422


def test_decisions_on_a_finished_thread_conflict(client):
    body = _run(client, _payload()).json()
    resp = client.post(f"/v1/runs/{body['thread_id']}/decisions", headers=_auth(),
                       json={"decisions": {"x": {"decision": "approved"}}})
    assert resp.status_code == 409


def test_modified_args_are_revalidated(client):
    body = _run(client, _payload(supplier_is_known=False)).json()
    supplier = next(p for p in body["proposals"] if p["tool_name"] == "create_supplier")
    bad = {"decision": "modified", "modified_args_json": {"name": "Acme", "is_admin": True}}
    resp = client.post(f"/v1/runs/{body['thread_id']}/decisions", headers=_auth(),
                       json={"decisions": {supplier["action_id"]: bad}})
    assert resp.status_code == 422


def test_free_text_without_llm_fails_closed(client):
    resp = client.post("/v1/runs", headers=_auth(), json={
        "workflow_type": "purchase_bill_ingestion",
        "raw_input": "Bought 10 paracetamol from Acme for 125",
    })
    body = resp.json()
    assert body["status"] == "failed"
    assert "No LLM configured" in body["error"]
    assert body["proposals"] == []


def test_unimplemented_workflow_fails(client):
    resp = client.post("/v1/runs", headers=_auth(), json={
        "workflow_type": "invoice_draft", "raw_input": {"x": 1}})
    assert resp.json()["status"] == "failed"


def test_extra_request_fields_are_rejected(client):
    resp = client.post("/v1/runs", headers=_auth(), json={
        "workflow_type": "purchase_bill_ingestion", "raw_input": {}, "owner": "someone-else"})
    assert resp.status_code == 422
