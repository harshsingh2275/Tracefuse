"""
Fan-Out Pattern Detector
Detects 1 source account sending funds to N >= 5 distinct destination accounts
within a rolling window of W minutes.
"""
from typing import List, Dict, Any
from datetime import timedelta
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import FAN_OUT_MIN_DESTINATIONS, FAN_OUT_WINDOW_MINUTES


def detect_fan_out(transactions: List[Any], **kwargs) -> List[PatternResult]:
    """Detects rapid fund dispersion from one source to multiple distinct destinations."""
    results = []
    
    # Group outgoing transactions by source account
    by_source = defaultdict(list)
    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        by_source[src].append(txn)

    window_delta = timedelta(minutes=FAN_OUT_WINDOW_MINUTES)

    for src_id, tx_list in by_source.items():
        if len(tx_list) < FAN_OUT_MIN_DESTINATIONS:
            continue

        sorted_txs = sorted(tx_list, key=lambda t: t.timestamp if hasattr(t, 'timestamp') else t['timestamp'])
        
        # Sliding window over transactions
        n = len(sorted_txs)
        for i in range(n):
            window_txs = [sorted_txs[i]]
            destinations = {sorted_txs[i].destination_account_id if hasattr(sorted_txs[i], 'destination_account_id') else sorted_txs[i]['destination_account_id']}
            
            t_start = sorted_txs[i].timestamp if hasattr(sorted_txs[i], 'timestamp') else sorted_txs[i]['timestamp']
            
            for j in range(i + 1, n):
                t_curr = sorted_txs[j].timestamp if hasattr(sorted_txs[j], 'timestamp') else sorted_txs[j]['timestamp']
                if t_curr - t_start <= window_delta:
                    dst = sorted_txs[j].destination_account_id if hasattr(sorted_txs[j], 'destination_account_id') else sorted_txs[j]['destination_account_id']
                    destinations.add(dst)
                    window_txs.append(sorted_txs[j])
                else:
                    break

            if len(destinations) >= FAN_OUT_MIN_DESTINATIONS:
                t_end = window_txs[-1].timestamp if hasattr(window_txs[-1], 'timestamp') else window_txs[-1]['timestamp']
                elapsed_mins = max(1, int((t_end - t_start).total_seconds() / 60))
                txn_ids = [t.id if hasattr(t, 'id') else t['id'] for t in window_txs]
                involved_entities = [src_id] + list(destinations)
                total_amt = sum(t.amount if hasattr(t, 'amount') else t['amount'] for t in window_txs)

                results.append(PatternResult(
                    pattern_type="fan_out",
                    severity="high",
                    confidence=min(1.0, 0.7 + (len(destinations) - FAN_OUT_MIN_DESTINATIONS) * 0.05),
                    entities=involved_entities,
                    transaction_ids=txn_ids,
                    evidence=f"Account {src_id} sent ₹{total_amt:,.2f} to {len(destinations)} distinct accounts within {elapsed_mins} minutes.",
                    explanation=(
                        f"A fan-out pattern was detected where account {src_id} rapidly disbursed funds "
                        f"to {len(destinations)} destination accounts within {elapsed_mins} minutes. "
                        f"This behavior is characteristic of money muling distribution and layering networks."
                    ),
                    metadata={"source": src_id, "destinations_count": len(destinations), "window_minutes": elapsed_mins},
                ))
                # Skip to end of window to avoid duplicate partial sub-windows
                break

    return results
