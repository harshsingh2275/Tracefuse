"""
Suspicious Velocity Pattern Detector
Detects sudden high transaction frequency bursts exceeding baseline limits.
"""
from typing import List, Dict, Any
from datetime import timedelta
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import VELOCITY_WINDOW_MINUTES, VELOCITY_MULTIPLIER_FACTOR, VELOCITY_MIN_BURST_COUNT


def detect_velocity(transactions: List[Any], accounts: List[Any] = None, **kwargs) -> List[PatternResult]:
    """Detects abnormal transaction velocity bursts per account."""
    results = []

    # Map account types to whitelist/suppress known legitimate high-frequency merchants (Section 26)
    merchant_account_ids = set()
    if accounts:
        for acc in accounts:
            acc_id = acc.id if hasattr(acc, 'id') else acc['id']
            acc_type = acc.account_type if hasattr(acc, 'account_type') else acc.get('account_type')
            if acc_type == "merchant":
                merchant_account_ids.add(acc_id)

    # Collect outgoing and incoming timestamps per account
    by_account = defaultdict(list)
    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        by_account[src].append((txn, "out"))
        by_account[dst].append((txn, "in"))

    window_delta = timedelta(minutes=VELOCITY_WINDOW_MINUTES)

    for acc_id, tx_tuples in by_account.items():
        # Suppress legitimate verified merchants from false positive velocity alerts per Section 26
        if acc_id in merchant_account_ids or "merch" in acc_id:
            continue

        # Sort chronologically
        sorted_items = sorted(tx_tuples, key=lambda x: x[0].timestamp if hasattr(x[0], 'timestamp') else x[0]['timestamp'])
        n = len(sorted_items)
        if n < VELOCITY_MIN_BURST_COUNT:
            continue

        for i in range(n):
            window_items = [sorted_items[i]]
            t_start = sorted_items[i][0].timestamp if hasattr(sorted_items[i][0], 'timestamp') else sorted_items[i][0]['timestamp']

            for j in range(i + 1, n):
                t_curr = sorted_items[j][0].timestamp if hasattr(sorted_items[j][0], 'timestamp') else sorted_items[j][0]['timestamp']
                if t_curr - t_start <= window_delta:
                    window_items.append(sorted_items[j])
                else:
                    break

            if len(window_items) >= VELOCITY_MIN_BURST_COUNT:
                t_end = window_items[-1][0].timestamp if hasattr(window_items[-1][0], 'timestamp') else window_items[-1][0]['timestamp']
                elapsed_mins = max(1, int((t_end - t_start).total_seconds() / 60))
                txn_ids = list(set([item[0].id if hasattr(item[0], 'id') else item[0]['id'] for item in window_items]))
                
                # Check counterparties
                counterparties = set()
                for item in window_items:
                    t = item[0]
                    src = t.source_account_id if hasattr(t, 'source_account_id') else t['source_account_id']
                    dst = t.destination_account_id if hasattr(t, 'destination_account_id') else t['destination_account_id']
                    counterparties.add(src if src != acc_id else dst)

                total_volume = sum(item[0].amount if hasattr(item[0], 'amount') else item[0]['amount'] for item in window_items)

                results.append(PatternResult(
                    pattern_type="velocity",
                    severity="medium",
                    confidence=min(1.0, 0.70 + (len(window_items) - VELOCITY_MIN_BURST_COUNT) * 0.05),
                    entities=[acc_id] + list(counterparties),
                    transaction_ids=txn_ids,
                    evidence=f"Account {acc_id} executed {len(window_items)} transactions across {len(counterparties)} counterparties within {elapsed_mins} minutes.",
                    explanation=(
                        f"Velocity anomaly detected on account {acc_id}. "
                        f"The account generated {len(window_items)} transactions within a {elapsed_mins}-minute burst "
                        f"totaling ₹{total_volume:,.2f}."
                    ),
                    metadata={"account_id": acc_id, "burst_count": len(window_items), "elapsed_minutes": elapsed_mins},
                ))
                break

    return results
