"""
Accounts Router
Provides deep entity inspection and transaction profile for individual accounts (Section 18 & 19).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import Account, AccountDevice, Device, AccountIdentifier, Identifier, Transaction
from apps.api.schemas import AccountSummaryResponse, AccountDeviceResponse, AccountIdentifierResponse

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/{account_id}", response_model=AccountSummaryResponse)
def get_account_detail(account_id: str, db: Session = Depends(get_db)):
    """Fetches full account entity profile, associated hardware devices, identifiers, and transaction history."""
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found.")

    # Devices
    account_devices = db.query(AccountDevice).filter(AccountDevice.account_id == acc.id).all()
    device_ids = [ad.device_id for ad in account_devices]
    devices = db.query(Device).filter(Device.id.in_(device_ids)).all() if device_ids else []
    dev_map = {d.id: d for d in devices}

    devices_res = [
        AccountDeviceResponse(
            device_id=ad.device_id,
            device_fingerprint=dev_map.get(ad.device_id, Device(device_fingerprint="unknown")).device_fingerprint,
            device_type=dev_map.get(ad.device_id, Device(device_type="unknown")).device_type,
            linked_at=ad.linked_at,
        )
        for ad in account_devices
    ]

    # Identifiers
    account_idents = db.query(AccountIdentifier).filter(AccountIdentifier.account_id == acc.id).all()
    ident_ids = [ai.identifier_id for ai in account_idents]
    idents = db.query(Identifier).filter(Identifier.id.in_(ident_ids)).all() if ident_ids else []
    ident_map = {i.id: i for i in idents}

    idents_res = [
        AccountIdentifierResponse(
            identifier_id=ai.identifier_id,
            type=ident_map.get(ai.identifier_id, Identifier(type="unknown")).type,
            value=ident_map.get(ai.identifier_id, Identifier(value="unknown")).value,
            linked_at=ai.linked_at,
        )
        for ai in account_idents
    ]

    # Transactions
    outgoing = db.query(Transaction).filter(Transaction.source_account_id == acc.id).all()
    incoming = db.query(Transaction).filter(Transaction.destination_account_id == acc.id).all()

    total_inflow = sum(t.amount for t in incoming)
    total_outflow = sum(t.amount for t in outgoing)
    all_txs = sorted(outgoing + incoming, key=lambda t: t.timestamp, reverse=True)

    recent_txs = [
        {
            "id": t.id,
            "direction": "outflow" if t.source_account_id == acc.id else "inflow",
            "counterparty": t.destination_account_id if t.source_account_id == acc.id else t.source_account_id,
            "amount": t.amount,
            "currency": t.currency,
            "timestamp": t.timestamp.isoformat(),
            "transaction_type": t.transaction_type,
            "upi_ref": t.upi_ref,
        }
        for t in all_txs[:20]
    ]

    return AccountSummaryResponse(
        id=acc.id,
        account_number=acc.account_number,
        holder_name=acc.holder_name,
        account_type=acc.account_type,
        created_at=acc.created_at,
        is_synthetic=acc.is_synthetic,
        devices=devices_res,
        identifiers=idents_res,
        total_inflow=round(total_inflow, 2),
        total_outflow=round(total_outflow, 2),
        transaction_count=len(all_txs),
        recent_transactions=recent_txs,
    )
