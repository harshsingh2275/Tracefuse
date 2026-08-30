"""
Investigation Context Builder
Assembles structured JSON payloads from the database for the Grounded AI Assistant (Section 15).
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from apps.api.models import (
    Investigation,
    InvestigationEntity,
    Account,
    Transaction,
    Device,
    AccountDevice,
    Pattern,
    RiskSignal,
    Evidence,
    CaseNote,
)
from analytics.patterns.engine import DetectionEngine
from analytics.risk.scorer import RiskScoringEngine
from analytics.graph.algorithms import follow_the_money


def build_investigation_context(investigation_id: str, db: Session) -> Dict[str, Any]:
    """Extracts all structured relational evidence for an investigation into an LLM context dictionary."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return {}

    # Entities in scope
    inv_entities = db.query(InvestigationEntity).filter(InvestigationEntity.investigation_id == investigation_id).all()
    account_ids = [ie.account_id for ie in inv_entities]
    accounts = db.query(Account).filter(Account.id.in_(account_ids)).all() if account_ids else []

    # Transactions in scope
    transactions = db.query(Transaction).filter(
        (Transaction.source_account_id.in_(account_ids)) | (Transaction.destination_account_id.in_(account_ids))
    ).filter(
        Transaction.timestamp >= inv.time_window_start,
        Transaction.timestamp <= inv.time_window_end,
    ).order_by(Transaction.timestamp.asc()).all()

    # Hardware devices
    account_devices = db.query(AccountDevice).filter(AccountDevice.account_id.in_(account_ids)).all()
    device_ids = [ad.device_id for ad in account_devices]
    devices = db.query(Device).filter(Device.id.in_(device_ids)).all() if device_ids else []

    # Run detection engine to guarantee fresh patterns & evidence
    detection_engine = DetectionEngine()
    detected_patterns = detection_engine.run_all(
        transactions=transactions,
        accounts=accounts,
        devices=devices,
        account_devices=account_devices,
    )

    risk_engine = RiskScoringEngine()
    risk_breakdown = risk_engine.calculate_risk(detected_patterns)

    # Follow the money sample if source account exists
    money_trail = []
    if accounts:
        money_trail = follow_the_money(accounts[0].id, transactions, max_hops=5)

    # Investigator notes
    notes = db.query(CaseNote).filter(CaseNote.investigation_id == investigation_id).all()

    context_payload = {
        "investigation_id": inv.id,
        "case_title": inv.title,
        "current_status": inv.status,
        "risk_score": risk_breakdown.composite_score,
        "risk_level": risk_breakdown.risk_level,
        "time_window": f"{inv.time_window_start.isoformat()} to {inv.time_window_end.isoformat()}",
        "total_money_flow_inr": inv.total_flow_amount,
        "entities": [
            {
                "account_id": a.id,
                "holder_name": a.holder_name,
                "account_type": a.account_type,
                "account_number": a.account_number,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in accounts
        ],
        "shared_devices": [
            {
                "device_id": d.id,
                "fingerprint": d.device_fingerprint,
                "device_type": d.device_type,
                "linked_accounts": [ad.account_id for ad in account_devices if ad.device_id == d.id],
            }
            for d in devices
        ],
        "detected_patterns": [p.to_dict() for p in detected_patterns],
        "risk_breakdown": risk_breakdown.to_dict(),
        "key_evidence": risk_breakdown.reasons,
        "money_trail_hops": money_trail[:6],
        "investigator_notes": [n.note_text for n in notes],
        "sample_transactions": [
            {
                "id": t.id,
                "from": t.source_account_id,
                "to": t.destination_account_id,
                "amount_inr": t.amount,
                "timestamp": t.timestamp.isoformat(),
                "type": t.transaction_type,
            }
            for t in transactions[:20]
        ],
    }

    return context_payload
