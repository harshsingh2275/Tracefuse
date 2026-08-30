"""
Integration Tests for TraceFuse Backend APIs (Step 7 per Section 28).
Validates all endpoints listed in Section 18 against seeded database scenarios.
"""
import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)


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
        "max_hops": 5,
    }
    response = client.post("/investigations/inv_flagship_demo/follow-money", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["source_account_id"] == "acc_flagship_origin"
    assert data["total_hops"] >= 4
    assert len(data["hops"]) >= 4
    assert data["hops"][0]["hop_number"] == 1
    assert data["hops"][0]["from_account_id"] == "acc_flagship_origin"


def test_ask_assistant_endpoint():
    req_body = {
        "question": "Why is this investigation marked as critical and what patterns were detected?",
    }
    response = client.post("/investigations/inv_flagship_demo/ask", json=req_body)
    assert response.status_code == 200
    data = response.json()

    assert data["grounded"] is True
    assert len(data["answer"]) > 50
    assert "model" in data


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
    assert acc["holder_name"] == "Vikramaditya Syndicate Master"
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
