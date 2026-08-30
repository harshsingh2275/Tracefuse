"""
Circular Movement Pattern Detector
Detects directed cycles in the transaction graph where funds return to originators
after passing through intermediary accounts.
"""
from typing import List, Dict, Any
from datetime import timedelta
import networkx as nx
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import CIRCULAR_MAX_CYCLE_LENGTH, CIRCULAR_WINDOW_HOURS


def detect_circular_movement(transactions: List[Any], **kwargs) -> List[PatternResult]:
    """Detects cycles in fund movement topology within the time window."""
    results = []

    # Build directed transaction graph with edge timestamps
    tx_graph = nx.DiGraph()
    tx_by_edge = {}

    for txn in transactions:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        ts = txn.timestamp if hasattr(txn, 'timestamp') else txn['timestamp']
        tid = txn.id if hasattr(txn, 'id') else txn['id']
        amt = txn.amount if hasattr(txn, 'amount') else txn['amount']

        tx_graph.add_edge(src, dst)
        if (src, dst) not in tx_by_edge:
            tx_by_edge[(src, dst)] = []
        tx_by_edge[(src, dst)].append((tid, ts, amt))

    # Bounded DFS cycle detection (depth <= CIRCULAR_MAX_CYCLE_LENGTH)
    cycles = []
    visited_canonical = set()

    for start_node in list(tx_graph.nodes()):
        stack = [(start_node, [start_node])]
        while stack:
            current, path = stack.pop()
            if len(path) > CIRCULAR_MAX_CYCLE_LENGTH:
                continue
            for neighbor in tx_graph.neighbors(current):
                if neighbor == start_node and len(path) >= 2:
                    min_idx = path.index(min(path))
                    canonical = tuple(path[min_idx:] + path[:min_idx])
                    if canonical not in visited_canonical:
                        visited_canonical.add(canonical)
                        cycles.append(path)
                elif neighbor not in path and len(path) < CIRCULAR_MAX_CYCLE_LENGTH:
                    stack.append((neighbor, path + [neighbor]))

    window_delta = timedelta(hours=CIRCULAR_WINDOW_HOURS)

    for cycle in cycles:
        cycle_tx_ids = []
        cycle_timestamps = []
        cycle_amounts = []
        valid_cycle = True

        for i in range(len(cycle)):
            u = cycle[i]
            v = cycle[(i + 1) % len(cycle)]
            edge_txs = tx_by_edge.get((u, v), [])
            if not edge_txs:
                valid_cycle = False
                break
            chosen = edge_txs[0]
            cycle_tx_ids.append(chosen[0])
            cycle_timestamps.append(chosen[1])
            cycle_amounts.append(chosen[2])

        if not valid_cycle:
            continue

        t_min = min(cycle_timestamps)
        t_max = max(cycle_timestamps)

        if t_max - t_min <= window_delta:
            cycle_str = " -> ".join(cycle) + " -> " + cycle[0]
            intermediary_count = len(cycle) - 1
            total_cycle_amt = sum(cycle_amounts)

            results.append(PatternResult(
                pattern_type="circular_movement",
                severity="critical",
                confidence=0.95,
                entities=list(cycle),
                transaction_ids=cycle_tx_ids,
                evidence=f"Funds returned to originating entity after passing through {intermediary_count} intermediaries ({cycle_str}).",
                explanation=(
                    f"A closed circular transaction loop was identified: {cycle_str}. "
                    f"Funds completed a full cycle across {len(cycle)} hops with total flow of ₹{total_cycle_amt:,.2f}. "
                    f"Circular fund movement without clear commercial rationale is a high-confidence indicator of layering or round-tripping."
                ),
                metadata={"cycle_nodes": cycle, "hops": len(cycle), "time_span_hours": round((t_max - t_min).total_seconds() / 3600, 1)},
            ))

    return results
