"""
Fan-In Pattern Detector
Detects N >= 5 distinct source accounts sending funds to 1 destination account
within a rolling window of W minutes.
"""
from typing import List, Dict, Any
from datetime import timedelta
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import FAN_IN_MIN_SOURCES, FAN_IN_WINDOW_MINUTES


def detect_fan_in(transactions: List[Any], **kwargs) -> List[PatternResult]:
    """Detects rapid fund aggregation from multiple sources into a single destination."""
    results = []
    
    # Group incoming transactions by destination account
    by_dest = defaultdict(list)
    for txn in transactions:
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        by_dest[dst].append(txn)

    window_delta = timedelta(minutes=FAN_IN_WINDOW_MINUTES)

    for dst_id, tx_list in by_dest.items():
        if len(tx_list) < FAN_IN_MIN_SOURCES:
            continue

        sorted_txs = sorted(tx_list, key=lambda t: t.timestamp if hasattr(t, 'timestamp') else t['timestamp'])
        
        n = len(sorted_txs)
        for i in range(n):
            window_txs = [sorted_txs[i]]
            sources = {sorted_txs[i].source_account_id if hasattr(sorted_txs[i], 'source_account_id') else sorted_txs[i]['source_account_id']}
            t_start = sorted_txs[i].timestamp if hasattr(sorted_txs[i], 'timestamp') else sorted_txs[i]['timestamp']
            
            for j in range(i + 1, n):
                t_curr = sorted_txs[j].timestamp if hasattr(sorted_txs[j], 'timestamp') else sorted_txs[j]['timestamp']
                if t_curr - t_start <= window_delta:
                    src = sorted_txs[j].source_account_id if hasattr(sorted_txs[j], 'source_account_id') else sorted_txs[j]['source_account_id']
                    sources.add(src)
                    window_txs.append(sorted_txs[j])
                else:
                    break

            if len(sources) >= FAN_IN_MIN_SOURCES:
                t_end = window_txs[-1].timestamp if hasattr(window_txs[-1], 'timestamp') else window_txs[-1]['timestamp']
                elapsed_mins = max(1, int((t_end - t_start).total_seconds() / 60))
                txn_ids = [t.id if hasattr(t, 'id') else t['id'] for t in window_txs]
                involved_entities = list(sources) + [dst_id]
                total_amt = sum(t.amount if hasattr(t, 'amount') else t['amount'] for t in window_txs)

                results.append(PatternResult(
                    pattern_type="fan_in",
                    severity="high",
                    confidence=min(1.0, 0.7 + (len(sources) - FAN_IN_MIN_SOURCES) * 0.05),
                    entities=involved_entities,
                    transaction_ids=txn_ids,
                    evidence=f"Account {dst_id} received ₹{total_amt:,.2f} from {len(sources)} distinct accounts within {elapsed_mins} minutes.",
                    explanation=(
                        f"A fan-in aggregation pattern was detected where account {dst_id} received incoming transfers "
                        f"from {len(sources)} different sources within {elapsed_mins} minutes. "
                        f"This pattern is commonly associated with collection/funnel accounts consolidating illicit funds."
                    ),
                    metadata={"destination": dst_id, "sources_count": len(sources), "window_minutes": elapsed_mins},
                ))
                break

    return results
