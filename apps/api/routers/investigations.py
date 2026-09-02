"""
Investigations Router
Core API endpoints for case management, graph visualization, timeline analysis,
Follow-the-Money provenance, AI assistant copilot, and compliance reporting (Section 18).
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import (
    Investigation,
    InvestigationEntity,
    Account,
    AccountDevice,
    Device,
    AccountIdentifier,
    Identifier,
    Transaction,
    CaseNote,
    CaseAction,
    User,
)
from apps.api.schemas import (
    InvestigationListItem,
    InvestigationDetailResponse,
    GraphPayloadResponse,
    TimelineEventResponse,
    EvidenceResponse,
    PatternResponse,
    RiskSignalResponse,
    AccountSummaryResponse,
    AccountDeviceResponse,
    AccountIdentifierResponse,
    CaseNoteResponse,
    CaseActionResponse,
    CaseGenesisResponse,
    FollowMoneyRequest,
    FollowMoneyResponse,
    MoneyHopResponse,
    AskAssistantRequest,
    AskAssistantResponse,
    UpdateStatusRequest,
    AddNoteRequest,
    InvestigationReportResponse,
)
from analytics.graph.builder import get_investigation_graph_payload
from analytics.graph.algorithms import follow_the_money
from analytics.patterns.engine import DetectionEngine
from analytics.risk.scorer import RiskScoringEngine
from analytics.temporal.analysis import get_timeline_events
from apps.api.services.context_builder import build_investigation_context
from apps.api.services.ai_service import ask_investigation_assistant

router = APIRouter(prefix="/investigations", tags=["Investigations"])


def _compute_investigation_analytics(inv: Investigation, db: Session):
    """Helper to run detection and risk engines over an investigation's scoped entities and transactions."""
    inv_entities = db.query(InvestigationEntity).filter(InvestigationEntity.investigation_id == inv.id).all()
    account_ids = [ie.account_id for ie in inv_entities]
    accounts = db.query(Account).filter(Account.id.in_(account_ids)).all() if account_ids else []

    transactions = db.query(Transaction).filter(
        (Transaction.source_account_id.in_(account_ids)) | (Transaction.destination_account_id.in_(account_ids))
    ).filter(
        Transaction.timestamp >= inv.time_window_start,
        Transaction.timestamp <= inv.time_window_end,
    ).order_by(Transaction.timestamp.asc()).all()

    account_devices = db.query(AccountDevice).filter(AccountDevice.account_id.in_(account_ids)).all()
    device_ids = [ad.device_id for ad in account_devices]
    devices = db.query(Device).filter(Device.id.in_(device_ids)).all() if device_ids else []

    # Run Detection Engine
    detection_engine = DetectionEngine()
    patterns = detection_engine.run_all(
        transactions=transactions,
        accounts=accounts,
        devices=devices,
        account_devices=account_devices,
    )

    # Run Risk Scoring Engine
    risk_engine = RiskScoringEngine()
    risk_breakdown = risk_engine.calculate_risk(patterns)

    return {
        "accounts": accounts,
        "transactions": transactions,
        "devices": devices,
        "account_devices": account_devices,
        "patterns": patterns,
        "risk_breakdown": risk_breakdown,
    }


@router.get("", response_model=List[InvestigationListItem])
def list_investigations(
    status: Optional[str] = Query(None, description="Filter by status (new, investigating, escalated, resolved)"),
    min_risk: Optional[float] = Query(None, description="Filter by minimum risk score"),
    db: Session = Depends(get_db),
):
    """Lists all active and completed investigation cases."""
    query = db.query(Investigation)

    if status:
        query = query.filter(Investigation.status == status)
    if min_risk is not None:
        query = query.filter(Investigation.risk_score >= min_risk)

    investigations = query.order_by(Investigation.risk_score.desc()).all()

    items = []
    for inv in investigations:
        analytics = _compute_investigation_analytics(inv, db)
        patterns = analytics["patterns"]
        top_pattern_names = list(set([p.pattern_type for p in patterns]))[:3]

        items.append(
            InvestigationListItem(
                id=inv.id,
                title=inv.title,
                status=inv.status,
                risk_score=round(inv.risk_score, 1),
                risk_level=inv.risk_level,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                time_window_start=inv.time_window_start,
                time_window_end=inv.time_window_end,
                total_flow_amount=inv.total_flow_amount,
                scenario_tag=inv.scenario_tag,
                entities_count=len(analytics["accounts"]),
                patterns_count=len(patterns),
                top_patterns=top_pattern_names,
            )
        )

    return items


@router.get("/{investigation_id}", response_model=InvestigationDetailResponse)
def get_investigation_detail(investigation_id: str, db: Session = Depends(get_db)):
    """Fetches full case details including computed pattern results, risk factor breakdowns, and case genesis."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    analytics = _compute_investigation_analytics(inv, db)
    accounts = analytics["accounts"]
    transactions = analytics["transactions"]
    patterns = analytics["patterns"]
    risk_breakdown = analytics["risk_breakdown"]
    account_devices = analytics["account_devices"]
    devices_map = {d.id: d for d in analytics["devices"]}

    # Build entity summaries
    entities_response = []
    for acc in accounts:
        acc_devs = [ad for ad in account_devices if ad.account_id == acc.id]
        dev_res = [
            AccountDeviceResponse(
                device_id=ad.device_id,
                device_fingerprint=devices_map.get(ad.device_id, Device(device_fingerprint="unknown")).device_fingerprint,
                device_type=devices_map.get(ad.device_id, Device(device_type="unknown")).device_type,
                linked_at=ad.linked_at,
            )
            for ad in acc_devs
        ]

        acc_inflow = sum(t.amount for t in transactions if t.destination_account_id == acc.id)
        acc_outflow = sum(t.amount for t in transactions if t.source_account_id == acc.id)
        acc_txs = [t for t in transactions if t.source_account_id == acc.id or t.destination_account_id == acc.id]

        entities_response.append(
            AccountSummaryResponse(
                id=acc.id,
                account_number=acc.account_number,
                holder_name=acc.holder_name,
                account_type=acc.account_type,
                created_at=acc.created_at,
                is_synthetic=acc.is_synthetic,
                devices=dev_res,
                identifiers=[],
                total_inflow=round(acc_inflow, 2),
                total_outflow=round(acc_outflow, 2),
                transaction_count=len(acc_txs),
            )
        )

    # Build Pattern Response
    patterns_response = [
        PatternResponse(
            id=f"pat_{p.pattern_type}_{idx+1}",
            pattern_type=p.pattern_type,
            severity=p.severity,
            confidence=round(p.confidence, 2),
            transaction_ids_json=p.transaction_ids,
            entities_json=p.entities,
            explanation=p.explanation,
        )
        for idx, p in enumerate(patterns)
    ]

    # Build Risk Signal Response
    signals_response = [
        RiskSignalResponse(
            id=f"sig_{s.category}",
            category=s.category,
            score=s.score,
            weight=s.weight,
            explanation=s.explanation,
        )
        for s in risk_breakdown.signals
    ]

    # Build Evidence Items
    evidence_response = [
        EvidenceResponse(
            id=f"evi_{idx+1}",
            pattern_id=f"pat_{p.pattern_type}_{idx+1}",
            description=p.evidence,
            transaction_ids_json=p.transaction_ids,
            created_at=inv.created_at,
        )
        for idx, p in enumerate(patterns)
    ]

    # Build Notes & Actions
    notes = db.query(CaseNote).filter(CaseNote.investigation_id == inv.id).order_by(CaseNote.created_at.asc()).all()
    actions = db.query(CaseAction).filter(CaseAction.investigation_id == inv.id).order_by(CaseAction.created_at.asc()).all()

    notes_res = [
        CaseNoteResponse(
            id=n.id,
            investigation_id=n.investigation_id,
            user_id=n.user_id,
            user_name="Priya Sharma" if n.user_id == "usr_analyst_01" else "Analyst",
            note_text=n.note_text,
            created_at=n.created_at,
        )
        for n in notes
    ]

    actions_res = [
        CaseActionResponse(
            id=a.id,
            investigation_id=a.investigation_id,
            user_id=a.user_id,
            user_name="Priya Sharma" if a.user_id == "usr_analyst_01" else "System",
            action_type=a.action_type,
            previous_value=a.previous_value,
            new_value=a.new_value,
            created_at=a.created_at,
        )
        for a in actions
    ]

    # Case Genesis Panel (Section 5F)
    primary_trigger = patterns[0].evidence if patterns else "Abnormal multi-hop transaction throughput detected."
    triggering_entity = accounts[0].holder_name if accounts else "Suspicious Cluster"
    time_window_str = f"{inv.time_window_start.strftime('%d %b %Y, %H:%M')} – {inv.time_window_end.strftime('%H:%M IST')}"

    case_genesis = CaseGenesisResponse(
        primary_trigger=primary_trigger,
        triggering_entity=f"{triggering_entity} ({accounts[0].id if accounts else ''})",
        time_window=time_window_str,
        suspicious_transaction_count=len(transactions),
        connected_entity_count=len(accounts),
        detected_pattern_types=[p.pattern_type for p in patterns],
        total_amount=inv.total_flow_amount,
        key_evidence_signals=risk_breakdown.reasons[:4],
    )

    effective_score = round(max(inv.risk_score, risk_breakdown.composite_score), 1)
    effective_level = "critical" if effective_score >= 80 else ("high" if effective_score >= 60 else ("medium" if effective_score >= 30 else "low"))

    return InvestigationDetailResponse(
        id=inv.id,
        title=inv.title,
        status=inv.status,
        risk_score=effective_score,
        risk_level=effective_level,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        time_window_start=inv.time_window_start,
        time_window_end=inv.time_window_end,
        total_flow_amount=inv.total_flow_amount,
        scenario_tag=inv.scenario_tag,
        entities=entities_response,
        patterns=patterns_response,
        risk_signals=signals_response,
        evidence_items=evidence_response,
        notes=notes_res,
        actions=actions_res,
        case_genesis=case_genesis,
    )


@router.get("/{investigation_id}/graph", response_model=GraphPayloadResponse)
def get_investigation_graph(investigation_id: str, db: Session = Depends(get_db)):
    """Returns React Flow graph payload with nodes and edges scoped to the investigation."""
    payload = get_investigation_graph_payload(investigation_id, db)
    if not payload["nodes"]:
        raise HTTPException(status_code=404, detail=f"No graph entities found for investigation '{investigation_id}'.")
    return payload


@router.get("/{investigation_id}/timeline", response_model=List[TimelineEventResponse])
def get_investigation_timeline(investigation_id: str, db: Session = Depends(get_db)):
    """Returns ordered transactions with temporal anomaly tags."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    analytics = _compute_investigation_analytics(inv, db)
    events = get_timeline_events(analytics["transactions"])
    return events


@router.get("/{investigation_id}/evidence", response_model=List[EvidenceResponse])
def get_investigation_evidence(investigation_id: str, db: Session = Depends(get_db)):
    """Returns the structured evidence items tying detections to concrete transactions."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    analytics = _compute_investigation_analytics(inv, db)
    patterns = analytics["patterns"]

    evidence_items = [
        EvidenceResponse(
            id=f"evi_{idx+1}",
            pattern_id=f"pat_{p.pattern_type}_{idx+1}",
            description=p.evidence,
            transaction_ids_json=p.transaction_ids,
            created_at=inv.created_at,
        )
        for idx, p in enumerate(patterns)
    ]
    return evidence_items


@router.post("/{investigation_id}/follow-money", response_model=FollowMoneyResponse)
def follow_the_money_trace(
    investigation_id: str,
    req: FollowMoneyRequest,
    db: Session = Depends(get_db),
):
    """Traces multi-hop fund flow from a source account using FIFO provenance (Section 5D & 178)."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    analytics = _compute_investigation_analytics(inv, db)
    transactions = analytics["transactions"]

    hops = follow_the_money(
        source_account_id=req.source_account_id,
        transactions=transactions,
        max_hops=req.max_hops or 6,
        destination_account_id=req.destination_account_id,
        min_amount=req.min_amount,
    )

    hop_responses = [
        MoneyHopResponse(
            hop_number=h["hop_number"],
            from_account_id=h["from_account_id"],
            to_account_id=h["to_account_id"],
            transaction_id=h["transaction_id"],
            amount=h["amount"],
            timestamp=h["timestamp"],
            cumulative_amount=h["cumulative_amount"],
            elapsed_time_minutes=h["elapsed_time_minutes"],
            hop_elapsed_minutes=h.get("hop_elapsed_minutes", 0.0),
        )
        for h in hops
    ]

    return FollowMoneyResponse(
        source_account_id=req.source_account_id,
        total_hops=len(hop_responses),
        hops=hop_responses,
    )


@router.post("/{investigation_id}/ask", response_model=AskAssistantResponse)
def ask_assistant(
    investigation_id: str,
    req: AskAssistantRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Answers investigator queries grounded strictly in case context with Groq LLM and rate limiting (Section 15 & 23)."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    context = build_investigation_context(investigation_id, db)
    client_ip = request.client.host if request.client else "unknown_client"

    res = ask_investigation_assistant(req.question, context, client_id=client_ip)
    return AskAssistantResponse(
        answer=res["answer"],
        grounded=res["grounded"],
        model=res["model"],
        citations=res.get("citations", []),
        fallback_used=res.get("fallback_used", False),
    )


@router.patch("/{investigation_id}/status")
def update_investigation_status(
    investigation_id: str,
    req: UpdateStatusRequest,
    db: Session = Depends(get_db),
):
    """Updates case status (new -> investigating -> escalated -> resolved) and creates a CaseAction audit log."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    old_status = inv.status
    inv.status = req.status
    inv.updated_at = datetime.utcnow()

    # Resolve existing user
    user = db.query(User).filter(User.id == req.user_id).first() if req.user_id else None
    if not user:
        user = db.query(User).first()
    user_id = user.id if user else None

    # Create CaseAction log
    action = CaseAction(
        id=f"act_{int(datetime.utcnow().timestamp() * 1000)}",
        investigation_id=inv.id,
        user_id=user_id,
        action_type="status_change",
        previous_value=old_status,
        new_value=req.status,
        created_at=datetime.utcnow(),
    )
    db.add(action)
    db.commit()

    return {
        "investigation_id": inv.id,
        "previous_status": old_status,
        "new_status": inv.status,
        "updated_at": inv.updated_at.isoformat(),
    }


@router.post("/{investigation_id}/notes", response_model=CaseNoteResponse)
def add_case_note(
    investigation_id: str,
    req: AddNoteRequest,
    db: Session = Depends(get_db),
):
    """Appends an investigator note to the case history."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    user = db.query(User).filter(User.id == req.user_id).first() if req.user_id else None
    if not user:
        user = db.query(User).first()
    user_id = user.id if user else None

    note = CaseNote(
        id=f"note_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        investigation_id=inv.id,
        user_id=user_id,
        note_text=req.note_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return CaseNoteResponse(
        id=note.id,
        investigation_id=note.investigation_id,
        user_id=note.user_id or "usr_analyst_01",
        user_name=user.name if user else "Analyst",
        note_text=note.note_text,
        created_at=note.created_at,
    )


@router.get("/{investigation_id}/report", response_model=InvestigationReportResponse)
def generate_investigation_report(investigation_id: str, db: Session = Depends(get_db)):
    """Generates structured printable compliance and handoff report (Section 22)."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    analytics = _compute_investigation_analytics(inv, db)
    accounts = analytics["accounts"]
    transactions = analytics["transactions"]
    patterns = analytics["patterns"]
    risk_breakdown = analytics["risk_breakdown"]
    
    notes = db.query(CaseNote).filter(CaseNote.investigation_id == inv.id).order_by(CaseNote.created_at.asc()).all()
    actions = db.query(CaseAction).filter(CaseAction.investigation_id == inv.id).order_by(CaseAction.created_at.asc()).all()
    money_trail = follow_the_money(accounts[0].id, transactions, max_hops=5) if accounts else []

    recommended_action = (
        "Immediate SAR/STR Escalation & Account Freeze: High confidence multi-entity muling and layering network."
        if risk_breakdown.composite_score >= 80.0
        else "Enhanced Due Diligence & Counterparty Monitoring: Elevated transaction velocity."
    )

    return InvestigationReportResponse(
        investigation_id=inv.id,
        title=inv.title,
        status=inv.status,
        risk_score=round(risk_breakdown.composite_score, 1),
        risk_level=risk_breakdown.risk_level,
        generated_at=datetime.utcnow(),
        case_summary=(
            f"TraceFuse Automated AML Investigation Case Summary for {inv.title}. "
            f"Composite Risk Score: {risk_breakdown.composite_score:.0f}/100 ({risk_breakdown.risk_level.title()}). "
            f"Total volume of ₹{inv.total_flow_amount:,.2f} routed through {len(accounts)} counterparties across {len(transactions)} transactions."
        ),
        entities_involved=[
            {
                "account_id": a.id,
                "holder_name": a.holder_name,
                "account_number": a.account_number,
                "account_type": a.account_type,
            }
            for a in accounts
        ],
        total_amount_involved=inv.total_flow_amount,
        detected_patterns=[p.to_dict() for p in patterns],
        timeline_summary=get_timeline_events(transactions)[:15],
        risk_factors=[
            {
                "category": s.category,
                "score": s.score,
                "weight": s.weight,
                "explanation": s.explanation,
            }
            for s in risk_breakdown.signals
        ],
        money_trail_summary=money_trail,
        investigator_notes=[
            {"user_id": n.user_id, "note": n.note_text, "timestamp": n.created_at.isoformat()}
            for n in notes
        ],
        status_history=[
            {
                "action_type": a.action_type,
                "previous_value": a.previous_value,
                "new_value": a.new_value,
                "user_id": a.user_id,
                "timestamp": a.created_at.isoformat(),
            }
            for a in actions
        ],
        recommended_action=recommended_action,
    )
