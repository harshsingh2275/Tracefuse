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
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const errorMessage =
        errorBody.detail ||
        `API request failed with status ${res.status}: ${res.statusText}`;

      // Gracefully redirect to /login on 401 exactly once to prevent infinite reload loops
      if (
        res.status === 401 &&
        typeof window !== "undefined" &&
        window.location.pathname !== "/login" &&
        !endpoint.startsWith("/auth") &&
        !endpoint.startsWith("/api/auth")
      ) {
        const redirectKey = "tf_auth_redirected";
        const alreadyRedirected = sessionStorage.getItem(redirectKey);
        if (!alreadyRedirected) {
          sessionStorage.setItem(redirectKey, "true");
          // Clear frontend cookie so Next.js middleware doesn't bounce back to dashboard
          document.cookie =
            "tracefuse_jwt=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?from=${encodeURIComponent(currentPath)}&expired=true`;
        }
      }

      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API Client Error] ${endpoint}:`, message);
    throw err instanceof Error ? err : new Error(message);
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

  // Auth Operations
  login: async (passcode: string): Promise<{ status: string }> => {
    // 1. Direct fetch to FastAPI backend if cross-origin, ensuring browser receives cross-origin SameSite=None cookie
    if (API_BASE_URL && !API_BASE_URL.startsWith("/")) {
      try {
        await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode }),
          credentials: "include",
        });
      } catch (e) {
        console.warn("[API] Direct cross-origin auth warning:", e);
      }
    }

    // 2. Next.js route handler to set local session cookie for Next.js middleware route gating
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("tf_auth_redirected");
    }
    return res.json();
  },

  demoLogin: async (): Promise<{ status: string }> => {
    // 1. Direct fetch to FastAPI backend for cross-origin cookie
    if (API_BASE_URL && !API_BASE_URL.startsWith("/")) {
      try {
        await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: "demo2026" }),
          credentials: "include",
        });
      } catch (e) {
        console.warn("[API] Direct cross-origin demo auth warning:", e);
      }
    }

    // 2. Next.js route handler
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Demo login failed");
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("tf_auth_redirected");
    }
    return res.json();
  },

  logout: async (): Promise<void> => {
    if (API_BASE_URL && !API_BASE_URL.startsWith("/")) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("tf_auth_redirected");
      document.cookie =
        "tracefuse_jwt=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  },
};
