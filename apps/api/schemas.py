"""
Pydantic Schemas for TraceFuse API
Defines strict request and response schemas matching Section 8, 18, and shared TypeScript models.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# -------------------------------------------------------------------------
# Dashboard Schemas
# -------------------------------------------------------------------------
class DashboardSummaryResponse(BaseModel):
    suspicious_networks: int
    high_risk_accounts: int
    flagged_transactions: int
    amount_under_investigation: float
    active_investigations: int
    escalated_cases: int


# -------------------------------------------------------------------------
# Entity & Account Schemas
# -------------------------------------------------------------------------
class EntityResponse(BaseModel):
    id: str
    type: str
    name: str
    metadata_json: Optional[Dict[str, Any]] = None


class AccountDeviceResponse(BaseModel):
    device_id: str
    device_fingerprint: str
    device_type: str
    linked_at: datetime


class AccountIdentifierResponse(BaseModel):
    identifier_id: str
    type: str
    value: str
    linked_at: datetime


class AccountSummaryResponse(BaseModel):
    id: str
    account_number: str
    holder_name: str
    account_type: str
    created_at: datetime
    is_synthetic: bool
    devices: List[AccountDeviceResponse] = []
    identifiers: List[AccountIdentifierResponse] = []
    total_inflow: float = 0.0
    total_outflow: float = 0.0
    transaction_count: int = 0
    recent_transactions: List[Dict[str, Any]] = []


# -------------------------------------------------------------------------
# Transaction Schemas
# -------------------------------------------------------------------------
class TransactionResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: str
    amount: float
    currency: str
    timestamp: datetime
    transaction_type: str
    upi_ref: Optional[str] = None
    is_synthetic: bool
    source_holder_name: Optional[str] = None
    destination_holder_name: Optional[str] = None


# -------------------------------------------------------------------------
# Investigation Schemas
# -------------------------------------------------------------------------
class PatternResponse(BaseModel):
    id: str
    pattern_type: str
    severity: str
    confidence: float
    transaction_ids_json: List[str]
    entities_json: List[str]
    explanation: str


class RiskSignalResponse(BaseModel):
    id: str
    category: str
    score: float
    weight: float
    explanation: str


class EvidenceResponse(BaseModel):
    id: str
    pattern_id: Optional[str] = None
    description: str
    transaction_ids_json: List[str]
    created_at: datetime


class CaseNoteResponse(BaseModel):
    id: str
    investigation_id: str
    user_id: str
    user_name: Optional[str] = None
    note_text: str
    created_at: datetime


class CaseActionResponse(BaseModel):
    id: str
    investigation_id: str
    user_id: str
    user_name: Optional[str] = None
    action_type: str
    previous_value: Optional[str] = None
    new_value: str
    created_at: datetime


class CaseGenesisResponse(BaseModel):
    primary_trigger: str
    triggering_entity: str
    time_window: str
    suspicious_transaction_count: int
    connected_entity_count: int
    detected_pattern_types: List[str]
    total_amount: float
    key_evidence_signals: List[str]


class InvestigationListItem(BaseModel):
    id: str
    title: str
    status: str
    risk_score: float
    risk_level: str
    created_at: datetime
    updated_at: datetime
    time_window_start: datetime
    time_window_end: datetime
    total_flow_amount: float
    scenario_tag: str
    entities_count: int
    patterns_count: int
    top_patterns: List[str] = []


class InvestigationDetailResponse(BaseModel):
    id: str
    title: str
    status: str
    risk_score: float
    risk_level: str
    created_at: datetime
    updated_at: datetime
    time_window_start: datetime
    time_window_end: datetime
    total_flow_amount: float
    scenario_tag: str
    entities: List[AccountSummaryResponse] = []
    patterns: List[PatternResponse] = []
    risk_signals: List[RiskSignalResponse] = []
    evidence_items: List[EvidenceResponse] = []
    notes: List[CaseNoteResponse] = []
    actions: List[CaseActionResponse] = []
    case_genesis: Optional[CaseGenesisResponse] = None


# -------------------------------------------------------------------------
# Graph & Timeline Schemas
# -------------------------------------------------------------------------
class GraphNodeData(BaseModel):
    label: str
    nodeType: str
    severity: str
    id: str
    account_number: Optional[str] = None
    account_type: Optional[str] = None
    device_fingerprint: Optional[str] = None
    device_type: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class GraphNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    animated: bool = False
    data: Dict[str, Any]


class GraphPayloadResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class TimelineEventResponse(BaseModel):
    id: str
    index: int
    timestamp: str
    source_account_id: str
    destination_account_id: str
    amount: float
    transaction_type: str
    is_high_value: bool = False


# -------------------------------------------------------------------------
# Action & Interactive Schemas
# -------------------------------------------------------------------------
class FollowMoneyRequest(BaseModel):
    source_account_id: str
    destination_account_id: Optional[str] = None
    min_amount: Optional[float] = None
    max_hops: Optional[int] = 6


class MoneyHopResponse(BaseModel):
    hop_number: int
    from_account_id: str
    to_account_id: str
    transaction_id: str
    amount: float
    timestamp: str
    cumulative_amount: float
    elapsed_time_minutes: float
    hop_elapsed_minutes: float = 0.0


class FollowMoneyResponse(BaseModel):
    source_account_id: str
    total_hops: int
    hops: List[MoneyHopResponse]


class AskAssistantRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)


class AskAssistantResponse(BaseModel):
    answer: str
    grounded: bool
    model: str
    citations: List[str] = []
    fallback_used: bool = False


class UpdateStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(new|investigating|escalated|resolved)$")
    user_id: Optional[str] = "usr_analyst_01"


class AddNoteRequest(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=2000)
    user_id: str = "usr_analyst_01"


class InvestigationReportResponse(BaseModel):
    investigation_id: str
    title: str
    status: str
    risk_score: float
    risk_level: str
    generated_at: datetime
    case_summary: str
    entities_involved: List[Dict[str, Any]]
    total_amount_involved: float
    detected_patterns: List[Dict[str, Any]]
    timeline_summary: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
    money_trail_summary: List[Dict[str, Any]]
    investigator_notes: List[Dict[str, Any]]
    status_history: List[Dict[str, Any]] = []
    recommended_action: str
