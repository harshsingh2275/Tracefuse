"""
TraceFuse Deterministic Synthetic Data Generator
Generates all 9 scenarios per Section 9, 26, & 27 of task.md:
  1. Normal customers (Benign ~32 accounts)
  2. Normal high-frequency business (Benign merchant)
  3. Fan-out fraud network
  4. Layered money movement
  5. Circular transaction network
  6. Shared-device mule network
  7. Rapid pass-through accounts
  8. Transaction fragmentation
  9. Complex multi-pattern network (Flagship demo centerpiece)

Ensures >=70% benign transaction volume overall, 100% deterministic seed (seed=42),
and idempotency (clears existing data before seeding).
"""

import os
import sys
import random
from datetime import datetime, timedelta
from faker import Faker

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from apps.api.database import engine, Base, SessionLocal
from apps.api.models import (
    User,
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
    CaseNote,
    CaseAction,
)

# Deterministic seeds
SEED_VALUE = 42
random.seed(SEED_VALUE)
fake = Faker("en_IN")
Faker.seed(SEED_VALUE)

# Reference Base Time for synthetic window (fixed 14-day window ending 2026-08-28)
BASE_TIME = datetime(2026, 8, 28, 18, 0, 0)
START_WINDOW = BASE_TIME - timedelta(days=14)

UPI_HANDLES = ["okhdfcbank", "okicici", "okaxis", "paytm", "ybl", "sbi"]
DEVICE_TYPES = ["mobile_android_samsung", "mobile_android_redmi", "mobile_android_oneplus", "mobile_ios_iphone", "web_browser_chrome"]


def generate_account_number():
    return f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"


def generate_upi_id(name):
    clean_name = "".join(c for c in name.lower() if c.isalnum())
    handle = random.choice(UPI_HANDLES)
    return f"{clean_name}{random.randint(10, 99)}@{handle}"


def generate_device_fingerprint():
    chars = "0123456789abcdef"
    return "fp_" + "".join(random.choice(chars) for _ in range(16))


def clear_database(db):
    """Clean all tables idempotently."""
    print("[Seed] Clearing existing data...", flush=True)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[Seed] Tables recreated cleanly.", flush=True)


def generate_seed():
    db = SessionLocal()
    try:
        clear_database(db)

        to_add = []

        # 1. Create Default Users (Demo Investigator & Risk Ops)
        demo_user = User(
            id="usr_analyst_01",
            name="Priya Sharma",
            role="investigator",
            email="priya.sharma@buildbank.internal",
        )
        manager_user = User(
            id="usr_mgr_01",
            name="Vikramaditya Roy",
            role="manager",
            email="vikram.roy@buildbank.internal",
        )
        to_add.extend([demo_user, manager_user])

        all_accounts = []
        all_transactions = []
        all_entities = []
        all_devices = []
        all_identifiers = []
        investigations = []

        # =========================================================================
        # SCENARIO 1: Normal Customers (~32 accounts, sparse benign transactions)
        # =========================================================================
        print("[Seed] Generating Scenario 1: Normal Customers...", flush=True)
        normal_accounts = []
        for i in range(32):
            acc_id = f"acc_norm_{i+1:03d}"
            name = fake.name()
            created_at = START_WINDOW - timedelta(days=random.randint(60, 400))
            acc = Account(
                id=acc_id,
                account_number=generate_account_number(),
                holder_name=name,
                account_type="salary" if i % 3 == 0 else "savings",
                created_at=created_at,
                is_synthetic=True,
            )
            entity = Entity(
                id=f"ent_norm_{i+1:03d}",
                type="person",
                name=name,
                metadata_json={"occupation": fake.job(), "city": fake.city()},
            )
            device = Device(
                id=f"dev_norm_{i+1:03d}",
                device_fingerprint=generate_device_fingerprint(),
                device_type=random.choice(DEVICE_TYPES),
                first_seen_at=created_at,
            )
            phone_id = Identifier(
                id=f"id_phone_norm_{i+1:03d}",
                type="phone",
                value=f"+91-{random.randint(6000000000, 9999999999)}",
            )
            upi_id = Identifier(
                id=f"id_upi_norm_{i+1:03d}",
                type="upi_id",
                value=generate_upi_id(name),
            )

            all_accounts.append(acc)
            all_entities.append(entity)
            all_devices.append(device)
            all_identifiers.extend([phone_id, upi_id])
            normal_accounts.append(acc)

            to_add.extend([
                acc, entity, device, phone_id, upi_id,
                AccountEntity(account_id=acc.id, entity_id=entity.id, relationship_type="owns"),
                AccountDevice(account_id=acc.id, device_id=device.id, linked_at=created_at),
                AccountIdentifier(account_id=acc.id, identifier_id=phone_id.id, linked_at=created_at),
                AccountIdentifier(account_id=acc.id, identifier_id=upi_id.id, linked_at=created_at),
            ])

        # Normal benign transactions between normal accounts (utility, grocery, salary, peer transfer)
        for day in range(14):
            day_date = START_WINDOW + timedelta(days=day)
            for acc in normal_accounts:
                if random.random() < 0.35:
                    target_acc = random.choice([a for a in normal_accounts if a.id != acc.id])
                    txn_time = day_date + timedelta(hours=random.randint(8, 21), minutes=random.randint(0, 59))
                    amount = round(random.uniform(200.0, 4500.0), 2)
                    txn = Transaction(
                        id=f"txn_norm_{len(all_transactions)+1:05d}",
                        source_account_id=acc.id,
                        destination_account_id=target_acc.id,
                        amount=amount,
                        currency="INR",
                        timestamp=txn_time,
                        transaction_type="upi",
                        upi_ref=f"UPI{random.randint(100000000000, 999999999999)}",
                        is_synthetic=True,
                    )
                    all_transactions.append(txn)
                    to_add.append(txn)

        # =========================================================================
        # SCENARIO 2: Normal High-Frequency Business Accounts (2 Merchant Accounts)
        # =========================================================================
        print("[Seed] Generating Scenario 2: Normal High-Frequency Business Accounts...", flush=True)
        merchants = [
            ("acc_merch_001", "ent_merch_001", "Reliance Fresh Retail Ltd", "Supermarket & Retail"),
            ("acc_merch_002", "ent_merch_002", "Swiggy Express Foods Pvt Ltd", "Food Delivery & Logistics"),
        ]
        merchant_accounts = []
        for acc_id, ent_id, m_name, m_type in merchants:
            m_created = START_WINDOW - timedelta(days=500)
            m_acc = Account(
                id=acc_id,
                account_number=generate_account_number(),
                holder_name=m_name,
                account_type="merchant",
                created_at=m_created,
                is_synthetic=True,
            )
            m_entity = Entity(
                id=ent_id,
                type="merchant",
                name=m_name,
                metadata_json={"business_category": m_type, "gstin": f"07AAAAA{random.randint(1000,9999)}A1Z5"},
            )
            m_dev = Device(
                id=f"dev_{acc_id}",
                device_fingerprint=generate_device_fingerprint(),
                device_type="pos_terminal_verifone",
                first_seen_at=m_created,
            )
            m_upi = Identifier(
                id=f"id_upi_{acc_id}",
                type="upi_id",
                value=f"{acc_id.replace('acc_', '')}@hdfcmerchant",
            )
            all_accounts.append(m_acc)
            all_entities.append(m_entity)
            all_devices.append(m_dev)
            all_identifiers.append(m_upi)
            merchant_accounts.append(m_acc)

            to_add.extend([
                m_acc, m_entity, m_dev, m_upi,
                AccountEntity(account_id=m_acc.id, entity_id=m_entity.id, relationship_type="operates"),
                AccountDevice(account_id=m_acc.id, device_id=m_dev.id, linked_at=m_created),
                AccountIdentifier(account_id=m_acc.id, identifier_id=m_upi.id, linked_at=m_created),
            ])

        # Generate steady high-frequency retail transactions from normal accounts to merchants
        for day in range(14):
            day_date = START_WINDOW + timedelta(days=day)
            for m_acc in merchant_accounts:
                for _ in range(18):
                    buyer = random.choice(normal_accounts)
                    txn_time = day_date + timedelta(hours=random.randint(9, 22), minutes=random.randint(0, 59))
                    amount = round(random.uniform(150.0, 2800.0), 2)
                    txn = Transaction(
                        id=f"txn_merch_{len(all_transactions)+1:05d}",
                        source_account_id=buyer.id,
                        destination_account_id=m_acc.id,
                        amount=amount,
                        currency="INR",
                        timestamp=txn_time,
                        transaction_type="upi",
                        upi_ref=f"UPI{random.randint(100000000000, 999999999999)}",
                        is_synthetic=True,
                    )
                    all_transactions.append(txn)
                    to_add.append(txn)

        # =========================================================================
        # SCENARIO 3: Fan-Out Fraud Network
        # 1 Source -> 8 Destination Accounts in 20 mins
        # =========================================================================
        print("[Seed] Generating Scenario 3: Fan-Out Fraud Network...", flush=True)
        s3_time = BASE_TIME - timedelta(days=3, hours=14)
        s3_src = Account(
            id="acc_s3_src_01",
            account_number=generate_account_number(),
            holder_name="Rajesh Verma (Shell Syndicate)",
            account_type="current",
            created_at=s3_time - timedelta(days=45),
            is_synthetic=True,
        )
        s3_src_ent = Entity(id="ent_s3_src_01", type="person", name="Rajesh Verma")
        s3_src_dev = Device(id="dev_s3_src_01", device_fingerprint=generate_device_fingerprint(), device_type="mobile_android_redmi", first_seen_at=s3_time - timedelta(days=45))
        to_add.extend([
            s3_src, s3_src_ent, s3_src_dev,
            AccountEntity(account_id=s3_src.id, entity_id=s3_src_ent.id, relationship_type="owns"),
            AccountDevice(account_id=s3_src.id, device_id=s3_src_dev.id, linked_at=s3_time - timedelta(days=45)),
        ])

        s3_dests = []
        s3_total = 0.0
        for i in range(8):
            dst = Account(
                id=f"acc_s3_dst_{i+1:02d}",
                account_number=generate_account_number(),
                holder_name=fake.name(),
                account_type="savings",
                created_at=s3_time - timedelta(days=random.randint(10, 30)),
                is_synthetic=True,
            )
            dst_ent = Entity(id=f"ent_s3_dst_{i+1:02d}", type="beneficiary", name=dst.holder_name)
            to_add.extend([
                dst, dst_ent,
                AccountEntity(account_id=dst.id, entity_id=dst_ent.id, relationship_type="owns"),
            ])
            s3_dests.append(dst)

            txn_t = s3_time + timedelta(minutes=i * 2 + 1)
            amt = 45000.0 + (i * 500)
            s3_total += amt
            t = Transaction(
                id=f"txn_s3_{i+1:02d}",
                source_account_id=s3_src.id,
                destination_account_id=dst.id,
                amount=amt,
                currency="INR",
                timestamp=txn_t,
                transaction_type="imps",
                upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        inv_s3 = Investigation(
            id="inv_fanout_network",
            title="Rapid Fan-Out Fund Dispersion Network",
            status="new",
            risk_score=78.0,
            risk_level="high",
            created_at=s3_time + timedelta(hours=1),
            updated_at=s3_time + timedelta(hours=1),
            time_window_start=s3_time,
            time_window_end=s3_time + timedelta(minutes=25),
            total_flow_amount=s3_total,
            scenario_tag="scenario_3_fanout",
        )
        to_add.append(inv_s3)
        to_add.append(InvestigationEntity(investigation_id=inv_s3.id, account_id=s3_src.id))
        for d in s3_dests:
            to_add.append(InvestigationEntity(investigation_id=inv_s3.id, account_id=d.id))
        investigations.append(inv_s3)

        # =========================================================================
        # SCENARIO 4: Layered Money Movement (Linear 4-hop intermediary chain)
        # A -> B -> C -> D -> E in rapid succession
        # =========================================================================
        print("[Seed] Generating Scenario 4: Layered Money Movement...", flush=True)
        s4_time = BASE_TIME - timedelta(days=4, hours=10)
        s4_nodes = []
        chain_names = ["Originator Prime", "Layer Hop Alpha", "Layer Hop Beta", "Layer Hop Gamma", "Offshore Mule Final"]
        for i, h_name in enumerate(chain_names):
            acc = Account(
                id=f"acc_s4_hop_{i+1:02d}",
                account_number=generate_account_number(),
                holder_name=f"{h_name} ({fake.name()})",
                account_type="current" if i == 0 else "savings",
                created_at=s4_time - timedelta(days=random.randint(5, 40)),
                is_synthetic=True,
            )
            ent = Entity(id=f"ent_s4_hop_{i+1:02d}", type="person" if i < 4 else "beneficiary", name=acc.holder_name)
            to_add.extend([
                acc, ent,
                AccountEntity(account_id=acc.id, entity_id=ent.id, relationship_type="owns"),
            ])
            s4_nodes.append(acc)

        amt = 350000.0
        for i in range(4):
            txn_t = s4_time + timedelta(minutes=i * 4 + 2)
            hop_amt = amt - (i * 3000)
            t = Transaction(
                id=f"txn_s4_hop_{i+1:02d}",
                source_account_id=s4_nodes[i].id,
                destination_account_id=s4_nodes[i+1].id,
                amount=hop_amt,
                currency="INR",
                timestamp=txn_t,
                transaction_type="rtgs" if hop_amt >= 200000 else "imps",
                upi_ref=f"RTGS{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        inv_s4 = Investigation(
            id="inv_layering_chain",
            title="Multi-Hop Rapid Pass-Through Layering Chain",
            status="investigating",
            risk_score=76.0,
            risk_level="high",
            created_at=s4_time + timedelta(hours=1),
            updated_at=s4_time + timedelta(hours=1),
            time_window_start=s4_time,
            time_window_end=s4_time + timedelta(minutes=30),
            total_flow_amount=350000.0,
            scenario_tag="scenario_4_layering",
        )
        to_add.append(inv_s4)
        for node in s4_nodes:
            to_add.append(InvestigationEntity(investigation_id=inv_s4.id, account_id=node.id))
        investigations.append(inv_s4)

        # =========================================================================
        # SCENARIO 5: Circular Transaction Network (A -> B -> C -> A)
        # =========================================================================
        print("[Seed] Generating Scenario 5: Circular Transaction Network...", flush=True)
        s5_time = BASE_TIME - timedelta(days=5, hours=11)
        s5_accs = []
        cycle_names = ["Kavita Traders", "Sunil Enterprises", "Apex Global Holdings"]
        for i, c_name in enumerate(cycle_names):
            acc = Account(
                id=f"acc_s5_cyc_{i+1:02d}",
                account_number=generate_account_number(),
                holder_name=c_name,
                account_type="current",
                created_at=s5_time - timedelta(days=60),
                is_synthetic=True,
            )
            ent = Entity(id=f"ent_s5_cyc_{i+1:02d}", type="merchant", name=c_name)
            to_add.extend([
                acc, ent,
                AccountEntity(account_id=acc.id, entity_id=ent.id, relationship_type="operates"),
            ])
            s5_accs.append(acc)

        s5_edges = [(0, 1, 180000.0, 0), (1, 2, 175000.0, 45), (2, 0, 170000.0, 95)]
        for idx, (u, v, c_amt, m_offset) in enumerate(s5_edges):
            t = Transaction(
                id=f"txn_s5_cyc_{idx+1:02d}",
                source_account_id=s5_accs[u].id,
                destination_account_id=s5_accs[v].id,
                amount=c_amt,
                currency="INR",
                timestamp=s5_time + timedelta(minutes=m_offset),
                transaction_type="neft",
                upi_ref=f"NEFT{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        inv_s5 = Investigation(
            id="inv_circular_cycle",
            title="Closed Loop Circular Fund Movement",
            status="escalated",
            risk_score=88.0,
            risk_level="critical",
            created_at=s5_time + timedelta(hours=3),
            updated_at=s5_time + timedelta(hours=3),
            time_window_start=s5_time,
            time_window_end=s5_time + timedelta(hours=3),
            total_flow_amount=525000.0,
            scenario_tag="scenario_5_circular",
        )
        to_add.append(inv_s5)
        for a in s5_accs:
            to_add.append(InvestigationEntity(investigation_id=inv_s5.id, account_id=a.id))
        investigations.append(inv_s5)

        # =========================================================================
        # SCENARIO 6: Shared-Device Mule Network (4 accounts, same 1-2 devices)
        # =========================================================================
        print("[Seed] Generating Scenario 6: Shared-Device Mule Network...", flush=True)
        s6_time = BASE_TIME - timedelta(days=6, hours=15)
        s6_shared_dev1 = Device(
            id="dev_s6_mule_shared_01",
            device_fingerprint="fp_mule_syndicate_9941a",
            device_type="mobile_android_oneplus",
            first_seen_at=s6_time - timedelta(days=20),
        )
        s6_shared_dev2 = Device(
            id="dev_s6_mule_shared_02",
            device_fingerprint="fp_mule_syndicate_8820b",
            device_type="mobile_android_samsung",
            first_seen_at=s6_time - timedelta(days=15),
        )
        to_add.extend([s6_shared_dev1, s6_shared_dev2])

        s6_accs = []
        for i in range(4):
            acc = Account(
                id=f"acc_s6_mule_{i+1:02d}",
                account_number=generate_account_number(),
                holder_name=f"Mule Account {i+1} ({fake.name()})",
                account_type="savings",
                created_at=s6_time - timedelta(days=random.randint(15, 45)),
                is_synthetic=True,
            )
            ent = Entity(id=f"ent_s6_mule_{i+1:02d}", type="person", name=acc.holder_name)
            to_add.extend([
                acc, ent,
                AccountEntity(account_id=acc.id, entity_id=ent.id, relationship_type="owns"),
                AccountDevice(account_id=acc.id, device_id=s6_shared_dev1.id, linked_at=acc.created_at),
            ])
            if i in [0, 1]:
                to_add.append(AccountDevice(account_id=acc.id, device_id=s6_shared_dev2.id, linked_at=acc.created_at))
            s6_accs.append(acc)

        s6_total = 0.0
        for i in range(3):
            t = Transaction(
                id=f"txn_s6_mule_{i+1:02d}",
                source_account_id=s6_accs[i].id,
                destination_account_id=s6_accs[i+1].id,
                amount=75000.0 + (i * 8000),
                currency="INR",
                timestamp=s6_time + timedelta(minutes=i * 12 + 5),
                transaction_type="upi",
                upi_ref=f"UPI{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            s6_total += t.amount
            all_transactions.append(t)
            to_add.append(t)

        inv_s6 = Investigation(
            id="inv_shared_device_mules",
            title="Shared Hardware Fingerprint Mule Network",
            status="investigating",
            risk_score=75.0,
            risk_level="high",
            created_at=s6_time + timedelta(hours=2),
            updated_at=s6_time + timedelta(hours=2),
            time_window_start=s6_time,
            time_window_end=s6_time + timedelta(hours=2),
            total_flow_amount=s6_total,
            scenario_tag="scenario_6_shared_device",
        )
        to_add.append(inv_s6)
        for a in s6_accs:
            to_add.append(InvestigationEntity(investigation_id=inv_s6.id, account_id=a.id))
        investigations.append(inv_s6)

        # =========================================================================
        # SCENARIO 7: Rapid Pass-Through Accounts (>=80% forwarded within 5 mins)
        # =========================================================================
        print("[Seed] Generating Scenario 7: Rapid Pass-Through Accounts...", flush=True)
        s7_time = BASE_TIME - timedelta(days=2, hours=16)
        s7_feeder = Account(
            id="acc_s7_feeder_01",
            account_number=generate_account_number(),
            holder_name="Feeder Source Entity",
            account_type="current",
            created_at=s7_time - timedelta(days=90),
            is_synthetic=True,
        )
        s7_pass = Account(
            id="acc_s7_passthrough_01",
            account_number=generate_account_number(),
            holder_name="Quick Transit Conduit (Aman Gupta)",
            account_type="savings",
            created_at=s7_time - timedelta(days=20),
            is_synthetic=True,
        )
        s7_sink = Account(
            id="acc_s7_sink_01",
            account_number=generate_account_number(),
            holder_name="Final Beneficiary Vault",
            account_type="savings",
            created_at=s7_time - timedelta(days=120),
            is_synthetic=True,
        )
        to_add.extend([s7_feeder, s7_pass, s7_sink])

        t7_in1 = Transaction(
            id="txn_s7_in_01",
            source_account_id=s7_feeder.id,
            destination_account_id=s7_pass.id,
            amount=120000.0,
            currency="INR",
            timestamp=s7_time,
            transaction_type="imps",
            upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        t7_out1 = Transaction(
            id="txn_s7_out_01",
            source_account_id=s7_pass.id,
            destination_account_id=s7_sink.id,
            amount=110000.0,
            currency="INR",
            timestamp=s7_time + timedelta(minutes=3),
            transaction_type="imps",
            upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        t7_in2 = Transaction(
            id="txn_s7_in_02",
            source_account_id=s7_feeder.id,
            destination_account_id=s7_pass.id,
            amount=95000.0,
            currency="INR",
            timestamp=s7_time + timedelta(hours=2),
            transaction_type="imps",
            upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        t7_out2 = Transaction(
            id="txn_s7_out_02",
            source_account_id=s7_pass.id,
            destination_account_id=s7_sink.id,
            amount=88000.0,
            currency="INR",
            timestamp=s7_time + timedelta(hours=2, minutes=4),
            transaction_type="imps",
            upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        all_transactions.extend([t7_in1, t7_out1, t7_in2, t7_out2])
        to_add.extend([t7_in1, t7_out1, t7_in2, t7_out2])

        inv_s7 = Investigation(
            id="inv_rapid_passthrough",
            title="High-Velocity Automated Pass-Through Conduit",
            status="new",
            risk_score=72.0,
            risk_level="high",
            created_at=s7_time + timedelta(hours=3),
            updated_at=s7_time + timedelta(hours=3),
            time_window_start=s7_time,
            time_window_end=s7_time + timedelta(hours=3),
            total_flow_amount=215000.0,
            scenario_tag="scenario_7_passthrough",
        )
        to_add.extend([
            inv_s7,
            InvestigationEntity(investigation_id=inv_s7.id, account_id=s7_feeder.id),
            InvestigationEntity(investigation_id=inv_s7.id, account_id=s7_pass.id),
            InvestigationEntity(investigation_id=inv_s7.id, account_id=s7_sink.id),
        ])
        investigations.append(inv_s7)

        # =========================================================================
        # SCENARIO 8: Transaction Fragmentation / Smurfing
        # ₹2,00,000 split into 6 transactions of ~₹33,000 within 15 minutes
        # =========================================================================
        print("[Seed] Generating Scenario 8: Transaction Fragmentation...", flush=True)
        s8_time = BASE_TIME - timedelta(days=1, hours=17)
        s8_src = Account(
            id="acc_s8_smurf_src",
            account_number=generate_account_number(),
            holder_name="Smurf Operator (Rohan Mehra)",
            account_type="savings",
            created_at=s8_time - timedelta(days=25),
            is_synthetic=True,
        )
        s8_dst = Account(
            id="acc_s8_smurf_dst",
            account_number=generate_account_number(),
            holder_name="Collector Account (Target Vault)",
            account_type="current",
            created_at=s8_time - timedelta(days=50),
            is_synthetic=True,
        )
        to_add.extend([s8_src, s8_dst])

        for i in range(6):
            t = Transaction(
                id=f"txn_s8_frag_{i+1:02d}",
                source_account_id=s8_src.id,
                destination_account_id=s8_dst.id,
                amount=33333.33 if i < 5 else 33333.35,
                currency="INR",
                timestamp=s8_time + timedelta(minutes=i * 2 + 1),
                transaction_type="upi",
                upi_ref=f"UPI{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        inv_s8 = Investigation(
            id="inv_fragmentation_smurf",
            title="Threshold Evasion Structured Fragmentation",
            status="investigating",
            risk_score=68.0,
            risk_level="medium",
            created_at=s8_time + timedelta(hours=1),
            updated_at=s8_time + timedelta(hours=1),
            time_window_start=s8_time,
            time_window_end=s8_time + timedelta(minutes=20),
            total_flow_amount=200000.0,
            scenario_tag="scenario_8_fragmentation",
        )
        to_add.extend([
            inv_s8,
            InvestigationEntity(investigation_id=inv_s8.id, account_id=s8_src.id),
            InvestigationEntity(investigation_id=inv_s8.id, account_id=s8_dst.id),
        ])
        investigations.append(inv_s8)

        # =========================================================================
        # SCENARIO 9: COMPLEX MULTI-PATTERN NETWORK (FLAGSHIP DEMO CASE)
        # Combines Fan-Out + Shared Devices + Layering + Circular flow into ₹8.4L case
        # =========================================================================
        print("[Seed] Generating Scenario 9: Complex Multi-Pattern Flagship Network...", flush=True)
        s9_time = BASE_TIME - timedelta(hours=6)
        
        acc_s9_origin = Account(
            id="acc_flagship_origin",
            account_number=generate_account_number(),
            holder_name="Vikramaditya Syndicate Master",
            account_type="current",
            created_at=s9_time - timedelta(days=12),
            is_synthetic=True,
        )
        ent_s9_origin = Entity(
            id="ent_flagship_origin",
            type="person",
            name="Vikramaditya Syndicate Master",
            metadata_json={"role": "Primary Organizer", "risk_rating": "Critical"},
        )
        to_add.extend([
            acc_s9_origin, ent_s9_origin,
            AccountEntity(account_id=acc_s9_origin.id, entity_id=ent_s9_origin.id, relationship_type="owns"),
        ])

        dev_s9_shared = Device(
            id="dev_flagship_shared_01",
            device_fingerprint="fp_flagship_syndicate_core_88x",
            device_type="mobile_android_samsung_galaxy",
            first_seen_at=s9_time - timedelta(days=10),
        )
        dev_s9_other = Device(
            id="dev_flagship_aux_02",
            device_fingerprint="fp_flagship_aux_device_33y",
            device_type="mobile_android_redmi_note",
            first_seen_at=s9_time - timedelta(days=8),
        )
        to_add.extend([dev_s9_shared, dev_s9_other])

        s9_mules = []
        mule_names = [
            "Sameer Mule Alpha",
            "Pooja Mule Beta",
            "Karan Mule Gamma",
            "Deepak Mule Delta",
            "Neha Mule Epsilon",
        ]
        for i, m_name in enumerate(mule_names):
            m_acc = Account(
                id=f"acc_flagship_mule_{i+1:02d}",
                account_number=generate_account_number(),
                holder_name=m_name,
                account_type="savings",
                created_at=s9_time - timedelta(days=3 + i),
                is_synthetic=True,
            )
            m_ent = Entity(id=f"ent_flagship_mule_{i+1:02d}", type="person", name=m_name)
            to_add.extend([
                m_acc, m_ent,
                AccountEntity(account_id=m_acc.id, entity_id=m_ent.id, relationship_type="owns"),
            ])

            if i in [0, 1, 2]:
                to_add.append(AccountDevice(account_id=m_acc.id, device_id=dev_s9_shared.id, linked_at=m_acc.created_at))
            else:
                to_add.append(AccountDevice(account_id=m_acc.id, device_id=dev_s9_other.id, linked_at=m_acc.created_at))

            s9_mules.append(m_acc)

        acc_s9_layer1 = Account(
            id="acc_flagship_layer_01",
            account_number=generate_account_number(),
            holder_name="Nexus Capital Transit (Ramesh K)",
            account_type="current",
            created_at=s9_time - timedelta(days=6),
            is_synthetic=True,
        )
        acc_s9_layer2 = Account(
            id="acc_flagship_layer_02",
            account_number=generate_account_number(),
            holder_name="Pacific Meridian Vault (Suresh N)",
            account_type="current",
            created_at=s9_time - timedelta(days=5),
            is_synthetic=True,
        )
        acc_s9_beneficiary = Account(
            id="acc_flagship_beneficiary",
            account_number=generate_account_number(),
            holder_name="Global Shield Offshoring Ltd",
            account_type="merchant",
            created_at=s9_time - timedelta(days=15),
            is_synthetic=True,
        )
        to_add.extend([acc_s9_layer1, acc_s9_layer2, acc_s9_beneficiary])

        # Fan-out from Origin to 5 Mules
        mule_amounts = [180000.0, 175000.0, 165000.0, 160000.0, 160000.0]
        for i, (m_acc, m_amt) in enumerate(zip(s9_mules, mule_amounts)):
            t = Transaction(
                id=f"txn_flagship_fanout_{i+1:02d}",
                source_account_id=acc_s9_origin.id,
                destination_account_id=m_acc.id,
                amount=m_amt,
                currency="INR",
                timestamp=s9_time + timedelta(minutes=i * 4 + 1),
                transaction_type="imps",
                upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        mule_hop_time = s9_time + timedelta(minutes=24)
        for i, (m_acc, m_amt) in enumerate(zip(s9_mules, mule_amounts)):
            forward_amt = round(m_amt * 0.82, 2)
            t = Transaction(
                id=f"txn_flagship_funnel_{i+1:02d}",
                source_account_id=m_acc.id,
                destination_account_id=acc_s9_layer1.id,
                amount=forward_amt,
                currency="INR",
                timestamp=mule_hop_time + timedelta(minutes=i * 2),
                transaction_type="upi",
                upi_ref=f"UPI{random.randint(100000000000, 999999999999)}",
                is_synthetic=True,
            )
            all_transactions.append(t)
            to_add.append(t)

        t_layer1_2 = Transaction(
            id="txn_flagship_layer_01",
            source_account_id=acc_s9_layer1.id,
            destination_account_id=acc_s9_layer2.id,
            amount=650000.0,
            currency="INR",
            timestamp=mule_hop_time + timedelta(minutes=14),
            transaction_type="rtgs",
            upi_ref=f"RTGS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        all_transactions.append(t_layer1_2)
        to_add.append(t_layer1_2)

        t_beneficiary = Transaction(
            id="txn_flagship_layer_02",
            source_account_id=acc_s9_layer2.id,
            destination_account_id=acc_s9_beneficiary.id,
            amount=500000.0,
            currency="INR",
            timestamp=mule_hop_time + timedelta(minutes=20),
            transaction_type="rtgs",
            upi_ref=f"RTGS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        all_transactions.append(t_beneficiary)
        to_add.append(t_beneficiary)

        t_cycle_back = Transaction(
            id="txn_flagship_cycle_kickback",
            source_account_id=acc_s9_layer2.id,
            destination_account_id=s9_mules[0].id,
            amount=120000.0,
            currency="INR",
            timestamp=mule_hop_time + timedelta(minutes=28),
            transaction_type="imps",
            upi_ref=f"IMPS{random.randint(100000000000, 999999999999)}",
            is_synthetic=True,
        )
        all_transactions.append(t_cycle_back)
        to_add.append(t_cycle_back)

        inv_s9 = Investigation(
            id="inv_flagship_demo",
            title="Complex Syndicate: Multi-Hop Fan-Out, Device Mule Ring & Circular Flow",
            status="investigating",
            risk_score=89.0,
            risk_level="critical",
            created_at=s9_time + timedelta(hours=1),
            updated_at=s9_time + timedelta(hours=1),
            time_window_start=s9_time,
            time_window_end=mule_hop_time + timedelta(minutes=35),
            total_flow_amount=840000.0,
            scenario_tag="scenario_9_flagship",
        )
        to_add.append(inv_s9)

        flagship_accounts = [acc_s9_origin] + s9_mules + [acc_s9_layer1, acc_s9_layer2, acc_s9_beneficiary]
        for a in flagship_accounts:
            to_add.append(InvestigationEntity(investigation_id=inv_s9.id, account_id=a.id))

        note1 = CaseNote(
            id="note_flagship_01",
            investigation_id=inv_s9.id,
            user_id=demo_user.id,
            note_text="High priority multi-pattern nexus detected: 5 rapid fan-out hops from origin within 21 mins, 3 accounts sharing device fingerprint fp_flagship_syndicate_core_88x. Layered forward via Nexus Capital and Pacific Meridian.",
            created_at=s9_time + timedelta(hours=1, minutes=10),
        )
        note2 = CaseNote(
            id="note_flagship_02",
            investigation_id=inv_s9.id,
            user_id=demo_user.id,
            note_text="Follow-the-money trace confirms circular kickback of ₹1.2L returning to Mule Alpha.",
            created_at=s9_time + timedelta(hours=1, minutes=25),
        )
        act1 = CaseAction(
            id="act_flagship_01",
            investigation_id=inv_s9.id,
            user_id=demo_user.id,
            action_type="status_change",
            previous_value="new",
            new_value="investigating",
            created_at=s9_time + timedelta(hours=1, minutes=5),
        )
        to_add.extend([note1, note2, act1])
        investigations.append(inv_s9)

        print(f"[Seed] Writing {len(to_add)} records to database...", flush=True)
        db.add_all(to_add)
        db.commit()

        # Summary
        total_accounts = db.query(Account).count()
        total_txns = db.query(Transaction).count()
        total_investigations = db.query(Investigation).count()
        total_devices = db.query(Device).count()
        total_entities = db.query(Entity).count()

        benign_txns = len([t for t in all_transactions if t.id.startswith("txn_norm_") or t.id.startswith("txn_merch_")])
        fraud_txns = total_txns - benign_txns
        benign_pct = (benign_txns / total_txns) * 100 if total_txns > 0 else 0

        print("=" * 60, flush=True)
        print("TRACEFUSE SEED GENERATION COMPLETE", flush=True)
        print("=" * 60, flush=True)
        print(f"Total Accounts Created:       {total_accounts}", flush=True)
        print(f"Total Entities Created:       {total_entities}", flush=True)
        print(f"Total Devices Created:        {total_devices}", flush=True)
        print(f"Total Transactions Created:   {total_txns}", flush=True)
        print(f"  - Benign Transactions:      {benign_txns} ({benign_pct:.1f}%) [Requirement: >=70%]", flush=True)
        print(f"  - Fraud Scenario Txns:      {fraud_txns} ({100 - benign_pct:.1f}%)", flush=True)
        print(f"Total Investigations Created: {total_investigations} (Flagship: 'inv_flagship_demo')", flush=True)
        print("=" * 60, flush=True)

        return {
            "accounts": total_accounts,
            "entities": total_entities,
            "devices": total_devices,
            "transactions": total_txns,
            "benign_percentage": benign_pct,
            "investigations": total_investigations,
        }

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error during seeding: {e}", flush=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_seed()
