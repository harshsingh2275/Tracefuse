"""
Dashboard Router
Provides aggregate metrics for the investigation dashboard (Section 6 & 18).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from apps.api.database import get_db
from apps.api.models import Investigation, Account, Transaction, InvestigationEntity
from apps.api.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Fetches high-level metrics for the operations overview cockpit."""
    try:
        # Total suspicious networks (investigations created)
        suspicious_networks = db.query(Investigation).count()

        # High risk / Critical accounts in investigations
        high_risk_inv_ids = [r[0] for r in db.query(Investigation.id).filter(Investigation.risk_level.in_(["high", "critical"])).all()]
        high_risk_accounts = (
            db.query(InvestigationEntity.account_id)
            .filter(InvestigationEntity.investigation_id.in_(high_risk_inv_ids))
            .distinct()
            .count()
            if high_risk_inv_ids
            else 0
        )

        # Flagged transactions (transactions linked to fraud scenarios)
        flagged_transactions = db.query(Transaction).filter(
            ~Transaction.id.like("txn_norm_%"),
            ~Transaction.id.like("txn_merch_%"),
        ).count()

        # Total amount under investigation (sum of active investigation flows)
        total_amount = db.query(func.sum(Investigation.total_flow_amount)).scalar() or 0.0

        # Active investigations (status in ['new', 'investigating'])
        active_investigations = db.query(Investigation).filter(
            Investigation.status.in_(["new", "investigating"])
        ).count()

        # Escalated cases
        escalated_cases = db.query(Investigation).filter(
            Investigation.status == "escalated"
        ).count()

        return DashboardSummaryResponse(
            suspicious_networks=suspicious_networks,
            high_risk_accounts=high_risk_accounts,
            flagged_transactions=flagged_transactions,
            amount_under_investigation=round(total_amount, 2),
            active_investigations=active_investigations,
            escalated_cases=escalated_cases,
        )
    except Exception as e:
        print(f"[DashboardRouter] Error fetching summary: {e}")
        raise HTTPException(status_code=500, detail="Database error calculating dashboard metrics.")
