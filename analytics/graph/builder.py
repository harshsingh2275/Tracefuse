"""
Graph Builder Module
Constructs NetworkX directed multi-graphs from database entities and transactions.
Serializes graph subsets into React Flow JSON payloads.
"""
from typing import List, Dict, Any, Optional
import networkx as nx
from sqlalchemy.orm import Session
from apps.api.models import (
    Account,
    Entity,
    AccountEntity,
    Device,
    AccountDevice,
    Identifier,
    AccountIdentifier,
    Transaction,
    Investigation,
    InvestigationEntity,
)


def build_networkx_graph(
    transactions: List[Transaction],
    accounts: Optional[List[Account]] = None,
    devices: Optional[List[Device]] = None,
    account_devices: Optional[List[AccountDevice]] = None,
    identifiers: Optional[List[Identifier]] = None,
    account_identifiers: Optional[List[AccountIdentifier]] = None,
    entities: Optional[List[Entity]] = None,
    account_entities: Optional[List[AccountEntity]] = None,
) -> nx.MultiDiGraph:
    """Builds a rich NetworkX MultiDiGraph representing entities, accounts, hardware, and transfers."""
    G = nx.MultiDiGraph()

    # 1. Add Accounts
    if accounts:
        for acc in accounts:
            G.add_node(
                acc.id,
                id=acc.id,
                label=acc.holder_name,
                node_type="account",
                account_number=acc.account_number,
                account_type=acc.account_type,
                created_at=acc.created_at.isoformat() if acc.created_at else None,
                is_synthetic=acc.is_synthetic,
            )

    # 2. Add Entities (Person, Merchant, Beneficiary)
    if entities:
        for ent in entities:
            G.add_node(
                ent.id,
                id=ent.id,
                label=ent.name,
                node_type=ent.type,
                metadata_json=ent.metadata_json or {},
            )

    # 3. Add Entity <-> Account Edges
    if account_entities:
        for ae in account_entities:
            G.add_edge(
                ae.entity_id,
                ae.account_id,
                key=f"rel_{ae.entity_id}_{ae.account_id}",
                edge_type=ae.relationship_type or "owns",
                label=ae.relationship_type or "owns",
            )

    # 4. Add Devices
    if devices:
        for dev in devices:
            G.add_node(
                dev.id,
                id=dev.id,
                label=dev.device_fingerprint[:14] + "...",
                node_type="device",
                device_fingerprint=dev.device_fingerprint,
                device_type=dev.device_type,
            )

    # 5. Add Account <-> Device Edges
    if account_devices:
        for ad in account_devices:
            G.add_edge(
                ad.account_id,
                ad.device_id,
                key=f"dev_{ad.account_id}_{ad.device_id}",
                edge_type="uses",
                label="uses_device",
                linked_at=ad.linked_at.isoformat() if ad.linked_at else None,
            )

    # 6. Add Identifiers (Phone, UPI, Email)
    if identifiers:
        for ident in identifiers:
            G.add_node(
                ident.id,
                id=ident.id,
                label=ident.value,
                node_type="identifier",
                identifier_type=ident.type,
                value=ident.value,
            )

    # 7. Add Account <-> Identifier Edges
    if account_identifiers:
        for ai in account_identifiers:
            G.add_edge(
                ai.account_id,
                ai.identifier_id,
                key=f"ident_{ai.account_id}_{ai.identifier_id}",
                edge_type="linked_to",
                label="linked_to",
            )

    # 8. Add Transaction Edges (Money Flow)
    for txn in transactions:
        # Ensure source and destination nodes exist
        if not G.has_node(txn.source_account_id):
            G.add_node(txn.source_account_id, id=txn.source_account_id, label=txn.source_account_id, node_type="account")
        if not G.has_node(txn.destination_account_id):
            G.add_node(txn.destination_account_id, id=txn.destination_account_id, label=txn.destination_account_id, node_type="account")

        G.add_edge(
            txn.source_account_id,
            txn.destination_account_id,
            key=txn.id,
            transaction_id=txn.id,
            edge_type="transaction",
            amount=txn.amount,
            currency=txn.currency,
            timestamp=txn.timestamp.isoformat() if txn.timestamp else None,
            raw_timestamp=txn.timestamp,
            transaction_type=txn.transaction_type,
            upi_ref=txn.upi_ref,
        )

    return G


def get_investigation_graph_payload(investigation_id: str, db: Session) -> Dict[str, Any]:
    """Extracts the scoped subgraph for an investigation and serializes it for React Flow rendering."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return {"nodes": [], "edges": []}

    # Get accounts in scope
    inv_entities = db.query(InvestigationEntity).filter(InvestigationEntity.investigation_id == investigation_id).all()
    account_ids = [ie.account_id for ie in inv_entities]

    if not account_ids:
        return {"nodes": [], "edges": []}

    accounts = db.query(Account).filter(Account.id.in_(account_ids)).all()

    # Get all transactions between or involving these accounts within the investigation window
    transactions = db.query(Transaction).filter(
        (Transaction.source_account_id.in_(account_ids)) | (Transaction.destination_account_id.in_(account_ids))
    ).filter(
        Transaction.timestamp >= inv.time_window_start,
        Transaction.timestamp <= inv.time_window_end,
    ).all()

    # Get linked devices, entities, and identifiers
    account_devices = db.query(AccountDevice).filter(AccountDevice.account_id.in_(account_ids)).all()
    device_ids = [ad.device_id for ad in account_devices]
    devices = db.query(Device).filter(Device.id.in_(device_ids)).all() if device_ids else []

    account_entities = db.query(AccountEntity).filter(AccountEntity.account_id.in_(account_ids)).all()
    entity_ids = [ae.entity_id for ae in account_entities]
    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all() if entity_ids else []

    account_identifiers = db.query(AccountIdentifier).filter(AccountIdentifier.account_id.in_(account_ids)).all()
    identifier_ids = [ai.identifier_id for ai in account_identifiers]
    identifiers = db.query(Identifier).filter(Identifier.id.in_(identifier_ids)).all() if identifier_ids else []

    # Build NetworkX Graph
    G = build_networkx_graph(
        transactions=transactions,
        accounts=accounts,
        devices=devices,
        account_devices=account_devices,
        identifiers=identifiers,
        account_identifiers=account_identifiers,
        entities=entities,
        account_entities=account_entities,
    )

    # Format nodes for React Flow
    nodes = []
    edges = []

    # Layout position generator (hierarchical / radial fallback)
    for idx, (node_id, attrs) in enumerate(G.nodes(data=True)):
        node_type = attrs.get("node_type", "account")
        label = attrs.get("label", node_id)
        
        # Risk level determination based on investigation severity
        severity = "normal"
        if node_type == "account":
            if inv.risk_level == "critical":
                severity = "critical" if "mule" in node_id or "origin" in node_id or "cyc" in node_id else "suspicious"
            elif inv.risk_level == "high":
                severity = "suspicious"

        nodes.append({
            "id": node_id,
            "type": node_type,
            "data": {
                "label": label,
                "nodeType": node_type,
                "severity": severity,
                **attrs,
            },
            "position": {
                "x": 120 + (idx % 4) * 220,
                "y": 100 + (idx // 4) * 160,
            },
        })

    # Format edges for React Flow
    for u, v, key, data in G.edges(keys=True, data=True):
        edge_type = data.get("edge_type", "transaction")
        amount = data.get("amount", 0.0)
        edges.append({
            "id": str(key),
            "source": u,
            "target": v,
            "type": "customTransactionEdge" if edge_type == "transaction" else "default",
            "animated": edge_type == "transaction" and amount > 50000,
            "data": {
                "edgeType": edge_type,
                "amount": amount,
                "currency": data.get("currency", "INR"),
                "timestamp": data.get("timestamp"),
                "transactionId": data.get("transaction_id"),
                "label": f"₹{amount:,.0f}" if edge_type == "transaction" else data.get("label", ""),
            },
        })

    return {"nodes": nodes, "edges": edges}
