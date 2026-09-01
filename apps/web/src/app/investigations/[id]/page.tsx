"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Clock,
  ShieldAlert,
  FileText,
  MessageSquare,
  ArrowLeft,
  Share2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  UserCheck,
  ExternalLink,
  Flame,
  GitFork,
} from "lucide-react";
import { Node, Edge } from "@xyflow/react";
import { api } from "@/lib/api";
import {
  InvestigationDetailResponse,
  GraphPayloadResponse,
  TimelineEventResponse,
  PatternResponse,
  RiskSignalResponse,
  EvidenceResponse,
  CaseNoteResponse,
} from "@tracefuse/shared";
import { Navbar } from "@/components/Navbar";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PatternBadge } from "@/components/PatternBadge";
import { InvestigationGraph } from "@/components/graph/InvestigationGraph";
import { InvestigationTimeline } from "@/components/timeline/InvestigationTimeline";
import { FollowMoneyController } from "@/components/graph/FollowMoneyController";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { EmptyState } from "@/components/EmptyState";
import { InvestigationSkeleton } from "@/components/LoadingSkeleton";
import { formatCaseCode } from "@/lib/formatters";

function InvestigationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = params.id as string;

  const [detail, setDetail] = useState<InvestigationDetailResponse | null>(null);
  const [graphPayload, setGraphPayload] = useState<GraphPayloadResponse | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventResponse[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "graph");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showGenesis, setShowGenesis] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [detailData, graphData, timelineData] = await Promise.all([
        api.getInvestigationDetail(investigationId),
        api.getInvestigationGraph(investigationId),
        api.getInvestigationTimeline(investigationId),
      ]);
      setDetail(detailData);
      setGraphPayload(graphData);
      setTimelineEvents(timelineData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load investigation dossier.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      document.title = detail
        ? `TraceFuse — ${formatCaseCode(detail.id)}`
        : `TraceFuse — ${formatCaseCode(investigationId)}`;
      fetchData();
    }
  }, [investigationId, detail?.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      await api.updateStatus(investigationId, newStatus);
      setDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: unknown) {
      alert("Failed to update status: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      const createdNote = (await api.addNote(investigationId, newNote.trim())) as CaseNoteResponse;
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              notes: [...prev.notes, createdNote],
            }
          : null
      );
      setNewNote("");
    } catch (err: unknown) {
      alert("Failed to add note: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
          <InvestigationSkeleton />
        </main>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-border-warm p-8 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-severity-critical-bg border border-severity-critical-border text-severity-critical flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-ink-primary">Unable to Load Dossier</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {error || `We couldn't retrieve the investigation dossier for case "${investigationId}". Please verify the case identifier or retry.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-navy/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
              >
                Back to Case Queue
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
        {/* Breadcrumb & Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-ink-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Case Queue</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-navy/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Copilot</span>
            </button>
            <Link
              href={`/investigations/${investigationId}/report`}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-border-warm rounded-lg text-xs font-medium text-ink-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-navy" />
              <span>Compliance Report</span>
            </Link>
          </div>
        </div>

        {/* Case Dossier Main Header */}
        <section className="bg-white border border-border-warm p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="min-w-0 max-w-4xl space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs text-navy font-semibold">{formatCaseCode(detail.id)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-ink-secondary capitalize font-medium">
                  {detail.scenario_tag.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl leading-tight font-bold font-serif text-ink-primary tracking-tight text-balance">
                {detail.title}
              </h1>
              <p className="text-xs text-ink-secondary">
                Financial crime forensic investigation dossier <span className="text-slate-300">/</span> internal intelligence
              </p>
            </div>

            <div className="lg:min-w-48 flex flex-row lg:flex-col items-start lg:items-end gap-3">
              <RiskBadge level={detail.risk_level} score={detail.risk_score} className="py-2 px-3.5 text-xs shadow-sm" />
              <div className="flex items-center gap-2 bg-slate-50 border border-border-warm px-3.5 py-2 rounded-lg text-xs">
                <span className="text-ink-secondary">Status</span>
                <select
                  value={detail.status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent text-ink-primary font-semibold focus:outline-none cursor-pointer capitalize"
                >
                  <option value="new" className="bg-white">New</option>
                  <option value="investigating" className="bg-white">Investigating</option>
                  <option value="escalated" className="bg-white">Escalated</option>
                  <option value="resolved" className="bg-white">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric 4-Column Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 pt-6 border-t border-border-warm">
            <div className="pr-4 lg:border-r border-border-warm">
              <span className="text-ink-secondary text-[11px] uppercase tracking-wider font-medium">Money at Risk</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-700 mt-1.5">
                ₹{detail.total_flow_amount.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="px-0 sm:px-4 lg:border-r border-border-warm">
              <span className="text-ink-secondary text-[11px] uppercase tracking-wider font-medium">Entities in Scope</span>
              <div className="text-base md:text-lg font-bold text-ink-primary mt-1.5">
                {detail.entities.length} Accounts / Devices
              </div>
            </div>
            <div className="pt-4 sm:pt-0 pr-4 sm:px-4 lg:border-r border-border-warm">
              <span className="text-ink-secondary text-[11px] uppercase tracking-wider font-medium">Active Signatures</span>
              <div className="text-base md:text-lg font-bold text-ink-primary mt-1.5">
                {detail.patterns.length} Detected Patterns
              </div>
            </div>
            <div className="pt-4 sm:pt-0 sm:px-4">
              <span className="text-ink-secondary text-[11px] uppercase tracking-wider font-medium">Case Genesis Time</span>
              <div className="text-base md:text-lg font-bold font-mono text-ink-secondary mt-1.5">
                {new Date(detail.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Case Genesis Drawer (Sentence Case Header) */}
        {detail.case_genesis && (
          <div className="bg-white border border-border-warm rounded-2xl p-5 md:p-6 shadow-sm">
            <button
              onClick={() => setShowGenesis(!showGenesis)}
              className="w-full flex items-center justify-between text-xs font-semibold text-navy cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-navy" />
                <span className="font-serif text-sm font-bold text-ink-primary">Case Genesis & Detection Trigger</span>
              </div>
              {showGenesis ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showGenesis && (
              <div className="mt-5 pt-5 border-t border-border-warm grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 text-xs font-sans">
                <div className="rounded-xl border border-navy/15 bg-navy-subtle/50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-navy text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-navy" />
                    Primary Heuristic Trigger
                  </div>
                  <p className="text-ink-primary text-sm leading-relaxed font-medium">
                    {detail.case_genesis.primary_trigger}
                  </p>
                  <div className="pt-3 border-t border-navy/15 text-ink-secondary text-xs">
                    Triggering Entity: <strong className="text-ink-primary ml-1.5">{detail.case_genesis.triggering_entity}</strong>
                  </div>
                </div>

                <div className="px-1 lg:px-2 space-y-3">
                  <div className="text-ink-secondary text-xs font-semibold">
                    Corroborating Evidence Signals
                  </div>
                  <ul className="space-y-2.5 text-ink-primary text-xs leading-relaxed">
                    {detail.case_genesis.key_evidence_signals.map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-navy" />
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-border-warm pb-2 overflow-x-auto whitespace-nowrap">
          {[
            { id: "graph", label: "Network Graph", icon: Layers, count: graphPayload?.nodes.length },
            { id: "follow_money", label: "Follow the Money", icon: GitFork },
            { id: "timeline", label: "Timeline Flow", icon: Clock, count: timelineEvents.length },
            { id: "patterns", label: "Patterns & Risk", icon: AlertTriangle, count: detail.patterns.length },
            { id: "evidence", label: "Evidence Locker", icon: FileText, count: detail.evidence_items.length },
            { id: "notes", label: "Case Notes & Audit", icon: MessageSquare, count: detail.notes.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-navy text-white shadow-md shadow-navy/20"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-navy-hover text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Network Graph */}
        {activeTab === "graph" && graphPayload && (
          <section className="space-y-4">
            <InvestigationGraph
              initialNodes={graphPayload.nodes as Node[]}
              initialEdges={graphPayload.edges as Edge[]}
              investigationId={investigationId}
              accounts={detail.entities}
            />
          </section>
        )}

        {/* Tab 2: Dedicated Follow the Money Tab */}
        {activeTab === "follow_money" && graphPayload && (
          <section className="space-y-4">
            <FollowMoneyController
              investigationId={investigationId}
              accounts={detail.entities}
            />
            <InvestigationGraph
              initialNodes={graphPayload.nodes as Node[]}
              initialEdges={graphPayload.edges as Edge[]}
              investigationId={investigationId}
              accounts={detail.entities}
            />
          </section>
        )}

        {/* Tab 3: Timeline Stream */}
        {activeTab === "timeline" && (
          <section className="space-y-4">
            <InvestigationTimeline events={timelineEvents} accounts={detail.entities} />
          </section>
        )}

        {/* Tab 4: Patterns & Risk Signals */}
        {activeTab === "patterns" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detected Pattern Cards (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold font-serif text-ink-primary tracking-tight">
                Detected Pattern Signatures ({detail.patterns.length})
              </h3>

              <div className="space-y-4">
                {detail.patterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="bg-white border border-border-warm p-5 md:p-6 rounded-2xl space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <PatternBadge type={pat.pattern_type} className="text-xs py-1 px-2.5" />
                        <span className="text-xs text-ink-secondary">
                          Confidence: {(pat.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <RiskBadge level={pat.severity} showScore={false} />
                    </div>

                    <p className="text-xs text-ink-primary leading-relaxed font-sans">
                      {pat.explanation}
                    </p>

                    <div className="pt-2.5 border-t border-border-warm flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-ink-secondary text-[11px]">Cited Transactions:</span>
                      {pat.transaction_ids_json.slice(0, 4).map((tid) => (
                        <span
                          key={tid}
                          className="px-1.5 py-0.5 rounded bg-slate-100 border border-border-warm text-navy font-mono text-[10px]"
                        >
                          {tid}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factor Breakdown (1 Col) */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-serif text-ink-primary tracking-tight">
                Composite Risk Breakdown
              </h3>

              <div className="bg-white border border-border-warm p-5 md:p-6 rounded-2xl space-y-4 shadow-sm text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                  <span className="text-ink-secondary">Composite Score:</span>
                  <span className="text-xl font-bold font-mono text-severity-critical">
                    {detail.risk_score} / 100
                  </span>
                </div>

                <div className="space-y-3">
                  {detail.risk_signals.map((sig) => (
                    <div key={sig.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-primary capitalize font-medium">
                          {sig.category.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold font-mono text-ink-primary">
                          {sig.score.toFixed(0)} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-navy h-full rounded-full"
                          style={{ width: `${Math.min(100, sig.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 5: Evidence Locker */}
        {activeTab === "evidence" && (
          <section className="bg-white border border-border-warm rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 bg-slate-50 border-b border-border-warm">
              <h3 className="text-sm font-bold font-serif text-ink-primary">
                Structured Evidence Items ({detail.evidence_items.length})
              </h3>
            </div>

            <div className="divide-y divide-border-warm font-sans text-xs">
              {detail.evidence_items.map((item, idx) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-navy font-semibold">
                      Evidence Item #{idx + 1}
                    </span>
                    <span className="font-mono text-[10px] text-ink-secondary">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-ink-primary leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-ink-secondary text-[11px]">Transactions:</span>
                    {item.transaction_ids_json.map((tid) => (
                      <span
                        key={tid}
                        className="px-1.5 py-0.5 bg-slate-100 border border-border-warm text-ink-primary font-mono text-[10px] rounded"
                      >
                        {tid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 6: Case Notes & Audit */}
        {activeTab === "notes" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List & Input (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold font-serif text-ink-primary">Investigator Case Notes</h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="bg-white border border-border-warm p-5 rounded-2xl space-y-3 shadow-sm">
                <textarea
                  placeholder="Record investigative finding, subpoena note, or freeze confirmation..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-border-warm rounded-xl text-xs text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy focus:bg-white font-sans"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="px-4 py-2 bg-navy hover:bg-navy-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? "Saving..." : "Add Note"}</span>
                  </button>
                </div>
              </form>

              {/* Notes Feed */}
              <div className="space-y-3">
                {detail.notes.length === 0 ? (
                  <EmptyState
                    title="No Case Notes Recorded"
                    description="Record initial findings, counterparty subpoenas, or regulatory status updates."
                  />
                ) : (
                  detail.notes.map((n) => (
                    <div key={n.id} className="bg-white border border-border-warm p-4 rounded-xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-navy font-semibold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          {n.user_name || n.user_id}
                        </span>
                        <span className="font-mono text-ink-secondary text-[10px]">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink-primary font-sans leading-relaxed">{n.note_text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Case Action Audit Log (1 Col) */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-serif text-ink-primary">Status Audit Trail</h3>

              <div className="bg-white border border-border-warm p-5 rounded-2xl space-y-3 text-xs shadow-sm">
                {detail.actions.map((act) => (
                  <div key={act.id} className="pb-3 border-b border-border-warm last:border-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-secondary uppercase font-medium">{act.action_type}</span>
                      <span className="font-mono text-ink-secondary text-[10px]">
                        {new Date(act.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-ink-primary">
                      Status changed: <span className="text-ink-secondary">{act.previous_value}</span> ➔{" "}
                      <strong className="text-navy capitalize">{act.new_value}</strong>
                    </div>
                    <div className="text-[10px] text-ink-secondary">By {act.user_name || act.user_id}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Floating AI Copilot Trigger Button */}
        {!showAiPanel && (
          <button
            onClick={() => setShowAiPanel(true)}
            className="fixed bottom-6 right-6 z-40 px-4 py-2.5 bg-navy hover:bg-navy-hover text-white rounded-full shadow-xl shadow-navy/30 border border-navy-hover font-medium text-xs flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>TraceFuse AI Copilot</span>
          </button>
        )}

        {/* Grounded AI Assistant Slide-Out Panel */}
        <AIAssistantPanel
          investigationId={investigationId}
          caseTitle={detail.title}
          isOpen={showAiPanel}
          onClose={() => setShowAiPanel(false)}
        />
      </main>
    </div>
  );
}

export default function InvestigationDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-linen text-ink-primary flex items-center justify-center text-xs text-ink-secondary">
          Loading investigation dossier...
        </div>
      }
    >
      <InvestigationDetailContent />
    </React.Suspense>
  );
}
