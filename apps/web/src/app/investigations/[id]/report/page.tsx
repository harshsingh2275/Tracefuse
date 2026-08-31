"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Printer,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  UserCheck,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { InvestigationReportResponse } from "@tracefuse/shared";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PatternBadge } from "@/components/PatternBadge";

function ReportContent() {
  const params = useParams();
  const router = useRouter();
  const investigationId = params.id as string;

  const [report, setReport] = useState<InvestigationReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInvestigationReport(investigationId);
      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load report data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      fetchReport();
    }
  }, [investigationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Compiling Compliance Investigation Report ({investigationId})...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111622] border border-red-500/30 p-6 rounded-2xl text-center space-y-4 font-sans">
          <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-white font-mono">Report Generation Error</h3>
          <p className="text-xs text-gray-400">{error || "Case record not found."}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              Retry Report
            </button>
            <Link
              href={`/investigations/${investigationId}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono transition-all"
            >
              Back to Dossier
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] print:bg-white print:text-black font-sans">
      {/* Top Action Bar (Hidden on Print) */}
      <header className="sticky top-0 z-30 bg-[#0a0d14]/90 backdrop-blur-md border-b border-[#1f293d] px-4 md:px-8 py-3 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/investigations/${investigationId}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Interactive Dossier</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `TraceFuse_Report_${investigationId}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="px-3 py-1.5 bg-[#111622] hover:bg-[#182030] border border-[#1f293d] rounded-lg text-xs font-mono text-gray-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Printable Document */}
      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-8 print:p-0 print:space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-[#1f293d] print:border-black pb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 print:text-gray-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-400 print:text-black" />
              TRACEFUSE FINANCIAL CRIME INTELLIGENCE
            </span>
            <span>CLASSIFICATION: CONFIDENTIAL // COMPLIANCE SAR</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono text-white print:text-black tracking-tight">
                Investigation Case Report
              </h1>
              <p className="text-xs font-mono text-blue-400 print:text-gray-700 mt-1">
                Case ID: {report.investigation_id} • Title: {report.title}
              </p>
            </div>

            <div className="text-right font-mono text-xs text-gray-400 print:text-gray-600 space-y-0.5">
              <div>Generated: {new Date(report.generated_at).toLocaleString()}</div>
              <div>System: TraceFuse AML Core Engine v1.0</div>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary & Recommended Action */}
        <section className="space-y-4">
          <h2 className="text-base font-bold font-mono text-white print:text-black uppercase tracking-wider border-b border-gray-800 print:border-gray-300 pb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400 print:text-black" />
            1. Executive Summary & Regulatory Determination
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-[#111622] print:bg-gray-50 border border-[#1f293d] print:border-gray-300 p-4 rounded-xl space-y-3 text-xs leading-relaxed">
              <p className="text-gray-200 print:text-gray-800">{report.case_summary}</p>
              <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-[11px] text-gray-400 print:text-gray-600 border-t border-gray-800 print:border-gray-200">
                <span>Total Entities: <strong>{report.entities_involved.length}</strong></span>
                <span>Patterns Detected: <strong>{report.detected_patterns.length}</strong></span>
                <span>Active Status: <strong className="capitalize">{report.status}</strong></span>
              </div>
            </div>

            <div className="bg-[#111622] print:bg-gray-50 border border-[#1f293d] print:border-gray-300 p-4 rounded-xl space-y-3 font-mono text-xs flex flex-col justify-between">
              <div>
                <span className="text-gray-400 print:text-gray-600 text-[10px] uppercase">Composite Risk Assessment</span>
                <div className="text-2xl font-bold text-red-400 print:text-red-600 mt-1">
                  {report.risk_score} / 100
                </div>
                <div className="text-xs text-gray-300 print:text-gray-700 capitalize">
                  Band: <strong>{report.risk_level} Severity</strong>
                </div>
              </div>

              <div>
                <span className="text-gray-400 print:text-gray-600 text-[10px] uppercase">Total Flow Amount</span>
                <div className="text-lg font-bold text-emerald-400 print:text-emerald-700 mt-0.5">
                  ₹{report.total_amount_involved.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Regulatory Action Callout */}
          <div className="p-4 bg-red-950/20 print:bg-red-50 border border-red-500/30 print:border-red-300 rounded-xl space-y-1.5">
            <div className="text-xs font-mono font-bold text-red-400 print:text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              RECOMMENDED REGULATORY ACTION:
            </div>
            <p className="text-xs text-gray-200 print:text-gray-800 font-sans leading-relaxed">
              {report.recommended_action}
            </p>
          </div>
        </section>

        {/* 2. Entities in Scope Table */}
        <section className="space-y-3">
          <h2 className="text-base font-bold font-mono text-white print:text-black uppercase tracking-wider border-b border-gray-800 print:border-gray-300 pb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400 print:text-black" />
            2. Counterparties & Entities Under Investigation
          </h2>

          <div className="bg-[#111622] print:bg-white border border-[#1f293d] print:border-gray-300 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#182030] print:bg-gray-100 text-gray-400 print:text-gray-700 font-mono text-[11px] uppercase border-b border-[#1f293d] print:border-gray-300">
                <tr>
                  <th className="py-2.5 px-4">Account ID</th>
                  <th className="py-2.5 px-4">Holder Name</th>
                  <th className="py-2.5 px-4">Account Number</th>
                  <th className="py-2.5 px-4">Account Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d] print:divide-gray-200">
                {report.entities_involved.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-[#182030]/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-400 print:text-gray-900">
                      {String(ent.account_id || "")}
                    </td>
                    <td className="py-2.5 px-4 text-white print:text-black font-medium">
                      {String(ent.holder_name || "")}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-300 print:text-gray-700">
                      {String(ent.account_number || "")}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-400 print:text-gray-600 capitalize">
                      {String(ent.account_type || "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Detected Patterns Breakdown */}
        <section className="space-y-3">
          <h2 className="text-base font-bold font-mono text-white print:text-black uppercase tracking-wider border-b border-gray-800 print:border-gray-300 pb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-400 print:text-black" />
            3. Detected AML Pattern Typologies ({report.detected_patterns.length})
          </h2>

          <div className="space-y-3">
            {report.detected_patterns.map((p, idx) => (
              <div
                key={idx}
                className="bg-[#111622] print:bg-gray-50 border border-[#1f293d] print:border-gray-300 p-4 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-white print:text-black uppercase text-xs flex items-center gap-2">
                    <span className="text-blue-400 print:text-blue-700">#{idx + 1}</span>
                    <span>{String(p.pattern_type || "").replace(/_/g, " ")}</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 print:text-gray-600">
                    Severity: <strong className="uppercase">{String(p.severity || "")}</strong> • Confidence: {Math.round((Number(p.confidence || 0) * 100))}%
                  </span>
                </div>

                <p className="text-gray-200 print:text-gray-800 leading-relaxed font-sans">
                  {String(p.explanation || p.evidence || "")}
                </p>

                {Array.isArray(p.transaction_ids) && p.transaction_ids.length > 0 && (
                  <div className="pt-1 font-mono text-[10px] text-gray-400 print:text-gray-600">
                    Cited Transactions: {p.transaction_ids.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Multi-Hop Money Trail Provenance */}
        {report.money_trail_summary && report.money_trail_summary.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono text-white print:text-black uppercase tracking-wider border-b border-gray-800 print:border-gray-300 pb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 print:text-black" />
              4. Multi-Hop Fund Provenance Sequence ({report.money_trail_summary.length} Hops)
            </h2>

            <div className="bg-[#111622] print:bg-white border border-[#1f293d] print:border-gray-300 rounded-xl overflow-hidden shadow-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#182030] print:bg-gray-100 text-gray-400 print:text-gray-700 text-[11px] uppercase border-b border-[#1f293d] print:border-gray-300">
                  <tr>
                    <th className="py-2.5 px-4">Hop</th>
                    <th className="py-2.5 px-4">Origin Account</th>
                    <th className="py-2.5 px-4">Destination Account</th>
                    <th className="py-2.5 px-4">Amount (INR)</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d] print:divide-gray-200 text-xs">
                  {report.money_trail_summary.map((hop, idx) => (
                    <tr key={idx} className="hover:bg-[#182030]/40 print:hover:bg-transparent">
                      <td className="py-2 px-4 font-bold text-blue-400 print:text-black">
                        #{String(hop.hop_number || idx + 1)}
                      </td>
                      <td className="py-2 px-4 text-gray-200 print:text-gray-900">
                        {String(hop.from_account_id || "")}
                      </td>
                      <td className="py-2 px-4 text-gray-200 print:text-gray-900">
                        {String(hop.to_account_id || "")}
                      </td>
                      <td className="py-2 px-4 font-bold text-emerald-400 print:text-emerald-700">
                        ₹{Number(hop.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-4 text-gray-400 print:text-gray-600 text-[11px]">
                        {new Date(String(hop.timestamp || "")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2 px-4 text-gray-400 print:text-gray-600 text-[11px]">
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
          <h2 className="text-base font-bold font-mono text-white print:text-black uppercase tracking-wider border-b border-gray-800 print:border-gray-300 pb-1 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400 print:text-black" />
            5. Case Notes & Status Workflow History
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Notes */}
            <div className="bg-[#111622] print:bg-gray-50 border border-[#1f293d] print:border-gray-300 p-4 rounded-xl space-y-2">
              <h3 className="font-mono font-bold text-gray-300 print:text-gray-800 uppercase text-xs">
                Investigator Notes
              </h3>
              {report.investigator_notes.length === 0 ? (
                <p className="text-gray-500 font-mono text-[11px]">No notes recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.investigator_notes.map((n, idx) => (
                    <div key={idx} className="p-2.5 bg-[#0a0d14] print:bg-white rounded-lg border border-gray-800 print:border-gray-200 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10px] text-gray-400 print:text-gray-600">
                        <span>{String(n.user_id || "Analyst")}</span>
                        <span>{new Date(String(n.timestamp || "")).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-200 print:text-gray-800">{String(n.note || "")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="bg-[#111622] print:bg-gray-50 border border-[#1f293d] print:border-gray-300 p-4 rounded-xl space-y-2">
              <h3 className="font-mono font-bold text-gray-300 print:text-gray-800 uppercase text-xs">
                Status Audit Trail
              </h3>
              {report.status_history.length === 0 ? (
                <p className="text-gray-500 font-mono text-[11px]">Initial status: {report.status}</p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {report.status_history.map((act, idx) => (
                    <div key={idx} className="p-2 bg-[#0a0d14] print:bg-white rounded-lg border border-gray-800 print:border-gray-200 text-[11px] text-gray-300 print:text-gray-800">
                      <div>
                        {String(act.previous_value || "new")} ➔ <strong className="text-blue-400 print:text-blue-700 capitalize">{String(act.new_value || "")}</strong>
                      </div>
                      <div className="text-[10px] text-gray-500 print:text-gray-600">
                        By {String(act.user_id || "")} at {new Date(String(act.timestamp || "")).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer Sign-off Block */}
        <div className="pt-8 border-t border-gray-800 print:border-gray-300 grid grid-cols-2 gap-8 text-xs font-mono text-gray-400 print:text-gray-600">
          <div className="space-y-6">
            <div>Investigating Officer Signature: _______________________</div>
            <div>Priya Sharma, Lead AML Analyst (ID: usr_analyst_01)</div>
          </div>
          <div className="space-y-6 text-right">
            <div>Compliance Officer Authorization: _______________________</div>
            <div>Build Bank AML / CFT Compliance Directorate</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InvestigationReportPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0d14] text-[#f3f4f6] flex items-center justify-center font-mono text-xs text-gray-400">
          Loading Investigation Report...
        </div>
      }
    >
      <ReportContent />
    </React.Suspense>
  );
}
