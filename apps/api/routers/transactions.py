"""
Transactions Router
Provides inspection of individual transaction records and counterparties (Section 18 & 19).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import Transaction, Account
from apps.api.schemas import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction_detail(transaction_id: str, db: Session = Depends(get_db)):
    """Fetches details for a single transaction record."""
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")

    src_acc = db.query(Account).filter(Account.id == txn.source_account_id).first()
    dst_acc = db.query(Account).filter(Account.id == txn.destination_account_id).first()

    return TransactionResponse(
        id=txn.id,
        source_account_id=txn.source_account_id,
        destination_account_id=txn.destination_account_id,
        amount=txn.amount,
        currency=txn.currency,
        timestamp=txn.timestamp,
        transaction_type=txn.transaction_type,
        upi_ref=txn.upi_ref,
        is_synthetic=txn.is_synthetic,
        source_holder_name=src_acc.holder_name if src_acc else None,
        destination_holder_name=dst_acc.holder_name if dst_acc else None,
    )
