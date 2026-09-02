"use client";

import React, { useState, useEffect } from "react";
import {
  GitFork,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { MoneyHopResponse, AccountSummaryResponse } from "@tracefuse/shared";
import { formatAccountCode, formatTxnCode } from "@/lib/formatters";

interface FollowMoneyControllerProps {
  investigationId: string;
  accounts: AccountSummaryResponse[];
  onHopSelect?: (hop: MoneyHopResponse | null, allHops: MoneyHopResponse[]) => void;
  className?: string;
}

export const FollowMoneyController: React.FC<FollowMoneyControllerProps> = ({
  investigationId,
  accounts = [],
  onHopSelect,
  className = "",
}) => {
  const [sourceAccount, setSourceAccount] = useState<string>(accounts[0]?.id || "");
  const [destinationAccount, setDestinationAccount] = useState<string>("");
  const [maxHops, setMaxHops] = useState<number>(6);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [hops, setHops] = useState<MoneyHopResponse[]>([]);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const getAccountName = (accId: string) => {
    const found = accounts.find((a) => a.id === accId);
    return found?.holder_name || accId;
  };

  useEffect(() => {
    if (accounts.length > 0 && !sourceAccount) {
      setSourceAccount(accounts[0].id);
    }
  }, [accounts, sourceAccount]);

  const handleTrace = async () => {
    if (!sourceAccount) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.followTheMoney(
        investigationId,
        sourceAccount,
        destinationAccount || undefined,
        maxHops
      );

      const resultHops = res.hops || [];
      setHops(resultHops);
      setActiveHopIndex(0);

      if (resultHops.length === 0) {
        setError("No downstream money flow detected from this account within parameters.");
      }

      if (onHopSelect) {
        onHopSelect(resultHops[0] || null, resultHops);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute money trail.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step forward/backward in hops
  const selectHop = (idx: number) => {
    if (idx >= 0 && idx < hops.length) {
      setActiveHopIndex(idx);
      if (onHopSelect) {
        onHopSelect(hops[idx], hops);
      }
    }
  };

  // Auto-play animation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && hops.length > 0) {
      interval = setInterval(() => {
        setActiveHopIndex((prev) => {
          const next = prev + 1;
          if (next >= hops.length) {
            setIsPlaying(false);
            return prev;
          }
          if (onHopSelect) {
            onHopSelect(hops[next], hops);
          }
          return next;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, hops, onHopSelect]);

  const resetTrace = () => {
    setIsPlaying(false);
    setActiveHopIndex(0);
    if (onHopSelect && hops.length > 0) {
      onHopSelect(hops[0], hops);
    }
  };

  return (
    <div className={`bg-white border border-border-warm rounded-xl p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-warm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-navy-subtle text-navy border border-navy/20">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-ink-primary">
              Follow the Money Multi-Hop Provenance
            </h3>
            <p className="text-[11px] text-ink-secondary">
              Strict First-In-First-Out fund flow reconstruction
            </p>
          </div>
        </div>

        {hops.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => {
                if (activeHopIndex >= hops.length - 1) {
                  setActiveHopIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 rounded-lg bg-navy hover:bg-navy-hover text-white transition-all cursor-pointer shadow-sm"
              title={isPlaying ? "Pause Flow Animation" : "Play Multi-Hop Flow"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={resetTrace}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="Reset to First Hop"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-ink-secondary px-2">
              Hop {activeHopIndex + 1} / {hops.length}
            </span>
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
        <div>
          <label className="block text-ink-secondary text-[11px] font-medium mb-1">Source Account (Origin)</label>
          <select
            value={sourceAccount}
            onChange={(e) => setSourceAccount(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-border-warm rounded-lg text-ink-primary focus:outline-none focus:border-navy text-xs"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.holder_name} ({formatAccountCode(acc.id)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-ink-secondary text-[11px] font-medium mb-1">Destination (Optional Filter)</label>
          <select
            value={destinationAccount}
            onChange={(e) => setDestinationAccount(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-border-warm rounded-lg text-ink-primary focus:outline-none focus:border-navy text-xs"
          >
            <option value="">All Reachable Downstream</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.holder_name} ({formatAccountCode(acc.id)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-ink-secondary text-[11px] font-medium mb-1">Max Hops (1-8)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="8"
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="flex-1 accent-navy cursor-pointer"
            />
            <span className="text-ink-primary font-bold font-mono w-4 text-center">{maxHops}</span>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleTrace}
            disabled={loading || !sourceAccount}
            className="w-full py-2 bg-navy hover:bg-navy-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-all shadow-md shadow-navy/20 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>{loading ? "Tracing Provenance..." : "Trace Fund Flow"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hop-by-Hop Breakdown Timeline */}
      {hops.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-secondary uppercase tracking-wider text-[11px] font-semibold">
              Discovered Multi-Hop Trail ({hops.length} Hops)
            </span>
            <span className="text-emerald-700 font-bold font-mono">
              Total Trail: ₹
              {hops[hops.length - 1]?.cumulative_amount?.toLocaleString("en-IN") || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hops.map((hop, idx) => {
              const isActive = idx === activeHopIndex;
              const hopDate = new Date(hop.timestamp);

              return (
                <div
                  key={`${hop.transaction_id}-${idx}`}
                  onClick={() => selectHop(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? "bg-navy-subtle border-navy shadow-md ring-2 ring-navy/30"
                      : "bg-slate-50 border-border-warm hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isActive ? "bg-navy text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      HOP {hop.hop_number}
                    </span>
                    <span className="text-ink-secondary text-[10px] font-mono">
                      +{hop.hop_elapsed_minutes || 0}m latency
                    </span>
                  </div>

                  <div className="text-sm font-bold font-mono text-emerald-700">
                    ₹{hop.amount.toLocaleString("en-IN")}
                  </div>

                  <div className="text-[11px] text-ink-primary space-y-1">
                    <div className="flex flex-col truncate">
                      <span className="text-ink-secondary text-[10px]">From:</span>
                      <span className="font-semibold text-slate-900 truncate">
                        {getAccountName(hop.from_account_id)}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]" title={hop.from_account_id}>
                        ({formatAccountCode(hop.from_account_id)})
                      </span>
                    </div>
                    <div className="flex flex-col truncate pt-0.5">
                      <span className="text-ink-secondary text-[10px]">To:</span>
                      <span className="font-semibold text-slate-900 truncate">
                        {getAccountName(hop.to_account_id)}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]" title={hop.to_account_id}>
                        ({formatAccountCode(hop.to_account_id)})
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-border-warm flex items-center justify-between text-[10px] text-ink-secondary font-mono">
                    <span title={hop.transaction_id}>
                      Txn: {formatTxnCode(hop.transaction_id)}
                    </span>
                    <span>{hopDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
