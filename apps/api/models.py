import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from apps.api.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="investigator")  # investigator, manager, admin
    email = Column(String, unique=True, index=True, nullable=False)

    notes = relationship("CaseNote", back_populates="user")
    actions = relationship("CaseAction", back_populates="user")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True, nullable=False)
    holder_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False, default="savings")  # savings, current, merchant, salary
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    is_synthetic = Column(Boolean, default=True, nullable=False)

    # Relationships
    devices = relationship("AccountDevice", back_populates="account", cascade="all, delete-orphan")
    identifiers = relationship("AccountIdentifier", back_populates="account", cascade="all, delete-orphan")
    investigations = relationship("InvestigationEntity", back_populates="account", cascade="all, delete-orphan")
    entity_links = relationship("AccountEntity", back_populates="account", cascade="all, delete-orphan")

    outgoing_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.source_account_id",
        back_populates="source_account",
    )
    incoming_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.destination_account_id",
        back_populates="destination_account",
    )


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # person, merchant, beneficiary
    name = Column(String, nullable=False)
    metadata_json = Column(JSON, nullable=True)

    account_links = relationship("AccountEntity", back_populates="entity", cascade="all, delete-orphan")


class AccountEntity(Base):
    __tablename__ = "account_entities"

    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)
    entity_id = Column(String, ForeignKey("entities.id", ondelete="CASCADE"), primary_key=True)
    relationship_type = Column(String, default="owns")  # owns, operates, beneficiary_of
    linked_at = Column(DateTime, default=datetime.datetime.utcnow)

    account = relationship("Account", back_populates="entity_links")
    entity = relationship("Entity", back_populates="account_links")


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    device_fingerprint = Column(String, unique=True, index=True, nullable=False)
    device_type = Column(String, nullable=False, default="mobile_android")
    first_seen_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    accounts = relationship("AccountDevice", back_populates="device", cascade="all, delete-orphan")


class AccountDevice(Base):
    __tablename__ = "account_devices"

    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)
    device_id = Column(String, ForeignKey("devices.id", ondelete="CASCADE"), primary_key=True)
    linked_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    account = relationship("Account", back_populates="devices")
    device = relationship("Device", back_populates="accounts")


class Identifier(Base):
    __tablename__ = "identifiers"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # phone, email, upi_id
    value = Column(String, unique=True, index=True, nullable=False)

    accounts = relationship("AccountIdentifier", back_populates="identifier", cascade="all, delete-orphan")


class AccountIdentifier(Base):
    __tablename__ = "account_identifiers"

    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)
    identifier_id = Column(String, ForeignKey("identifiers.id", ondelete="CASCADE"), primary_key=True)
    linked_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    account = relationship("Account", back_populates="identifiers")
    identifier = relationship("Identifier", back_populates="accounts")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    source_account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    destination_account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    transaction_type = Column(String, default="upi", nullable=False)  # upi, neft, imps, rtgs, internal
    upi_ref = Column(String, nullable=True)
    is_synthetic = Column(Boolean, default=True, nullable=False)

    source_account = relationship("Account", foreign_keys=[source_account_id], back_populates="outgoing_transactions")
    destination_account = relationship("Account", foreign_keys=[destination_account_id], back_populates="incoming_transactions")

    __table_args__ = (
        Index("idx_txn_source_time", "source_account_id", "timestamp"),
        Index("idx_txn_dest_time", "destination_account_id", "timestamp"),
    )


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="new", nullable=False)  # new, investigating, escalated, resolved
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String, default="low", nullable=False)  # low, medium, high, critical
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    time_window_start = Column(DateTime, nullable=False)
    time_window_end = Column(DateTime, nullable=False)
    total_flow_amount = Column(Float, default=0.0, nullable=False)
    scenario_tag = Column(String, nullable=False, index=True)

    entities = relationship("InvestigationEntity", back_populates="investigation", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="investigation", cascade="all, delete-orphan")
    risk_signals = relationship("RiskSignal", back_populates="investigation", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="investigation", cascade="all, delete-orphan")
    actions = relationship("CaseAction", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationEntity(Base):
    __tablename__ = "investigation_entities"

    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), primary_key=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)

    investigation = relationship("Investigation", back_populates="entities")
    account = relationship("Account", back_populates="investigations")


class Pattern(Base):
    __tablename__ = "patterns"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_type = Column(String, nullable=False)  # fan_out, fan_in, rapid_pass_through, etc.
    severity = Column(String, nullable=False)  # low, medium, high, critical
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    transaction_ids_json = Column(JSON, nullable=False, default=list)
    entities_json = Column(JSON, nullable=False, default=list)
    explanation = Column(Text, nullable=False)

    investigation = relationship("Investigation", back_populates="patterns")
    evidence_items = relationship("Evidence", back_populates="pattern")


class RiskSignal(Base):
    __tablename__ = "risk_signals"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False)  # velocity, graph, temporal, fragmentation, circular, entity_reuse
    score = Column(Float, nullable=False)  # 0 to 100
    weight = Column(Float, nullable=False)  # e.g., 0.15, 0.20
    explanation = Column(Text, nullable=False)

    investigation = relationship("Investigation", back_populates="risk_signals")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_id = Column(String, ForeignKey("patterns.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    transaction_ids_json = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="evidence_items")
    pattern = relationship("Pattern", back_populates="evidence_items")


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="notes")
    user = relationship("User", back_populates="notes")


class CaseAction(Base):
    __tablename__ = "case_actions"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False)  # status_change, escalate, resolve
    previous_value = Column(String, nullable=True)
    new_value = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="actions")
    user = relationship("User", back_populates="actions")
