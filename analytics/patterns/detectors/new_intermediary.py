"""
New Intermediary Pattern Detector
Detects newly created accounts (<= 7 days old) acting as high-throughput intermediaries.
"""
from typing import List, Dict, Any
from datetime import timedelta, datetime
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import NEW_INTERMEDIARY_MAX_AGE_DAYS


def detect_new_intermediary(
    transactions: List[Any],
    accounts: List[Any] = None,
    **kwargs
) -> List[PatternResult]:
    """Detects newly opened conduit accounts introduced shortly before suspicious transfers."""
    results = []
    if not accounts:
        return results

    # Map account creation date
    acc_map = {}
    for acc in accounts:
        a_id = acc.id if hasattr(acc, 'id') else acc['id']
        c_at = acc.created_at if hasattr(acc, 'created_at') else acc.get('created_at')
        acc_map[a_id] = c_at

    # Find accounts that act as both source and destination in transactions
    incoming_by_acc = defaultdict(list)
    outgoing_by_acc = defaultdict(list)

    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        incoming_by_acc[dst].append(txn)
        outgoing_by_acc[src].append(txn)

    max_age = timedelta(days=NEW_INTERMEDIARY_MAX_AGE_DAYS)

    for acc_id, c_at in acc_map.items():
        if not c_at:
            continue

        # Check if account has incoming and outgoing activity
        in_txs = incoming_by_acc.get(acc_id, [])
        out_txs = outgoing_by_acc.get(acc_id, [])
        
        if in_txs and out_txs:
            earliest_tx = min(
                [t.timestamp if hasattr(t, 'timestamp') else t['timestamp'] for t in in_txs + out_txs]
            )
            
            # Account was created within D days before its first transaction
            if isinstance(c_at, datetime) and isinstance(earliest_tx, datetime):
                age_at_tx = (earliest_tx - c_at).total_seconds() / 86400.0
                if 0 <= age_at_tx <= NEW_INTERMEDIARY_MAX_AGE_DAYS:
                    all_tx_ids = [t.id if hasattr(t, 'id') else t['id'] for t in in_txs + out_txs]
                    days_int = max(1, int(age_at_tx))

                    results.append(PatternResult(
                        pattern_type="new_intermediary",
                        severity="medium",
                        confidence=0.75,
                        entities=[acc_id],
                        transaction_ids=all_tx_ids[:6],
                        evidence=f"Account {acc_id} was opened only {days_int} days prior to routing high-throughput transactions with no prior history.",
                        explanation=(
                            f"New intermediary flag triggered for account {acc_id}. "
                            f"The account was registered {days_int} days prior to actively relaying funds, "
                            f"exhibiting classic 'burner account' characteristics."
                        ),
                        metadata={"account_id": acc_id, "account_age_days": days_int},
                    ))

    return results
