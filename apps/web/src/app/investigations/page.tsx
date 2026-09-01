"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { InvestigationListItem } from "@tracefuse/shared";
import { Navbar } from "@/components/Navbar";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PatternBadge } from "@/components/PatternBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/LoadingSkeleton";
import { formatCaseCode } from "@/lib/formatters";

export default function InvestigationsDirectoryPage() {
  const [investigations, setInvestigations] = useState<InvestigationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"risk_desc" | "risk_asc" | "amount_desc" | "recent">("risk_desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInvestigations();
      setInvestigations(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load investigations directory.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "TraceFuse — Case Directory";
    fetchInvestigations();
  }, []);

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...investigations];

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((inv) => {
        const code = formatCaseCode(inv.id).toLowerCase();
        const title = inv.title.toLowerCase();
        const id = inv.id.toLowerCase();
        const patterns = inv.top_patterns.map((p) => p.toLowerCase()).join(" ");
        return code.includes(q) || title.includes(q) || id.includes(q) || patterns.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "risk_desc") return b.risk_score - a.risk_score;
      if (sortBy === "risk_asc") return a.risk_score - b.risk_score;
      if (sortBy === "amount_desc") return b.total_flow_amount - a.total_flow_amount;
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return result;
  }, [investigations, statusFilter, searchQuery, sortBy]);

  // Pagination Calculations
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedItems = filteredAndSorted.slice(startIndex, startIndex + pageSize);

  // Status counts for badge tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: investigations.length, new: 0, investigating: 0, escalated: 0, resolved: 0 };
    investigations.forEach((inv) => {
      const s = inv.status.toLowerCase();
      if (counts[s] !== undefined) {
        counts[s]++;
      }
    });
    return counts;
  }, [investigations]);

  return (
    <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header Hero Banner */}
        <section className="bg-white border border-border-warm rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wider text-navy bg-navy-subtle border border-navy/20 rounded-full">
                <Layers className="w-3.5 h-3.5 text-navy" />
                CASE DIRECTORY & FORENSIC ARCHIVE
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-ink-primary tracking-tight">
                Investigation Dossiers
              </h1>
              <p className="text-xs md:text-sm text-ink-secondary leading-relaxed font-sans">
                Comprehensive directory of algorithmic pattern detections, syndicate networks, and ongoing forensic AML investigations.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/investigations/inv_flagship_demo?tab=graph"
                className="px-4 py-2.5 bg-navy hover:bg-navy-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-navy/20 border border-navy flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Load Flagship Case (TF-091)</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 bg-severity-critical-bg border border-severity-critical-border rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-severity-critical shrink-0" />
              <div>
                <div className="text-sm font-semibold text-severity-critical">Directory Load Error</div>
                <div className="text-xs text-ink-secondary">{error}</div>
              </div>
            </div>
            <button
              onClick={fetchInvestigations}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-severity-critical text-xs rounded-lg border border-severity-critical-border flex items-center gap-1.5 transition-all cursor-pointer font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Main Content: Filters + Table + Pagination */}
        <section className="bg-white border border-border-warm rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
          {/* Top Filter & Search Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-2 border-b border-border-warm">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: "All Cases", count: statusCounts.all },
                { id: "new", label: "New", count: statusCounts.new },
                { id: "investigating", label: "Investigating", count: statusCounts.investigating },
                { id: "escalated", label: "Escalated", count: statusCounts.escalated },
                { id: "resolved", label: "Resolved", count: statusCounts.resolved },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-navy text-white shadow-sm"
                      : "text-ink-secondary hover:text-ink-primary hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      statusFilter === tab.id
                        ? "bg-navy-hover text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input and Sort Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search by case code, title, pattern..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-border-warm rounded-xl text-xs text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy focus:bg-white font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-border-warm rounded-xl text-xs text-ink-primary font-medium focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="risk_desc">Highest Risk First</option>
                <option value="risk_asc">Lowest Risk First</option>
                <option value="amount_desc">Highest Flow Amount</option>
                <option value="recent">Most Recent Genesis</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-xl border border-border-warm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans min-w-[780px]">
                <thead className="bg-slate-50 text-ink-secondary text-[11px] uppercase tracking-wider border-b border-border-warm font-medium">
                  <tr>
                    <th className="py-3 px-4 w-[42%] min-w-[280px]">Case Title & Entity Nexus</th>
                    <th className="py-3 px-4 w-[20%] min-w-[150px]">Detected Patterns</th>
                    <th className="py-3 px-4 whitespace-nowrap">Risk Score</th>
                    <th className="py-3 px-4 whitespace-nowrap">Total Flow</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-warm">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-64 bg-slate-200 mb-1.5" />
                          <Skeleton className="h-3 w-28 bg-slate-100" />
                        </td>
                        <td className="py-4 px-4"><Skeleton className="h-5 w-32 bg-slate-200 rounded" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-6 w-20 bg-slate-200 rounded" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-16 bg-slate-200" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-5 w-16 bg-slate-200 rounded" /></td>
                        <td className="py-4 px-4 text-right"><Skeleton className="h-7 w-24 bg-navy-subtle rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <EmptyState
                          title="No Case Dossiers Found"
                          description="No investigations match your active search terms and status filters."
                          actionLabel="Reset Search & Filters"
                          onAction={() => {
                            setStatusFilter("all");
                            setSearchQuery("");
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      >
                        <td className="py-3.5 px-4 w-[42%] min-w-[280px]">
                          <Link href={`/investigations/${inv.id}?tab=graph`} className="block">
                            <div
                              className="font-semibold text-slate-900 group-hover:text-navy transition-colors line-clamp-2 leading-snug"
                              title={inv.title}
                            >
                              {inv.title}
                            </div>
                            <div className="text-[11px] text-ink-secondary flex items-center gap-2 mt-1">
                              <span className="font-mono text-slate-500 font-medium">{formatCaseCode(inv.id)}</span>
                              <span>•</span>
                              <span>{inv.entities_count} accounts</span>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {inv.top_patterns.map((p) => (
                              <PatternBadge key={p} type={p} />
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <RiskBadge level={inv.risk_level} score={inv.risk_score} />
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          ₹{inv.total_flow_amount.toLocaleString("en-IN")}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={inv.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/investigations/${inv.id}?tab=graph`}
                            className="px-3 py-1.5 bg-navy-subtle hover:bg-navy text-navy hover:text-white border border-navy/20 hover:border-navy rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls Footer */}
          {!loading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-sans text-ink-secondary">
              <div>
                Showing <strong className="text-ink-primary font-mono">{startIndex + 1}</strong> to{" "}
                <strong className="text-ink-primary font-mono">{Math.min(startIndex + pageSize, totalItems)}</strong> of{" "}
                <strong className="text-ink-primary font-mono">{totalItems}</strong> investigations
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validPage <= 1}
                  className="p-1.5 rounded-lg border border-border-warm bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4 text-ink-primary" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === validPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-navy text-white shadow-sm"
                          : "border border-border-warm bg-white hover:bg-slate-50 text-ink-primary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage >= totalPages}
                  className="p-1.5 rounded-lg border border-border-warm bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4 text-ink-primary" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
