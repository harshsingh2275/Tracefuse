/**
 * TraceFuse Shared TypeScript Types
 * Mirroring Backend Data Models and API Payloads
 */

export type UserRole = 'investigator' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type AccountType = 'savings' | 'current' | 'merchant' | 'salary';

export interface Account {
  id: string;
  account_number: string;
  holder_name: string;
  account_type: AccountType;
  created_at: string;
  is_synthetic: boolean;
}

export type EntityType = 'person' | 'merchant' | 'beneficiary';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  metadata_json?: Record<string, unknown>;
}

export interface Device {
  id: string;
  device_fingerprint: string;
  device_type: string;
  first_seen_at: string;
}

export type IdentifierType = 'phone' | 'email' | 'upi_id';

export interface Identifier {
  id: string;
  type: IdentifierType;
  value: string;
}

export type TransactionType = 'upi' | 'neft' | 'imps' | 'rtgs' | 'internal';

export interface Transaction {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  transaction_type: TransactionType;
  upi_ref?: string;
  is_synthetic: boolean;
}

export type InvestigationStatus = 'new' | 'investigating' | 'escalated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Investigation {
  id: string;
  title: string;
  status: InvestigationStatus;
  risk_score: number;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
  time_window_start: string;
  time_window_end: string;
  total_flow_amount: number;
  scenario_tag: string;
}

export type PatternType =
  | 'fan_out'
  | 'fan_in'
  | 'rapid_pass_through'
  | 'fragmentation'
  | 'velocity'
  | 'circular_movement'
  | 'shared_device'
  | 'new_intermediary';

export interface Pattern {
  id: string;
  investigation_id: string;
  pattern_type: PatternType;
  severity: RiskLevel;
  confidence: number;
  transaction_ids_json: string[];
  entities_json: string[];
  explanation: string;
}

export interface RiskSignal {
  id: string;
  investigation_id: string;
  category: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  pattern_id?: string | null;
  description: string;
  transaction_ids_json: string[];
  created_at: string;
}

export interface CaseNote {
  id: string;
  investigation_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
}

export interface DashboardSummary {
  suspicious_networks: number;
  high_risk_accounts: number;
  flagged_transactions: number;
  amount_under_investigation: number;
  active_investigations: number;
  escalated_cases: number;
}
