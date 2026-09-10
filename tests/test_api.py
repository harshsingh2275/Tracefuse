"""
Integration Tests for TraceFuse Backend APIs (Step 7 per Section 28).
Validates all endpoints listed in Section 18 against seeded database scenarios.
"""
import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

unauth_client = TestClient(app)

client = TestClient(app)
# Authenticate the integration test client
_login_res = client.post("/auth/login", json={"passcode": "demo2026"})
assert _login_res.status_code == 200, f"Setup login failed: {_login_res.text}"
_jwt_token = _login_res.json()["token"]
client.cookies.set("tracefuse_jwt", _jwt_token)


# -------------------------------------------------------------------------
# 0. Authentication & Authorization Tests
# -------------------------------------------------------------------------
def test_unauthenticated_requests_return_401():
    """Verify that unauthenticated requests to protected endpoints return 401."""
    # Data endpoints
    res_list = unauth_client.get("/investigations")
    assert res_list.status_code == 401
    assert "Authentication required" in res_list.json()["detail"]

    res_detail = unauth_client.get("/investigations/inv_flagship_demo")
    assert res_detail.status_code == 401

    res_graph = unauth_client.get("/investigations/inv_flagship_demo/graph")
    assert res_graph.status_code == 401

    res_summary = unauth_client.get("/dashboard/summary")
    assert res_summary.status_code == 401

    # Mutating endpoints
    res_note = unauth_client.post(
        "/investigations/inv_flagship_demo/notes",
        json={"note_text": "Unauthorized test note", "user_id": "usr_analyst_01"},
    )
    assert res_note.status_code == 401

    res_status = unauth_client.patch(
        "/investigations/inv_flagship_demo/status",
        json={"status": "escalated_fiu", "user_id": "usr_analyst_01"},
    )
    assert res_status.status_code == 401

    res_fm = unauth_client.post(
        "/investigations/inv_flagship_demo/follow-money",
        json={"source_account_id": "acc_flagship_origin"},
    )
    assert res_fm.status_code == 401

    res_ask = unauth_client.post(
        "/investigations/inv_flagship_demo/ask",
        json={"question": "What is happening?"},
    )
    assert res_ask.status_code == 401


def test_auth_login_invalid_passcode():
    res = unauth_client.post("/auth/login", json={"passcode": "wrong_password"})
    assert res.status_code == 401
    assert "Invalid access passcode" in res.json()["detail"]


def test_auth_login_valid_passcode_and_cookie():
    temp_client = TestClient(app)
    res = temp_client.post("/auth/login", json={"passcode": "demo2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "token" in data

    # Verify cookie is set on the response
    assert "tracefuse_jwt" in res.cookies

    # Verify that the temp_client can now access protected routes
    res_protected = temp_client.get("/investigations")
    assert res_protected.status_code == 200


def test_bearer_token_authorization():
    """Verify that Authorization: Bearer <token> fallback works for external clients / curl."""
    res = unauth_client.get(
        "/investigations",
        headers={"Authorization": f"Bearer {_jwt_token}"},
    )
    assert res.status_code == 200
    assert len(res.json()) >= 7


def test_invalid_bearer_token_returns_401():
    res = unauth_client.get(
        "/investigations",
        headers={"Authorization": "Bearer completely_invalid_token"},
    )
    assert res.status_code == 401
    assert "Invalid session token" in res.json()["detail"]


# -------------------------------------------------------------------------
# 1. Dashboard API Tests
# -------------------------------------------------------------------------
def test_get_dashboard_summary():
    response = client.get("/dashboard/summary")
    assert response.status_code == 200
    data = response.json()

    assert "suspicious_networks" in data
    assert "high_risk_accounts" in data
    assert "flagged_transactions" in data
    assert "amount_under_investigation" in data
    assert data["suspicious_networks"] >= 7
    assert data["amount_under_investigation"] > 100000.0


# -------------------------------------------------------------------------
# 2. Investigations Listing & Detail Tests
# -------------------------------------------------------------------------
def test_list_investigations_and_filters():
    # Test all investigations
    response = client.get("/investigations")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 7

    # Verify sorting by risk score descending
    scores = [item["risk_score"] for item in items]
    assert scores == sorted(scores, reverse=True)

    # Test status filter
    response_filtered = client.get("/investigations?status=investigating")
    assert response_filtered.status_code == 200
    for item in response_filtered.json():
        assert item["status"] == "investigating"


def test_get_flagship_investigation_detail():
    response = client.get("/investigations/inv_flagship_demo")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "inv_flagship_demo"
    assert data["scenario_tag"] == "scenario_9_flagship"
    assert data["risk_level"] == "critical"
    assert data["risk_score"] >= 80.0
    assert len(data["entities"]) >= 8
    assert len(data["patterns"]) >= 3
    assert len(data["risk_signals"]) >= 3
    assert len(data["evidence_items"]) >= 3
    assert data["case_genesis"] is not None
    assert len(data["case_genesis"]["key_evidence_signals"]) >= 2


def test_investigation_not_found():
    response = client.get("/investigations/non_existent_case_9999")
    assert response.status_code == 404


# -------------------------------------------------------------------------
# 3. Graph, Timeline & Evidence Endpoints
# -------------------------------------------------------------------------
def test_get_investigation_graph():
    response = client.get("/investigations/inv_flagship_demo/graph")
    assert response.status_code == 200
    data = response.json()

    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 8
    assert len(data["edges"]) >= 8

    # Verify React Flow structure
    node = data["nodes"][0]
    assert "id" in node
    assert "type" in node
    assert "data" in node
    assert "position" in node


def test_get_investigation_timeline():
    response = client.get("/investigations/inv_flagship_demo/timeline")
    assert response.status_code == 200
    events = response.json()

    assert len(events) >= 10
    assert events[0]["index"] == 1
    assert "timestamp" in events[0]
    assert "amount" in events[0]


def test_get_investigation_evidence():
    response = client.get("/investigations/inv_flagship_demo/evidence")
    assert response.status_code == 200
    evidence = response.json()

    assert len(evidence) >= 3
    assert "description" in evidence[0]
    assert len(evidence[0]["transaction_ids_json"]) > 0


# -------------------------------------------------------------------------
# 4. Interactive Flow: Follow the Money & AI Assistant
# -------------------------------------------------------------------------
def test_follow_the_money_endpoint():
    req_body = {
        "source_account_id": "acc_flagship_origin",
        "max_hops": 6,
    }
    response = client.post("/investigations/inv_flagship_demo/follow-money", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["source_account_id"] == "acc_flagship_origin"
    assert data["total_hops"] >= 4
    assert len(data["hops"]) >= 4
    assert data["hops"][0]["hop_number"] == 1
    assert data["hops"][0]["from_account_id"] == "acc_flagship_origin"
    assert "hop_elapsed_minutes" in data["hops"][0]


def test_follow_the_money_scenario_4_layered_chain():
    req_body = {
        "source_account_id": "acc_s4_hop_01",
        "max_hops": 6,
    }
    response = client.post("/investigations/inv_layering_chain/follow-money", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["source_account_id"] == "acc_s4_hop_01"
    assert data["total_hops"] == 4
    hop_sequence = [h["to_account_id"] for h in data["hops"]]
    assert hop_sequence == [
        "acc_s4_hop_02",
        "acc_s4_hop_03",
        "acc_s4_hop_04",
        "acc_s4_hop_05",
    ]
    # Check all 4 rapid pass-through hops in chain
    for h in data["hops"]:
        assert h["amount"] >= 340000.0
        assert h["elapsed_time_minutes"] >= 0.0


def test_ask_assistant_endpoint():
    req_body = {
        "question": "Why is this account suspicious?",
    }
    response = client.post("/investigations/inv_flagship_demo/ask", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["grounded"] is True
    assert len(data["answer"]) > 50
    assert "model" in data
    # Confirm it cites real evidence, amounts or patterns from Flagship case
    assert ("89" in data["answer"] or "8.4" in data["answer"] or "fan_out" in data["answer"].lower() or "mule" in data["answer"].lower() or "syndicate" in data["answer"].lower() or "critical" in data["answer"].lower())


def test_ask_assistant_offline_fallback(monkeypatch):
    import apps.api.services.ai_service as ai_module
    # Simulate missing/unset API key
    monkeypatch.setattr(ai_module, "AI_API_KEY", "")

    req_body = {
        "question": "What is the money trail from the origin?",
    }
    response = client.post("/investigations/inv_flagship_demo/ask", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["grounded"] is True
    assert data["fallback_used"] is True
    assert data["model"] == "deterministic-evidence-engine"
    assert "Money Trail" in data["answer"] or "Hop" in data["answer"] or "acc_flagship" in data["answer"]
    assert len(data["citations"]) > 0


def test_ask_assistant_citations_from_case():
    req_body = {
        "question": "Show me the evidence and detected patterns with transaction citations.",
    }
    response = client.post("/investigations/inv_flagship_demo/ask", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["grounded"] is True
    assert len(data["citations"]) > 0
    for cite in data["citations"]:
        assert cite.startswith("txn_")


# -------------------------------------------------------------------------
# 5. Workflow: Status Transitions & Case Notes
# -------------------------------------------------------------------------
def test_update_investigation_status_and_audit_log():
    # Update to escalated
    response = client.patch(
        "/investigations/inv_flagship_demo/status",
        json={"status": "escalated", "user_id": "usr_analyst_01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["new_status"] == "escalated"

    # Verify update persisted
    detail_res = client.get("/investigations/inv_flagship_demo")
    assert detail_res.json()["status"] == "escalated"
    # Verify audit action created
    assert any(a["new_value"] == "escalated" for a in detail_res.json()["actions"])


def test_invalid_status_transition_rejected():
    response = client.patch(
        "/investigations/inv_flagship_demo/status",
        json={"status": "invalid_status_xyz"},
    )
    assert response.status_code == 422  # Pydantic validation error


def test_add_case_note():
    note_payload = {
        "note_text": "Verified mule ring cluster with secondary telecom identifiers.",
        "user_id": "usr_analyst_01",
    }
    response = client.post("/investigations/inv_flagship_demo/notes", json=note_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["note_text"] == note_payload["note_text"]
    assert data["user_id"] == "usr_analyst_01"


# -------------------------------------------------------------------------
# 6. Report, Accounts, and Transactions Endpoints
# -------------------------------------------------------------------------
def test_generate_investigation_report():
    response = client.get("/investigations/inv_flagship_demo/report")
    assert response.status_code == 200
    report = response.json()

    assert report["investigation_id"] == "inv_flagship_demo"
    assert "case_summary" in report
    assert len(report["entities_involved"]) >= 8
    assert len(report["detected_patterns"]) >= 3
    assert len(report["recommended_action"]) > 10


def test_get_account_detail():
    response = client.get("/accounts/acc_flagship_origin")
    assert response.status_code == 200
    acc = response.json()

    assert acc["id"] == "acc_flagship_origin"
    assert acc["holder_name"] == "Vikramaditya Singhania"
    assert acc["transaction_count"] >= 5
    assert acc["total_outflow"] > 500000.0


def test_get_transaction_detail():
    response = client.get("/transactions/txn_flagship_fanout_01")
    assert response.status_code == 200
    txn = response.json()

    assert txn["id"] == "txn_flagship_fanout_01"
    assert txn["source_account_id"] == "acc_flagship_origin"
    assert txn["amount"] == 180000.0
    assert txn["source_holder_name"] is not None
