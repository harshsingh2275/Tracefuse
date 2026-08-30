"""
Temporal Analytics Module
Implements rolling window analysis, burst detection, inter-transaction intervals,
and velocity time-series aggregations (Section 13).
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import pandas as pd
import numpy as np


def compute_account_velocity(
    transactions: List[Any],
    window_minutes: int = 60,
) -> Dict[str, Dict[str, Any]]:
    """Calculates rolling transaction frequency and peak burst window for each account."""
    if not transactions:
        return {}

    by_account = defaultdict(list)
    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        ts = txn.timestamp if hasattr(txn, 'timestamp') else txn['timestamp']
        amt = txn.amount if hasattr(txn, 'amount') else txn['amount']
        
        by_account[src].append((ts, amt, "out"))
        by_account[dst].append((ts, amt, "in"))

    results = {}
    window_delta = timedelta(minutes=window_minutes)

    for acc_id, items in by_account.items():
        sorted_items = sorted(items, key=lambda x: x[0])
        total_txns = len(sorted_items)

        # Find peak burst count within rolling window
        peak_burst_count = 0
        peak_burst_volume = 0.0
        n = len(sorted_items)

        for i in range(n):
            w_count = 0
            w_vol = 0.0
            t_start = sorted_items[i][0]

            for j in range(i, n):
                if sorted_items[j][0] - t_start <= window_delta:
                    w_count += 1
                    w_vol += sorted_items[j][1]
                else:
                    break

            if w_count > peak_burst_count:
                peak_burst_count = w_count
                peak_burst_volume = w_vol

        # Compute intervals
        intervals_mins = []
        for i in range(1, n):
            diff = (sorted_items[i][0] - sorted_items[i - 1][0]).total_seconds() / 60.0
            intervals_mins.append(diff)

        mean_interval = round(float(np.mean(intervals_mins)), 1) if intervals_mins else 0.0
        min_interval = round(float(np.min(intervals_mins)), 1) if intervals_mins else 0.0

        results[acc_id] = {
            "total_transactions": total_txns,
            "peak_burst_count_1hr": peak_burst_count,
            "peak_burst_volume_1hr": round(peak_burst_volume, 2),
            "mean_interval_minutes": mean_interval,
            "min_interval_minutes": min_interval,
            "is_bursty": peak_burst_count >= 5,
        }

    return results


def get_timeline_events(
    transactions: List[Any],
    highlight_bursts: bool = True,
) -> List[Dict[str, Any]]:
    """Generates an ordered timeline event feed with burst annotations."""
    sorted_txns = sorted(transactions, key=lambda t: t.timestamp if hasattr(t, 'timestamp') else t['timestamp'])
    events = []

    for idx, txn in enumerate(sorted_txns):
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        ts = txn.timestamp if hasattr(txn, 'timestamp') else txn['timestamp']
        amt = txn.amount if hasattr(txn, 'amount') else txn['amount']
        tid = txn.id if hasattr(txn, 'id') else txn['id']
        ttype = txn.transaction_type if hasattr(txn, 'transaction_type') else txn.get('transaction_type', 'upi')

        events.append({
            "id": tid,
            "index": idx + 1,
            "timestamp": ts.isoformat() if hasattr(ts, 'isoformat') else str(ts),
            "source_account_id": src,
            "destination_account_id": dst,
            "amount": amt,
            "transaction_type": ttype,
            "is_high_value": amt >= 100000.0,
        })

    return events
