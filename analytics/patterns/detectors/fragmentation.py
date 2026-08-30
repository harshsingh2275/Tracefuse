"""
Fragmentation / Smurfing Pattern Detector
Detects structured transfers where a transfer is split into K >= 4 smaller transactions
to the same destination within a 15-minute rolling window.
"""
from typing import List, Dict, Any
from datetime import timedelta
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import FRAGMENTATION_MIN_COUNT, FRAGMENTATION_WINDOW_MINUTES


def detect_fragmentation(transactions: List[Any], **kwargs) -> List[PatternResult]:
    """Detects structuring / fragmentation across transaction pairs."""
    results = []

    # Group by (source, destination) pair
    pairs = defaultdict(list)
    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        pairs[(src, dst)].append(txn)

    window_delta = timedelta(minutes=FRAGMENTATION_WINDOW_MINUTES)

    for (src_id, dst_id), tx_list in pairs.items():
        if len(tx_list) < FRAGMENTATION_MIN_COUNT:
            continue

        sorted_txs = sorted(tx_list, key=lambda t: t.timestamp if hasattr(t, 'timestamp') else t['timestamp'])
        n = len(sorted_txs)

        for i in range(n):
            window_txs = [sorted_txs[i]]
            t_start = sorted_txs[i].timestamp if hasattr(sorted_txs[i], 'timestamp') else sorted_txs[i]['timestamp']

            for j in range(i + 1, n):
                t_curr = sorted_txs[j].timestamp if hasattr(sorted_txs[j], 'timestamp') else sorted_txs[j]['timestamp']
                if t_curr - t_start <= window_delta:
                    window_txs.append(sorted_txs[j])
                else:
                    break

            if len(window_txs) >= FRAGMENTATION_MIN_COUNT:
                t_end = window_txs[-1].timestamp if hasattr(window_txs[-1], 'timestamp') else window_txs[-1]['timestamp']
                elapsed_mins = max(1, int((t_end - t_start).total_seconds() / 60))
                total_amt = sum(t.amount if hasattr(t, 'amount') else t['amount'] for t in window_txs)
                txn_ids = [t.id if hasattr(t, 'id') else t['id'] for t in window_txs]

                results.append(PatternResult(
                    pattern_type="fragmentation",
                    severity="medium",
                    confidence=min(1.0, 0.70 + (len(window_txs) - FRAGMENTATION_MIN_COUNT) * 0.05),
                    entities=[src_id, dst_id],
                    transaction_ids=txn_ids,
                    evidence=(
                        f"Multiple transfers totaling ~₹{total_amt:,.2f} were sent to the same destination "
                        f"through {len(window_txs)} smaller transactions within {elapsed_mins} minutes, "
                        f"indicating a potential fragmentation pattern."
                    ),
                    explanation=(
                        f"Structured smurfing detected between {src_id} and {dst_id}. "
                        f"A total volume of ₹{total_amt:,.2f} was divided into {len(window_txs)} consecutive transfers "
                        f"within {elapsed_mins} minutes to avoid single-transaction threshold triggers."
                    ),
                    metadata={"source": src_id, "destination": dst_id, "count": len(window_txs), "total_amount": total_amt},
                ))
                break

    return results
