/**
 * TraceFuse Shared TypeScript Types
 * Mirroring Backend Data Models and FastAPI OpenAPI Response Schemas
 */

export type UserRole = 'investigator' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type AccountType = 'savings' | 'current' | 'merchant' | 'salary';

export interface AccountDeviceResponse {
  device_id: string;
  device_fingerprint: string;
  device_type: string;
  linked_at: string;
}

export interface AccountIdentifierResponse {
  identifier_id: string;
  type: string;
  value: string;
  linked_at: string;
}

export interface AccountSummaryResponse {
  id: string;
  account_number: string;
  holder_name: string;
  account_type: AccountType | string;
  created_at: string;
  is_synthetic: boolean;
  devices: AccountDeviceResponse[];
  identifiers: AccountIdentifierResponse[];
  total_inflow: number;
  total_outflow: number;
  transaction_count: number;
  recent_transactions?: Record<string, unknown>[];
}

export type EntityType = 'person' | 'merchant' | 'beneficiary';

export interface EntityResponse {
  id: string;
  type: EntityType | string;
  name: string;
  metadata_json?: Record<string, unknown>;
}

export type TransactionType = 'upi' | 'neft' | 'imps' | 'rtgs' | 'internal';

export interface TransactionResponse {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  transaction_type: TransactionType | string;
  upi_ref?: string | null;
  is_synthetic: boolean;
  source_holder_name?: string | null;
  destination_holder_name?: string | null;
}

export type InvestigationStatus = 'new' | 'investigating' | 'escalated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PatternType =
  | 'fan_out'
  | 'fan_in'
  | 'rapid_pass_through'
  | 'fragmentation'
  | 'velocity'
  | 'circular_movement'
  | 'shared_device'
  | 'new_intermediary';

export interface PatternResponse {
  id: string;
  pattern_type: PatternType | string;
  severity: RiskLevel | string;
  confidence: number;
  transaction_ids_json: string[];
  entities_json: string[];
  explanation: string;
}

export interface RiskSignalResponse {
  id: string;
  category: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface EvidenceResponse {
  id: string;
  pattern_id?: string | null;
  description: string;
  transaction_ids_json: string[];
  created_at: string;
}

export interface CaseNoteResponse {
  id: string;
  investigation_id: string;
  user_id: string;
  user_name?: string | null;
  note_text: string;
  created_at: string;
}

export interface CaseActionResponse {
  id: string;
  investigation_id: string;
  user_id: string;
  user_name?: string | null;
  action_type: string;
  previous_value?: string | null;
  new_value: string;
  created_at: string;
}

export interface CaseGenesisResponse {
  primary_trigger: string;
  triggering_entity: string;
  time_window: string;
  suspicious_transaction_count: number;
  connected_entity_count: number;
  detected_pattern_types: string[];
  total_amount: number;
  key_evidence_signals: string[];
}

export interface DashboardSummaryResponse {
  suspicious_networks: number;
  high_risk_accounts: number;
  flagged_transactions: number;
  amount_under_investigation: number;
  active_investigations: number;
  escalated_cases: number;
}

export interface InvestigationListItem {
  id: string;
  title: string;
  status: InvestigationStatus | string;
  risk_score: number;
  risk_level: RiskLevel | string;
  created_at: string;
  updated_at: string;
  time_window_start: string;
  time_window_end: string;
  total_flow_amount: number;
  scenario_tag: string;
  entities_count: number;
  patterns_count: number;
  top_patterns: string[];
}

export interface InvestigationDetailResponse {
  id: string;
  title: string;
  status: InvestigationStatus | string;
  risk_score: number;
  risk_level: RiskLevel | string;
  created_at: string;
  updated_at: string;
  time_window_start: string;
  time_window_end: string;
  total_flow_amount: number;
  scenario_tag: string;
  entities: AccountSummaryResponse[];
  patterns: PatternResponse[];
  risk_signals: RiskSignalResponse[];
  evidence_items: EvidenceResponse[];
  notes: CaseNoteResponse[];
  actions: CaseActionResponse[];
  case_genesis?: CaseGenesisResponse | null;
}

export interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: string;
    severity: string;
    [key: string]: unknown;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  data: {
    edgeType: string;
    amount?: number;
    currency?: string;
    timestamp?: string;
    transactionId?: string;
    label?: string;
    [key: string]: unknown;
  };
}

export interface GraphPayloadResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineEventResponse {
  id: string;
  index: number;
  timestamp: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  transaction_type: string;
  is_high_value: boolean;
}

export interface MoneyHopResponse {
  hop_number: number;
  from_account_id: string;
  to_account_id: string;
  transaction_id: string;
  amount: number;
  timestamp: string;
  cumulative_amount: number;
  elapsed_time_minutes: number;
  hop_elapsed_minutes?: number;
}

export interface FollowMoneyResponse {
  source_account_id: string;
  total_hops: number;
  hops: MoneyHopResponse[];
}

export interface AskAssistantResponse {
  answer: string;
  grounded: boolean;
  model: string;
  citations: string[];
  fallback_used: boolean;
}

export interface InvestigationReportResponse {
  investigation_id: string;
  title: string;
  status: string;
  risk_score: number;
  risk_level: string;
  generated_at: string;
  case_summary: string;
  entities_involved: Record<string, unknown>[];
  total_amount_involved: number;
  detected_patterns: Record<string, unknown>[];
  timeline_summary: Record<string, unknown>[];
  risk_factors: Record<string, unknown>[];
  money_trail_summary: Record<string, unknown>[];
  investigator_notes: Record<string, unknown>[];
  status_history: Record<string, unknown>[];
  recommended_action: string;
}
