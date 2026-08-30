"""
Rapid Pass-Through Pattern Detector
Detects accounts receiving funds and forwarding >= 80% onward within 10 minutes.
"""
from typing import List, Dict, Any
from datetime import timedelta
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import RAPID_PASSTHROUGH_MIN_RATIO, RAPID_PASSTHROUGH_MAX_MINUTES


def detect_rapid_pass_through(transactions: List[Any], **kwargs) -> List[PatternResult]:
    """Detects rapid in-and-out pass-through behavior indicating intermediary conduit behavior."""
    results = []

    # Map incoming and outgoing per account
    incoming_by_acc = defaultdict(list)
    outgoing_by_acc = defaultdict(list)

    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        incoming_by_acc[dst].append(txn)
        outgoing_by_acc[src].append(txn)

    max_window = timedelta(minutes=RAPID_PASSTHROUGH_MAX_MINUTES)

    for acc_id, in_txs in incoming_by_acc.items():
        out_txs = outgoing_by_acc.get(acc_id, [])
        if not out_txs:
            continue

        for in_tx in in_txs:
            in_amt = in_tx.amount if hasattr(in_tx, 'amount') else in_tx['amount']
            in_ts = in_tx.timestamp if hasattr(in_tx, 'timestamp') else in_tx['timestamp']
            in_id = in_tx.id if hasattr(in_tx, 'id') else in_tx['id']

            matched_out_txs = []
            forwarded_amount = 0.0

            for out_tx in out_txs:
                out_ts = out_tx.timestamp if hasattr(out_tx, 'timestamp') else out_tx['timestamp']
                out_amt = out_tx.amount if hasattr(out_tx, 'amount') else out_tx['amount']
                
                # Check if outgoing occurred after incoming and within window
                if in_ts <= out_ts <= in_ts + max_window:
                    matched_out_txs.append(out_tx)
                    forwarded_amount += out_amt

            ratio = forwarded_amount / in_amt if in_amt > 0 else 0.0

            if ratio >= RAPID_PASSTHROUGH_MIN_RATIO:
                ratio_pct = min(100.0, round(ratio * 100, 1))
                out_ids = [t.id if hasattr(t, 'id') else t['id'] for t in matched_out_txs]
                all_tx_ids = [in_id] + out_ids
                
                # Find counterparties
                sources = [in_tx.source_account_id if hasattr(in_tx, 'source_account_id') else in_tx['source_account_id']]
                destinations = [t.destination_account_id if hasattr(t, 'destination_account_id') else t['destination_account_id'] for t in matched_out_txs]
                involved_entities = list(set([acc_id] + sources + destinations))

                time_diff_mins = max(1, int(((matched_out_txs[0].timestamp if hasattr(matched_out_txs[0], 'timestamp') else matched_out_txs[0]['timestamp']) - in_ts).total_seconds() / 60))

                results.append(PatternResult(
                    pattern_type="rapid_pass_through",
                    severity="high",
                    confidence=min(1.0, 0.75 + (ratio - 0.80) * 0.5),
                    entities=involved_entities,
                    transaction_ids=all_tx_ids,
                    evidence=f"Account {acc_id} forwarded {ratio_pct}% of received funds (₹{forwarded_amount:,.2f} of ₹{in_amt:,.2f}) within {time_diff_mins} minutes.",
                    explanation=(
                        f"Rapid pass-through conduit activity detected on account {acc_id}. "
                        f"The account received ₹{in_amt:,.2f} and immediately transferred {ratio_pct}% onward "
                        f"within {time_diff_mins} minutes, maintaining negligible holding duration."
                    ),
                    metadata={
                        "account_id": acc_id,
                        "in_amount": in_amt,
                        "forwarded_amount": forwarded_amount,
                        "ratio": ratio,
                        "elapsed_minutes": time_diff_mins,
                    },
                ))

    return results
