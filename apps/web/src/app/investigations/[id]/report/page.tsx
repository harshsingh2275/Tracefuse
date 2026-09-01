"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Building2,
  Clock,
  UserCheck,
  CheckCircle2,
  Download,
  Share2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { InvestigationReportResponse } from "@tracefuse/shared";
import { Navbar } from "@/components/Navbar";
import { ReportSkeleton } from "@/components/LoadingSkeleton";

export default function InvestigationReportPage() {
  const params = useParams();
  const investigationId = params.id as string;

  const [report, setReport] = useState<InvestigationReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInvestigationReport(investigationId);
      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load report dossier.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      document.title = `TraceFuse — Compliance Report (${investigationId.toUpperCase()})`;
      loadReport();
    }
  }, [investigationId]);

  const handlePrint = () => {
    window.print();
  };

  const getAccountName = (accId: string) => {
    if (!report?.entities_involved) return accId;
    const found = report.entities_involved.find(
      (e) => String(e.account_id) === accId || String(e.id) === accId
    );
    return found ? String(found.holder_name || found.name || accId) : accId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:px-8 md:py-8">
          <ReportSkeleton />
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-border-warm p-8 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-severity-critical-bg border border-severity-critical-border text-severity-critical flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-ink-primary">Unable to Compile Report</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {error || `We couldn't compile the regulatory compliance report for case "${investigationId}". Please check your connection or retry.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={loadReport}
                className="px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-navy/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Compilation</span>
              </button>
              <Link
                href={`/investigations/${investigationId}`}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
              >
                Back to Dossier
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen text-ink-primary flex flex-col font-sans print:bg-white print:text-black">
      {/* Hide Navbar in print view */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8 print:p-0 print:max-w-full">
        {/* Navigation & Print Actions Bar (Hidden when printing) */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            href={`/investigations/${investigationId}`}
            className="inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-ink-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Investigation Dossier</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-navy/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Report Official Document Header */}
        <div className="bg-white print:bg-transparent border border-border-warm print:border-b-2 print:border-gray-900 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-warm print:border-gray-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-navy-subtle text-navy border border-navy/20 print:border-gray-900 print:text-black">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-sans text-xs font-semibold text-navy">
                  Financial Intelligence Unit • AML Surveillance Report
                </div>
                <div className="text-xs text-ink-secondary">
                  Suspicious Activity Report (SAR) / STR Evidence Package
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-severity-critical-bg text-severity-critical border border-severity-critical-border rounded-full text-xs font-bold font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              CONFIDENTIAL • REGULATORY FILING
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-ink-primary print:text-black tracking-tight">
                {report.title}
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Case ID: <span className="font-mono text-navy font-semibold">{report.investigation_id}</span>
              </p>
            </div>

            <div className="text-right text-xs text-ink-secondary space-y-0.5 font-sans">
              <div>Generated: <span className="font-mono">{new Date(report.generated_at).toLocaleString()}</span></div>
              <div className="text-[11px]">System: TraceFuse AML Core Engine v1.0</div>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary & Recommended Action */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-serif text-ink-primary print:text-black border-b border-border-warm print:border-gray-300 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-navy print:text-black" />
            1. Executive Summary & Regulatory Determination
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 bg-white print:bg-gray-50 border border-border-warm print:border-gray-300 p-5 md:p-6 rounded-2xl space-y-3 text-xs leading-relaxed shadow-sm">
              <p className="text-ink-primary print:text-gray-800">{report.case_summary}</p>
              <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-ink-secondary border-t border-border-warm print:border-gray-200">
                <span>Total Entities: <strong className="text-ink-primary">{report.entities_involved.length}</strong></span>
                <span>Patterns Detected: <strong className="text-ink-primary">{report.detected_patterns.length}</strong></span>
                <span>Active Status: <strong className="capitalize text-navy">{report.status}</strong></span>
              </div>
            </div>

            <div className="bg-white print:bg-gray-50 border border-border-warm print:border-gray-300 p-5 md:p-6 rounded-2xl space-y-3 text-xs flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-ink-secondary text-[10px] uppercase font-medium">Composite Risk Assessment</span>
                <div className="text-2xl font-bold font-mono text-severity-critical print:text-red-700 mt-1">
                  {report.risk_score} / 100
                </div>
                <div className="text-xs text-ink-secondary capitalize">
                  Band: <strong className="text-ink-primary">{report.risk_level} Severity</strong>
                </div>
              </div>

              <div>
                <span className="text-ink-secondary text-[10px] uppercase font-medium">Total Flow Amount</span>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                  ₹{report.total_amount_involved.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Regulatory Action Callout */}
          <div className="p-4 bg-severity-critical-bg print:bg-red-50 border border-severity-critical-border print:border-red-300 rounded-xl space-y-1.5 shadow-sm">
            <div className="text-xs font-bold text-severity-critical flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              RECOMMENDED REGULATORY ACTION:
            </div>
            <p className="text-xs text-ink-primary print:text-gray-800 font-sans leading-relaxed">
              {report.recommended_action}
            </p>
          </div>
        </section>

        {/* 2. Entities in Scope Table */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-serif text-ink-primary print:text-black border-b border-border-warm print:border-gray-300 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-navy print:text-black" />
            2. Counterparties & Entities Under Investigation
          </h2>

          <div className="bg-white print:bg-white border border-border-warm print:border-gray-300 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 print:bg-gray-100 text-ink-secondary print:text-gray-700 text-[11px] uppercase border-b border-border-warm print:border-gray-300 font-medium">
                <tr>
                  <th className="py-3 px-4">Entity / Account Holder</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm print:divide-gray-200">
                {report.entities_involved.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 print:hover:bg-transparent">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {String(ent.holder_name || ent.name || "Entity Record")}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {String(ent.account_id || ent.id || "")}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-primary font-medium">
                      {String(ent.account_number || "N/A")}
                    </td>
                    <td className="py-3 px-4 text-ink-secondary capitalize">
                      {String(ent.account_type || "Savings")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-border-warm text-[10px] font-mono text-slate-700">
                        {String(ent.risk_level || "Flagged")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Detected Patterns Breakdown */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-serif text-ink-primary print:text-black border-b border-border-warm print:border-gray-300 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-navy print:text-black" />
            3. Detected AML Pattern Typologies ({report.detected_patterns.length})
          </h2>

          <div className="space-y-3">
            {report.detected_patterns.map((p, idx) => (
              <div
                key={idx}
                className="bg-white print:bg-gray-50 border border-border-warm print:border-gray-300 p-4 md:p-5 rounded-xl space-y-2 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-ink-primary print:text-black text-xs flex items-center gap-2">
                    <span className="text-navy font-mono">#{idx + 1}</span>
                    <span className="capitalize">{String(p.pattern_type || "").replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[11px] text-ink-secondary">
                    Severity: <strong className="uppercase text-severity-critical">{String(p.severity || "")}</strong> • Confidence: {Math.round(Number(p.confidence || 0) * 100)}%
                  </span>
                </div>

                <p className="text-ink-primary print:text-gray-800 leading-relaxed font-sans">
                  {String(p.explanation || p.evidence || "")}
                </p>

                {Array.isArray(p.transaction_ids) && p.transaction_ids.length > 0 && (
                  <div className="pt-1 text-[11px] text-ink-secondary">
                    Cited Transactions:{" "}
                    <span className="font-mono text-[10px] text-navy font-semibold">
                      {p.transaction_ids.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Multi-Hop Money Trail Provenance */}
        {report.money_trail_summary && report.money_trail_summary.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold font-serif text-ink-primary print:text-black border-b border-border-warm print:border-gray-300 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy print:text-black" />
              4. Multi-Hop Fund Provenance Sequence ({report.money_trail_summary.length} Hops)
            </h2>

            <div className="bg-white print:bg-white border border-border-warm print:border-gray-300 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 print:bg-gray-100 text-ink-secondary print:text-gray-700 text-[11px] uppercase border-b border-border-warm print:border-gray-300 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Hop</th>
                    <th className="py-2.5 px-4">Origin Account</th>
                    <th className="py-2.5 px-4">Destination Account</th>
                    <th className="py-2.5 px-4">Amount (INR)</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm print:divide-gray-200 text-xs">
                  {report.money_trail_summary.map((hop, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 print:hover:bg-transparent">
                      <td className="py-2.5 px-4 font-bold font-mono text-navy print:text-black">
                        #{String(hop.hop_number || idx + 1)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {getAccountName(String(hop.from_account_id || ""))}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          ({String(hop.from_account_id || "")})
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {getAccountName(String(hop.to_account_id || ""))}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          ({String(hop.to_account_id || "")})
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-bold font-mono text-emerald-700">
                        ₹{Number(hop.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-4 text-ink-secondary text-[11px] font-mono">
                        {new Date(String(hop.timestamp || "")).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 px-4 text-ink-secondary text-[11px] font-mono">
                        +{String(hop.hop_elapsed_minutes || 0)}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Investigator Notes & Case Action Audit History */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-serif text-ink-primary print:text-black border-b border-border-warm print:border-gray-300 pb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-navy print:text-black" />
            5. Case Notes & Status Workflow History
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs font-sans">
            {/* Notes */}
            <div className="bg-white print:bg-gray-50 border border-border-warm print:border-gray-300 p-5 md:p-6 rounded-2xl space-y-3 shadow-sm">
              <h3 className="font-serif font-bold text-ink-primary print:text-gray-800 text-xs">
                Investigator Notes
              </h3>
              {report.investigator_notes.length === 0 ? (
                <p className="text-ink-secondary text-[11px]">No notes recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.investigator_notes.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 print:bg-white rounded-xl border border-border-warm print:border-gray-200 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-ink-secondary">
                        <span className="font-semibold text-navy">{String(n.user_id || "Analyst")}</span>
                        <span className="font-mono">{new Date(String(n.timestamp || "")).toLocaleString()}</span>
                      </div>
                      <p className="text-ink-primary print:text-gray-800">{String(n.note || "")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="bg-white print:bg-gray-50 border border-border-warm print:border-gray-300 p-5 md:p-6 rounded-2xl space-y-3 shadow-sm">
              <h3 className="font-serif font-bold text-ink-primary print:text-gray-800 text-xs">
                Status Audit Trail
              </h3>
              {report.status_history.length === 0 ? (
                <p className="text-ink-secondary text-[11px]">Initial status: {report.status}</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {report.status_history.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 print:bg-white rounded-xl border border-border-warm print:border-gray-200 text-[11px] text-ink-primary"
                    >
                      <div>
                        {String(act.previous_value || "new")} ➔{" "}
                        <strong className="text-navy capitalize">{String(act.new_value || "")}</strong>
                      </div>
                      <div className="text-[10px] text-ink-secondary mt-0.5 font-mono">
                        By {String(act.user_id || "System")} • {new Date(String(act.timestamp || "")).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
