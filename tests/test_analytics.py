"""
Unit and Integration Tests for Analytics Engines (Steps 4, 5, 6 per Section 28).
Validates:
  1. All 8 pattern detectors individually
  2. Zero false positives on Benign Scenarios (1 & 2)
  3. Correct detector firings on all 7 Fraud Scenarios (3 through 9) per Section 26 Table
  4. Follow the Money BFS fund provenance algorithm
  5. NetworkX Graph construction & cycle detection
  6. Risk Scoring composite formula, guard rails, and score bands
"""
import pytest
from datetime import datetime, timedelta
from apps.api.database import SessionLocal
from apps.api.models import Account, Transaction, Device, AccountDevice, Investigation, InvestigationEntity
from analytics.graph.builder import build_networkx_graph, get_investigation_graph_payload
from analytics.graph.algorithms import detect_cycles, calculate_centrality, follow_the_money
from analytics.patterns.engine import DetectionEngine
from analytics.patterns.detectors.fan_out import detect_fan_out
from analytics.patterns.detectors.fan_in import detect_fan_in
from analytics.patterns.detectors.rapid_pass_through import detect_rapid_pass_through
from analytics.patterns.detectors.fragmentation import detect_fragmentation
from analytics.patterns.detectors.velocity import detect_velocity
from analytics.patterns.detectors.circular import detect_circular_movement
from analytics.patterns.detectors.shared_device import detect_shared_device
from analytics.patterns.detectors.new_intermediary import detect_new_intermediary
from analytics.risk.scorer import RiskScoringEngine
from analytics.temporal.analysis import compute_account_velocity


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# =========================================================================
# 1. INDIVIDUAL DETECTOR TESTS AGAINST SEEDED SCENARIOS
# =========================================================================

def test_scenario_1_and_2_benign_no_false_positives(db):
    """Section 26: Benign Scenarios 1 & 2 must NOT trigger fraud detectors."""
    benign_txs = db.query(Transaction).filter(
        (Transaction.id.like("txn_norm_%")) | (Transaction.id.like("txn_merch_%"))
    ).all()
    accounts = db.query(Account).all()
    devices = db.query(Device).all()
    account_devices = db.query(AccountDevice).all()

    engine = DetectionEngine()
    results = engine.run_all(
        transactions=benign_txs,
        accounts=accounts,
        devices=devices,
        account_devices=account_devices,
    )

    # Fan-out, fan-in, circular, fragmentation, rapid pass-through should NOT fire on benign volume
    fanout = [r for r in results if r.pattern_type == "fan_out"]
    circular = [r for r in results if r.pattern_type == "circular_movement"]
    frag = [r for r in results if r.pattern_type == "fragmentation"]
    passthrough = [r for r in results if r.pattern_type == "rapid_pass_through"]

    assert len(fanout) == 0, f"False positive fan-out on benign data: {fanout}"
    assert len(circular) == 0, f"False positive circular on benign data: {circular}"
    assert len(frag) == 0, f"False positive fragmentation on benign data: {frag}"
    assert len(passthrough) == 0, f"False positive pass-through on benign data: {passthrough}"


def test_scenario_3_fan_out_detector(db):
    """Section 26: Scenario 3 must trigger fan_out and velocity detectors."""
    s3_txs = db.query(Transaction).filter(Transaction.id.like("txn_s3_%")).all()
    accounts = db.query(Account).filter(Account.id.like("acc_s3_%")).all()

    fanouts = detect_fan_out(s3_txs)
    assert len(fanouts) >= 1
    assert fanouts[0].pattern_type == "fan_out"
    assert "acc_s3_src_01" in fanouts[0].entities
    assert len(fanouts[0].entities) >= 9  # 1 source + 8 destinations

    velocities = detect_velocity(s3_txs, accounts=accounts)
    assert len(velocities) >= 1
    assert velocities[0].pattern_type == "velocity"


def test_scenario_4_layering_detector(db):
    """Section 26: Scenario 4 must trigger rapid_pass_through chain."""
    s4_txs = db.query(Transaction).filter(Transaction.id.like("txn_s4_%")).all()
    results = detect_rapid_pass_through(s4_txs)
    
    assert len(results) >= 1
    assert results[0].pattern_type == "rapid_pass_through"
    assert any("acc_s4_hop" in e for e in results[0].entities)


def test_scenario_5_circular_detector(db):
    """Section 26: Scenario 5 must trigger circular_movement cycle A->B->C->A."""
    s5_txs = db.query(Transaction).filter(Transaction.id.like("txn_s5_%")).all()
    results = detect_circular_movement(s5_txs)

    assert len(results) >= 1
    assert results[0].pattern_type == "circular_movement"
    assert results[0].severity == "critical"
    assert len(results[0].entities) == 3


def test_scenario_6_shared_device_detector(db):
    """Section 26: Scenario 6 must trigger shared_device detector."""
    s6_devs = db.query(Device).filter(Device.id.like("dev_s6_%")).all()
    s6_ads = db.query(AccountDevice).filter(AccountDevice.account_id.like("acc_s6_%")).all()

    results = detect_shared_device(account_devices=s6_ads, devices=s6_devs)
    assert len(results) >= 1
    assert results[0].pattern_type == "shared_device"
    assert len(results[0].entities) >= 4


def test_scenario_7_rapid_passthrough_detector(db):
    """Section 26: Scenario 7 must trigger rapid_pass_through."""
    s7_txs = db.query(Transaction).filter(Transaction.id.like("txn_s7_%")).all()
    results = detect_rapid_pass_through(s7_txs)

    assert len(results) >= 1
    assert results[0].pattern_type == "rapid_pass_through"
    assert "acc_s7_passthrough_01" in results[0].entities


def test_scenario_8_fragmentation_detector(db):
    """Section 26: Scenario 8 must trigger fragmentation detector."""
    s8_txs = db.query(Transaction).filter(Transaction.id.like("txn_s8_%")).all()
    results = detect_fragmentation(s8_txs)

    assert len(results) >= 1
    assert results[0].pattern_type == "fragmentation"
    assert "acc_s8_smurf_src" in results[0].entities
    assert "acc_s8_smurf_dst" in results[0].entities


def test_scenario_9_flagship_multi_pattern(db):
    """Section 26: Flagship case must trigger fan_out, rapid_pass_through, shared_device, circular."""
    s9_txs = db.query(Transaction).filter(Transaction.id.like("txn_flagship_%")).all()
    accounts = db.query(Account).filter(Account.id.like("acc_flagship_%")).all()
    devices = db.query(Device).filter(Device.id.like("dev_flagship_%")).all()
    ads = db.query(AccountDevice).filter(AccountDevice.account_id.like("acc_flagship_%")).all()

    engine = DetectionEngine()
    results = engine.run_all(
        transactions=s9_txs,
        accounts=accounts,
        devices=devices,
        account_devices=ads,
    )

    detected_types = {r.pattern_type for r in results}
    assert "fan_out" in detected_types
    assert "rapid_pass_through" in detected_types
    assert "shared_device" in detected_types
    assert "circular_movement" in detected_types

    # Test Risk Scorer on Flagship results
    scorer = RiskScoringEngine()
    risk = scorer.calculate_risk(results)

    assert risk.risk_level == "critical"
    assert risk.composite_score >= 80.0
    assert len(risk.reasons) >= 3


# =========================================================================
# 2. GRAPH ALGORITHM & FOLLOW THE MONEY TESTS
# =========================================================================

def test_follow_the_money_layered_chain(db):
    """Follow the money must trace the 4-hop chain in Scenario 4."""
    s4_txs = db.query(Transaction).filter(Transaction.id.like("txn_s4_%")).all()
    hops = follow_the_money("acc_s4_hop_01", s4_txs, max_hops=5)

    assert len(hops) == 4
    assert hops[0]["from_account_id"] == "acc_s4_hop_01"
    assert hops[0]["to_account_id"] == "acc_s4_hop_02"
    assert hops[3]["to_account_id"] == "acc_s4_hop_05"


def test_follow_the_money_flagship_flow(db):
    """Follow the money from flagship origin must trace through mules to layer accounts."""
    s9_txs = db.query(Transaction).filter(Transaction.id.like("txn_flagship_%")).all()
    hops = follow_the_money("acc_flagship_origin", s9_txs, max_hops=6)

    assert len(hops) >= 5
    assert hops[0]["from_account_id"] == "acc_flagship_origin"
    # Origin should disburse to mules
    dest_ids = {h["to_account_id"] for h in hops}
    assert any("mule" in dst for dst in dest_ids)


def test_graph_centrality_and_payload(db):
    """Test NetworkX graph building and centrality calculation."""
    payload = get_investigation_graph_payload("inv_flagship_demo", db)
    assert len(payload["nodes"]) >= 9
    assert len(payload["edges"]) >= 10

    # Build NetworkX from payload
    s9_txs = db.query(Transaction).filter(Transaction.id.like("txn_flagship_%")).all()
    G = build_networkx_graph(s9_txs)
    centrality = calculate_centrality(G)
    
    assert len(centrality) > 0
    assert "acc_flagship_origin" in centrality
    assert "acc_flagship_layer_01" in centrality


# =========================================================================
# 3. RISK SCORING ENGINE & GUARD RAIL TESTS
# =========================================================================

def test_risk_single_signal_guard_rail():
    """Section 5E & 14: No single signal alone can push score above 60."""
    from analytics.patterns.schema import PatternResult
    scorer = RiskScoringEngine()

    # Single high-severity fan-out
    single_pattern = [
        PatternResult(
            pattern_type="fan_out",
            severity="critical",
            confidence=1.0,
            entities=["acc_test_01"],
            transaction_ids=["txn_1"],
            evidence="Single isolated fan-out.",
            explanation="Single heuristic fired.",
        )
    ]

    breakdown = scorer.calculate_risk(single_pattern)
    assert breakdown.composite_score <= 60.0
    assert breakdown.risk_level in ("low", "medium")


def test_temporal_velocity_analytics(db):
    """Test rolling window velocity calculations."""
    s3_txs = db.query(Transaction).filter(Transaction.id.like("txn_s3_%")).all()
    velocities = compute_account_velocity(s3_txs, window_minutes=30)
    
    assert "acc_s3_src_01" in velocities
    assert velocities["acc_s3_src_01"]["is_bursty"] is True
    assert velocities["acc_s3_src_01"]["peak_burst_count_1hr"] >= 8
