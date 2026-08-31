/**
 * TraceFuse Frontend API Client
 * Typed communication with FastAPI Backend
 */
import {
  DashboardSummaryResponse,
  InvestigationListItem,
  InvestigationDetailResponse,
  GraphPayloadResponse,
  TimelineEventResponse,
  EvidenceResponse,
  FollowMoneyResponse,
  AskAssistantResponse,
  InvestigationReportResponse,
  AccountSummaryResponse,
  TransactionResponse,
} from "@tracefuse/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.detail || `API request failed with status ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API Client Error] ${endpoint}:`, message);
    throw new Error(message);
  }
}

export const api = {
  // Dashboard Summary (Section 6)
  getDashboardSummary: (): Promise<DashboardSummaryResponse> => {
    return fetchJson<DashboardSummaryResponse>("/dashboard/summary");
  },

  // Investigations List
  getInvestigations: (status?: string, minRisk?: number): Promise<InvestigationListItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (minRisk !== undefined) params.append("min_risk", minRisk.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<InvestigationListItem[]>(`/investigations${query}`);
  },

  // Case Detail
  getInvestigationDetail: (id: string): Promise<InvestigationDetailResponse> => {
    return fetchJson<InvestigationDetailResponse>(`/investigations/${id}`);
  },

  // Graph Payload (React Flow)
  getInvestigationGraph: (id: string): Promise<GraphPayloadResponse> => {
    return fetchJson<GraphPayloadResponse>(`/investigations/${id}/graph`);
  },

  // Timeline Stream
  getInvestigationTimeline: (id: string): Promise<TimelineEventResponse[]> => {
    return fetchJson<TimelineEventResponse[]>(`/investigations/${id}/timeline`);
  },

  // Evidence List
  getInvestigationEvidence: (id: string): Promise<EvidenceResponse[]> => {
    return fetchJson<EvidenceResponse[]>(`/investigations/${id}/evidence`);
  },

  // Follow the Money (BFS Provenance)
  followTheMoney: (
    id: string,
    sourceAccountId: string,
    destinationAccountId?: string,
    maxHops: number = 6,
    minAmount?: number
  ): Promise<FollowMoneyResponse> => {
    return fetchJson<FollowMoneyResponse>(`/investigations/${id}/follow-money`, {
      method: "POST",
      body: JSON.stringify({
        source_account_id: sourceAccountId,
        destination_account_id: destinationAccountId,
        max_hops: maxHops,
        min_amount: minAmount,
      }),
    });
  },

  // Grounded AI Assistant Query
  askAssistant: (id: string, question: string): Promise<AskAssistantResponse> => {
    return fetchJson<AskAssistantResponse>(`/investigations/${id}/ask`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },

  // Status Change Workflow
  updateStatus: (id: string, status: string, userId: string = "usr_analyst_01") => {
    return fetchJson<{ investigation_id: string; previous_status: string; new_status: string }>(
      `/investigations/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, user_id: userId }),
      }
    );
  },

  // Add Case Note
  addNote: (id: string, noteText: string, userId: string = "usr_analyst_01") => {
    return fetchJson(`/investigations/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note_text: noteText, user_id: userId }),
    });
  },

  // Printable Report
  getInvestigationReport: (id: string): Promise<InvestigationReportResponse> => {
    return fetchJson<InvestigationReportResponse>(`/investigations/${id}/report`);
  },

  // Account Profile
  getAccountDetail: (id: string): Promise<AccountSummaryResponse> => {
    return fetchJson<AccountSummaryResponse>(`/accounts/${id}`);
  },

  // Transaction Record
  getTransactionDetail: (id: string): Promise<TransactionResponse> => {
    return fetchJson<TransactionResponse>(`/transactions/${id}`);
  },
};
