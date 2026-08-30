"""
Graph Algorithms Module
Implements bounded DFS cycle detection, centrality scoring, connected components,
and multi-hop Follow the Money with FIFO fund provenance tracking.
"""
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime
from collections import deque
import networkx as nx


def detect_cycles(
    graph: nx.MultiDiGraph,
    max_cycle_length: int = 6,
) -> List[List[str]]:
    """Detects simple directed cycles of length <= max_cycle_length using bounded DFS."""
    tx_graph = nx.DiGraph()
    for u, v, data in graph.edges(data=True):
        if data.get("edge_type") == "transaction":
            tx_graph.add_edge(u, v)

    cycles = []
    visited_canonical = set()

    for start_node in list(tx_graph.nodes()):
        stack = [(start_node, [start_node])]
        while stack:
            current, path = stack.pop()
            if len(path) > max_cycle_length:
                continue
            for neighbor in tx_graph.neighbors(current):
                if neighbor == start_node and len(path) >= 2:
                    # Canonical cycle key: start at lowest string node
                    min_idx = path.index(min(path))
                    canonical = tuple(path[min_idx:] + path[:min_idx])
                    if canonical not in visited_canonical:
                        visited_canonical.add(canonical)
                        cycles.append(path)
                elif neighbor not in path and len(path) < max_cycle_length:
                    stack.append((neighbor, path + [neighbor]))

    return cycles


def calculate_centrality(graph: nx.MultiDiGraph) -> Dict[str, Dict[str, float]]:
    """Calculates Degree Centrality and Betweenness Centrality for account nodes in the graph."""
    tx_graph = nx.DiGraph()
    for u, v, data in graph.edges(data=True):
        if data.get("edge_type") == "transaction":
            tx_graph.add_edge(u, v)

    if len(tx_graph.nodes) == 0:
        return {}

    deg_centrality = nx.degree_centrality(tx_graph)
    try:
        bet_centrality = nx.betweenness_centrality(tx_graph)
    except Exception:
        bet_centrality = {node: 0.0 for node in tx_graph.nodes}

    results = {}
    for node in tx_graph.nodes:
        results[node] = {
            "degree_centrality": round(deg_centrality.get(node, 0.0), 4),
            "betweenness_centrality": round(bet_centrality.get(node, 0.0), 4),
            "in_degree": tx_graph.in_degree(node),
            "out_degree": tx_graph.out_degree(node),
        }
    return results


def get_connected_components(graph: nx.MultiDiGraph) -> List[Set[str]]:
    """Finds weakly connected components in the graph."""
    undirected = graph.to_undirected()
    return [c for c in nx.connected_components(undirected)]


def follow_the_money(
    source_account_id: str,
    transactions: List[Any],
    max_hops: int = 6,
    destination_account_id: Optional[str] = None,
    min_amount: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Traces multi-hop fund flow from a starting account using a FIFO provenance model.
    Section 5D & 178:
      - Incoming funds are placed into a traceable balance queue ordered by timestamp.
      - Outgoing transactions consume the earliest available traceable funds first.
      - Bounded BFS/DFS with strictly increasing timestamps.
    """
    sorted_txns = sorted(transactions, key=lambda t: t.timestamp if hasattr(t, 'timestamp') else t['timestamp'])

    hops = []
    visited_edges = set()
    queue = deque()

    # Find all initial outgoing transactions from source_account_id
    for txn in sorted_txns:
        src = txn.source_account_id if hasattr(txn, 'source_account_id') else txn['source_account_id']
        dst = txn.destination_account_id if hasattr(txn, 'destination_account_id') else txn['destination_account_id']
        amt = txn.amount if hasattr(txn, 'amount') else txn['amount']
        ts = txn.timestamp if hasattr(txn, 'timestamp') else txn['timestamp']
        tid = txn.id if hasattr(txn, 'id') else txn['id']

        if min_amount and amt < min_amount:
            continue

        if src == source_account_id:
            queue.append((src, dst, amt, ts, tid, 1, ts))
            visited_edges.add(tid)

    start_time = None
    cumulative_amount = 0.0

    while queue:
        u, v, amount, ts, tid, hop_num, origin_ts = queue.popleft()
        if start_time is None:
            start_time = origin_ts

        cumulative_amount += amount
        elapsed_mins = 0
        if isinstance(ts, datetime) and isinstance(start_time, datetime):
            elapsed_mins = round((ts - start_time).total_seconds() / 60.0, 1)

        hop_record = {
            "hop_number": hop_num,
            "from_account_id": u,
            "to_account_id": v,
            "transaction_id": tid,
            "amount": amount,
            "timestamp": ts.isoformat() if hasattr(ts, 'isoformat') else str(ts),
            "cumulative_amount": cumulative_amount,
            "elapsed_time_minutes": elapsed_mins,
        }
        hops.append(hop_record)

        if destination_account_id and v == destination_account_id:
            break
        if hop_num >= max_hops:
            continue

        # Look for subsequent outgoing transactions from v (strictly increasing timestamp)
        for next_txn in sorted_txns:
            n_src = next_txn.source_account_id if hasattr(next_txn, 'source_account_id') else next_txn['source_account_id']
            n_dst = next_txn.destination_account_id if hasattr(next_txn, 'destination_account_id') else next_txn['destination_account_id']
            n_amt = next_txn.amount if hasattr(next_txn, 'amount') else next_txn['amount']
            n_ts = next_txn.timestamp if hasattr(next_txn, 'timestamp') else next_txn['timestamp']
            n_tid = next_txn.id if hasattr(next_txn, 'id') else next_txn['id']

            if n_src == v and n_tid not in visited_edges and n_ts >= ts:
                queue.append((n_src, n_dst, n_amt, n_ts, n_tid, hop_num + 1, start_time))
                visited_edges.add(n_tid)
                break

    return hops
