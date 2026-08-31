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
      fetchData();
    }
  }, [investigationId]);

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
      <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 font-mono">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Loading Investigation Dossier ({investigationId})...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111622] border border-red-500/30 p-6 rounded-2xl text-center space-y-4">
            <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white font-mono">Investigation Error</h3>
            <p className="text-xs text-gray-400">{error || "Case record not found."}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Case Queue</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-3 py-1.5 bg-[#111622] hover:bg-[#182030] border border-[#1f293d] rounded-lg text-xs font-mono text-gray-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Case Dossier Main Header */}
        <div className="bg-[#111622] border border-[#1f293d] p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  {detail.id}
                </span>
                <span className="text-gray-600">•</span>
                <span className="font-mono text-xs text-gray-400 capitalize">
                  {detail.scenario_tag.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                {detail.title}
              </h1>
            </div>

            {/* Risk Badge & Status Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge level={detail.risk_level} score={detail.risk_score} className="py-1.5 px-3 text-xs" />

              <div className="flex items-center gap-2 bg-[#0a0d14] border border-[#1f293d] px-3 py-1.5 rounded-xl font-mono text-xs">
                <span className="text-gray-500">Status:</span>
                <select
                  value={detail.status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer capitalize"
                >
                  <option value="new" className="bg-[#111622]">New</option>
                  <option value="investigating" className="bg-[#111622]">Investigating</option>
                  <option value="escalated" className="bg-[#111622]">Escalated</option>
                  <option value="resolved" className="bg-[#111622]">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-800/80 font-mono text-xs">
            <div>
              <span className="text-gray-500 text-[10px] uppercase">Money Flow at Risk</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                ₹{detail.total_flow_amount.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase">Entities in Scope</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {detail.entities.length} Accounts / Devices
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase">Detected Patterns</span>
              <div className="text-sm font-bold text-blue-400 mt-0.5">
                {detail.patterns.length} Active Signatures
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase">Case Genesis Time</span>
              <div className="text-sm font-bold text-gray-300 mt-0.5">
                {new Date(detail.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </div>

        {/* Case Genesis Drawer (Section 5F) */}
        {detail.case_genesis && (
          <div className="bg-gradient-to-r from-blue-950/20 via-[#111622] to-[#111622] border border-blue-500/20 rounded-xl p-4 shadow-lg">
            <button
              onClick={() => setShowGenesis(!showGenesis)}
              className="w-full flex items-center justify-between text-xs font-mono font-semibold text-blue-400 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>CASE GENESIS & DETECTION TRIGGER (SECTION 5F)</span>
              </div>
              {showGenesis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGenesis && (
              <div className="mt-3 pt-3 border-t border-blue-500/15 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <div className="text-gray-400 font-mono text-[11px]">Primary Heuristic Trigger:</div>
                  <p className="text-gray-200 leading-relaxed font-semibold">
                    {detail.case_genesis.primary_trigger}
                  </p>
                  <div className="text-gray-500 font-mono text-[11px] pt-1">
                    Triggering Entity: <strong className="text-gray-300">{detail.case_genesis.triggering_entity}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-gray-400 font-mono text-[11px]">Corroborating Evidence Signals:</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
                    {detail.case_genesis.key_evidence_signals.map((sig, idx) => (
                      <li key={idx}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-[#1f293d] pb-2 overflow-x-auto">
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
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/40"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-400"
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

        {/* Tab 2: Timeline Stream */}
        {activeTab === "timeline" && (
          <section className="space-y-4">
            <InvestigationTimeline events={timelineEvents} />
          </section>
        )}

        {/* Tab 3: Patterns & Risk Signals */}
        {activeTab === "patterns" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detected Pattern Cards (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold font-mono text-white tracking-tight">
                Detected Pattern Signatures ({detail.patterns.length})
              </h3>

              <div className="space-y-4">
                {detail.patterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="bg-[#111622] border border-[#1f293d] p-5 rounded-xl space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <PatternBadge type={pat.pattern_type} className="text-xs py-1 px-2.5" />
                        <span className="text-xs font-mono text-gray-400">
                          Confidence: {(pat.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <RiskBadge level={pat.severity} showScore={false} />
                    </div>

                    <p className="text-xs text-gray-200 leading-relaxed font-sans">
                      {pat.explanation}
                    </p>

                    <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="text-gray-500">Cited Transactions:</span>
                      {pat.transaction_ids_json.slice(0, 4).map((tid) => (
                        <span key={tid} className="px-1.5 py-0.5 rounded bg-[#0a0d14] border border-gray-800 text-blue-300">
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
              <h3 className="text-base font-bold font-mono text-white tracking-tight">
                Composite Risk Breakdown
              </h3>

              <div className="bg-[#111622] border border-[#1f293d] p-5 rounded-xl space-y-4 shadow-lg font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <span className="text-gray-400">Composite Score:</span>
                  <span className="text-xl font-bold text-red-400">{detail.risk_score} / 100</span>
                </div>

                <div className="space-y-3">
                  {detail.risk_signals.map((sig) => (
                    <div key={sig.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-300 capitalize">{sig.category.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-white">
                          {sig.score.toFixed(0)} pts (wt {sig.weight})
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
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

        {/* Tab 4: Evidence Locker */}
        {activeTab === "evidence" && (
          <section className="bg-[#111622] border border-[#1f293d] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#182030] border-b border-[#1f293d]">
              <h3 className="text-sm font-bold font-mono text-white">
                Structured Evidence Items ({detail.evidence_items.length})
              </h3>
            </div>

            <div className="divide-y divide-[#1f293d] font-sans text-xs">
              {detail.evidence_items.map((item, idx) => (
                <div key={item.id} className="p-4 hover:bg-[#182030]/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-blue-400 font-semibold">
                      Evidence Item #{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-gray-200 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[11px]">
                    <span className="text-gray-500">Transactions:</span>
                    {item.transaction_ids_json.map((tid) => (
                      <span key={tid} className="px-1.5 py-0.5 bg-[#0a0d14] border border-gray-800 text-gray-300 rounded">
                        {tid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 5: Case Notes & Audit */}
        {activeTab === "notes" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List & Input (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold font-mono text-white">Investigator Case Notes</h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="bg-[#111622] border border-[#1f293d] p-4 rounded-xl space-y-3">
                <textarea
                  placeholder="Record investigative finding, subpoena note, or freeze confirmation..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? "Saving..." : "Add Note"}</span>
                  </button>
                </div>
              </form>

              {/* Notes Feed */}
              <div className="space-y-3">
                {detail.notes.length === 0 ? (
                  <div className="p-8 text-center bg-[#111622] border border-[#1f293d] rounded-xl text-gray-500 font-mono text-xs">
                    No notes recorded on this case yet.
                  </div>
                ) : (
                  detail.notes.map((n) => (
                    <div key={n.id} className="bg-[#111622] border border-[#1f293d] p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-blue-400 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          {n.user_name || n.user_id}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-sans leading-relaxed">{n.note_text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Case Action Audit Log (1 Col) */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-mono text-white">Status Audit Trail</h3>

              <div className="bg-[#111622] border border-[#1f293d] p-4 rounded-xl space-y-3 font-mono text-xs">
                {detail.actions.map((act) => (
                  <div key={act.id} className="pb-3 border-b border-gray-800 last:border-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 uppercase">{act.action_type}</span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(act.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white">
                      Status changed: <span className="text-gray-400">{act.previous_value}</span> ➔ <strong className="text-blue-400 capitalize">{act.new_value}</strong>
                    </div>
                    <div className="text-[10px] text-gray-500">By {act.user_name || act.user_id}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function InvestigationDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex items-center justify-center font-mono text-xs text-gray-400">
          Loading Investigation Dossier...
        </div>
      }
    >
      <InvestigationDetailContent />
    </React.Suspense>
  );
}
