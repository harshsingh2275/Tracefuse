"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Users,
  AlertTriangle,
  IndianRupee,
  Activity,
  Flame,
  Search,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { api } from "@/lib/api";
import { DashboardSummaryResponse, InvestigationListItem } from "@tracefuse/shared";
import { Navbar } from "@/components/Navbar";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PatternBadge } from "@/components/PatternBadge";
import { EmptyState } from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, invData] = await Promise.all([
        api.getDashboardSummary(),
        api.getInvestigations(),
      ]);
      setSummary(sumData);
      setInvestigations(invData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Search
  const filteredInvestigations = investigations
    .filter((inv) => {
      if (statusFilter !== "all" && inv.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inv.title.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          inv.scenario_tag.toLowerCase().includes(q) ||
          inv.top_patterns.some((p) => p.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => (sortAsc ? a.risk_score - b.risk_score : b.risk_score - a.risk_score));

  // Risk Distribution Chart Data
  const riskDistributionData = [
    { name: "Low", count: investigations.filter((i) => i.risk_level === "low").length, color: "#6B655A" },
    { name: "Medium", count: investigations.filter((i) => i.risk_level === "medium").length, color: "#B8792F" },
    { name: "High", count: investigations.filter((i) => i.risk_level === "high").length, color: "#B8792F" },
    { name: "Critical", count: investigations.filter((i) => i.risk_level === "critical").length, color: "#8C2F2F" },
  ];

  // Top Patterns Distribution Data
  const patternCounts: Record<string, number> = {};
  investigations.forEach((inv) => {
    inv.top_patterns.forEach((p) => {
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    });
  });
  const patternChartData = Object.entries(patternCounts).map(([pattern, count]) => ({
    name: pattern.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-severity-critical shrink-0" />
              <div>
                <div className="text-sm font-semibold text-severity-critical">Connection Error</div>
                <div className="text-xs text-ink-secondary">{error}</div>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-severity-critical text-xs rounded-lg border border-red-200 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Flagship Case Hero Callout */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-border-warm p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wider text-navy bg-navy-subtle border border-navy/20 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                FLAGSHIP INVESTIGATION CASE
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-primary tracking-tight font-serif">
                Multi-Hop Syndicate: ₹8.4L Dispersion & Circular Kickback
              </h2>
              <p className="text-xs md:text-sm text-ink-secondary leading-relaxed font-sans">
                High-confidence multi-pattern nexus combining <strong>5 rapid fan-out hops</strong>,{" "}
                <strong>3 shared-device accounts</strong>, 2-hop rapid layering, and a closed-loop circular kickback returning to the syndicate origin.
              </p>
            </div>

            <Link
              href="/investigations/inv_flagship_demo?tab=graph"
              className="px-5 py-3.5 bg-navy hover:bg-navy-hover text-white font-sans text-sm font-semibold rounded-xl transition-all shadow-md shadow-navy/20 flex items-center gap-2 shrink-0 group cursor-pointer"
            >
              <span>Explore Flagship Graph</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Operational Metrics */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-ink-primary">
              Financial Crime Operational Metrics
            </h3>
            <span className="text-[11px] text-ink-secondary font-medium">Live Surveillance Feed</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Suspicious Networks"
              value={loading ? "..." : summary?.suspicious_networks ?? 7}
              subtitle="Active Syndicates"
              icon={Network}
              variant="critical"
            />
            <MetricCard
              title="High-Risk Accounts"
              value={loading ? "..." : summary?.high_risk_accounts ?? 18}
              subtitle="Score >= 60"
              icon={Users}
              variant="warning"
            />
            <MetricCard
              title="Flagged Transactions"
              value={loading ? "..." : summary?.flagged_transactions ?? 41}
              subtitle="Detector Firings"
              icon={AlertTriangle}
              variant="critical"
            />
            <MetricCard
              title="Flow Under Invest."
              value={
                loading
                  ? "..."
                  : `₹${((summary?.amount_under_investigation ?? 1570000) / 100000).toFixed(1)}L`
              }
              subtitle="Active Flow"
              icon={IndianRupee}
              variant="default"
            />
            <MetricCard
              title="Active Cases"
              value={loading ? "..." : summary?.active_investigations ?? 7}
              subtitle="Under Review"
              icon={Activity}
              variant="default"
            />
            <MetricCard
              title="Escalated to SAR"
              value={loading ? "..." : summary?.escalated_cases ?? 2}
              subtitle="Reg. Action"
              icon={Flame}
              variant="critical"
            />
          </div>
        </section>

        {/* Main Workspace Layout (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Case Queue Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-ink-primary tracking-tight">
                  Investigation Case Queue
                </h3>
                <p className="text-xs text-ink-secondary">
                  Prioritized by composite heuristic risk score and typology velocity
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-white border border-border-warm p-1 rounded-xl shadow-sm text-xs font-sans">
                {["all", "new", "investigating", "escalated", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer font-medium ${
                      statusFilter === st
                        ? "bg-navy text-white shadow-sm"
                        : "text-ink-secondary hover:text-ink-primary hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by case title, entity name, ID, or pattern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-border-warm rounded-xl text-xs text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="px-3 py-2 bg-white border border-border-warm text-ink-primary hover:bg-slate-50 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Toggle Risk Score Sort"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-navy" />
                <span>{sortAsc ? "Lowest Risk" : "Highest Risk"}</span>
              </button>
            </div>

            {/* Case List Table */}
            <div className="bg-white border border-border-warm rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-ink-secondary text-[11px] uppercase tracking-wider border-b border-border-warm font-medium">
                    <tr>
                      <th className="py-3 px-4">Case Title & Entity Nexus</th>
                      <th className="py-3 px-4">Detected Patterns</th>
                      <th className="py-3 px-4">Risk Score</th>
                      <th className="py-3 px-4">Total Flow</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-warm">
                    {loading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-48 mb-1" /><div className="h-3 bg-slate-200 rounded w-24" /></td>
                          <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded w-32" /></td>
                          <td className="py-4 px-4"><div className="h-6 bg-slate-200 rounded w-20" /></td>
                          <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded w-16" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-7 bg-slate-200 rounded w-24 ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredInvestigations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8">
                          <EmptyState
                            title="No Investigations Matched"
                            description="No cases found matching your active status and search filters."
                            actionLabel="Reset Search & Filters"
                            onAction={() => {
                              setStatusFilter("all");
                              setSearchQuery("");
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredInvestigations.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <Link href={`/investigations/${inv.id}?tab=graph`} className="block">
                              <div className="font-semibold text-slate-900 group-hover:text-navy transition-colors">
                                {inv.title}
                              </div>
                              <div className="text-[11px] text-ink-secondary flex items-center gap-2 mt-0.5">
                                <span className="font-mono">({inv.id})</span>
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
                              className="px-3 py-1.5 bg-navy-subtle hover:bg-navy text-navy hover:text-white border border-navy/20 hover:border-navy rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Investigate</span>
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
          </div>

          {/* Sidebar Column: Visual Analytics & Breakdown (1 Col) */}
          <div className="space-y-6">
            {/* Risk Severity Breakdown Chart */}
            <div className="bg-white border border-border-warm p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold font-serif text-ink-primary tracking-tight">
                  Risk Band Distribution
                </h4>
                <p className="text-xs text-ink-secondary">Case volume segmented by severity score</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistributionData}>
                    <XAxis dataKey="name" stroke="#6B655A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6B655A" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E0D6", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pattern Type Frequency Chart */}
            <div className="bg-white border border-border-warm p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold font-serif text-ink-primary tracking-tight">
                  Detected Pattern Signatures
                </h4>
                <p className="text-xs text-ink-secondary">Typology occurrences across active dossiers</p>
              </div>

              <div className="space-y-2.5 text-xs font-sans">
                {patternChartData.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-2 border-b border-border-warm last:border-0 last:pb-0">
                    <span className="text-ink-primary capitalize font-medium">{p.name}</span>
                    <span className="font-mono font-bold text-navy bg-navy-subtle px-2 py-0.5 rounded text-[11px]">
                      {p.count} cases
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
