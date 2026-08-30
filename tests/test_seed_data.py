"""
Tests verifying database schema integrity and synthetic seed data generation.
"""
import pytest
from sqlalchemy import func
from apps.api.database import SessionLocal
from apps.api.models import (
    User,
    Account,
    Entity,
    Device,
    AccountDevice,
    Identifier,
    AccountIdentifier,
    Transaction,
    Investigation,
    InvestigationEntity,
    CaseNote,
)
from data.seed.generate_seed_data import generate_seed


@pytest.fixture(scope="module", autouse=True)
def run_seeder():
    generate_seed()


def test_seed_counts():
    db = SessionLocal()
    try:
        acc_count = db.query(Account).count()
        ent_count = db.query(Entity).count()
        dev_count = db.query(Device).count()
        txn_count = db.query(Transaction).count()
        inv_count = db.query(Investigation).count()

        assert acc_count >= 50
        assert ent_count >= 40
        assert dev_count >= 20
        assert txn_count >= 500
        assert inv_count == 7  # Scenarios 3 through 9 create investigations
    finally:
        db.close()


def test_benign_transaction_ratio():
    db = SessionLocal()
    try:
        total_txns = db.query(Transaction).count()
        benign_txns = db.query(Transaction).filter(
            (Transaction.id.like("txn_norm_%")) | (Transaction.id.like("txn_merch_%"))
        ).count()

        benign_ratio = benign_txns / total_txns
        assert benign_ratio >= 0.70, f"Expected >= 70% benign volume, got {benign_ratio*100:.1f}%"
    finally:
        db.close()


def test_flagship_scenario_exists():
    db = SessionLocal()
    try:
        flagship = db.query(Investigation).filter(Investigation.id == "inv_flagship_demo").first()
        assert flagship is not None
        assert flagship.scenario_tag == "scenario_9_flagship"
        assert flagship.risk_level == "critical"
        assert flagship.total_flow_amount == 840000.0

        # Check associated accounts
        entities = db.query(InvestigationEntity).filter(InvestigationEntity.investigation_id == flagship.id).all()
        account_ids = {e.account_id for e in entities}
        assert "acc_flagship_origin" in account_ids
        assert "acc_flagship_mule_01" in account_ids
        assert "acc_flagship_layer_01" in account_ids
        assert "acc_flagship_layer_02" in account_ids
        assert "acc_flagship_beneficiary" in account_ids

        # Check shared device
        mule1_devices = db.query(AccountDevice).filter(AccountDevice.account_id == "acc_flagship_mule_01").all()
        mule2_devices = db.query(AccountDevice).filter(AccountDevice.account_id == "acc_flagship_mule_02").all()
        mule1_dev_ids = {d.device_id for d in mule1_devices}
        mule2_dev_ids = {d.device_id for d in mule2_devices}
        assert "dev_flagship_shared_01" in mule1_dev_ids
        assert "dev_flagship_shared_01" in mule2_dev_ids

        # Check notes
        notes = db.query(CaseNote).filter(CaseNote.investigation_id == flagship.id).all()
        assert len(notes) >= 2
    finally:
        db.close()


def test_all_scenarios_represented():
    db = SessionLocal()
    try:
        expected_tags = {
            "scenario_3_fanout",
            "scenario_4_layering",
            "scenario_5_circular",
            "scenario_6_shared_device",
            "scenario_7_passthrough",
            "scenario_8_fragmentation",
            "scenario_9_flagship",
        }
        actual_tags = {inv.scenario_tag for inv in db.query(Investigation).all()}
        assert expected_tags.issubset(actual_tags)
    finally:
        db.close()
