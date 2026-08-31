"use client";

import React, { useState, useEffect } from "react";
import {
  GitFork,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Clock,
  IndianRupee,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { MoneyHopResponse, AccountSummaryResponse } from "@tracefuse/shared";

interface FollowMoneyControllerProps {
  investigationId: string;
  accounts: AccountSummaryResponse[];
  onHighlightPath?: (activeHop: MoneyHopResponse | null, allHops: MoneyHopResponse[]) => void;
  className?: string;
}

export const FollowMoneyController: React.FC<FollowMoneyControllerProps> = ({
  investigationId,
  accounts,
  onHighlightPath,
  className = "",
}) => {
  const [sourceAccount, setSourceAccount] = useState<string>(accounts[0]?.id || "");
  const [destinationAccount, setDestinationAccount] = useState<string>("");
  const [maxHops, setMaxHops] = useState<number>(6);
  const [minAmount, setMinAmount] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hops, setHops] = useState<MoneyHopResponse[]>([]);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-select initial account if accounts change
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
      setIsPlaying(false);
      setActiveHopIndex(-1);

      const parsedMinAmount = minAmount ? parseFloat(minAmount) : undefined;
      const res = await api.followTheMoney(
        investigationId,
        sourceAccount,
        maxHops,
        parsedMinAmount
      );

      // If destination account is filtered, filter hops to that path branch if desired
      let resultHops = res.hops;
      if (destinationAccount) {
        const destIdx = resultHops.findIndex((h) => h.to_account_id === destinationAccount);
        if (destIdx !== -1) {
          resultHops = resultHops.slice(0, destIdx + 1);
        }
      }

      setHops(resultHops);
      if (resultHops.length > 0) {
        setActiveHopIndex(0);
        onHighlightPath?.(resultHops[0], resultHops);
      } else {
        onHighlightPath?.(null, []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trace fund flow.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Playback animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && hops.length > 0) {
      timer = setInterval(() => {
        setActiveHopIndex((prev) => {
          if (prev >= hops.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          onHighlightPath?.(hops[next], hops);
          return next;
        });
      }, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, hops, onHighlightPath]);

  const selectHop = (idx: number) => {
    setIsPlaying(false);
    setActiveHopIndex(idx);
    onHighlightPath?.(hops[idx], hops);
  };

  const resetTrace = () => {
    setIsPlaying(false);
    setActiveHopIndex(hops.length > 0 ? 0 : -1);
    if (hops.length > 0) {
      onHighlightPath?.(hops[0], hops);
    } else {
      onHighlightPath?.(null, []);
    }
  };

  return (
    <div className={`bg-[#111622] border border-[#1f293d] rounded-xl p-5 shadow-2xl space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1f293d]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            FIFO FUND PROVENANCE TRAIL
          </div>
          <h3 className="text-base font-bold font-mono text-white tracking-tight mt-1 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-400" />
            Follow the Money Trace Engine
          </h3>
        </div>

        {hops.length > 0 && (
          <div className="flex items-center gap-2 bg-[#0a0d14] border border-[#1f293d] p-1.5 rounded-xl font-mono text-xs">
            <button
              onClick={() => {
                if (activeHopIndex >= hops.length - 1) setActiveHopIndex(0);
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
              title={isPlaying ? "Pause Flow Animation" : "Play Multi-Hop Flow"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={resetTrace}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all cursor-pointer"
              title="Reset to First Hop"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-gray-400 px-2">
              Hop {activeHopIndex + 1} / {hops.length}
            </span>
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <label className="block text-gray-400 text-[11px] mb-1">Source Account (Origin)</label>
          <select
            value={sourceAccount}
            onChange={(e) => setSourceAccount(e.target.value)}
            className="w-full p-2 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.holder_name} ({acc.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-[11px] mb-1">Destination (Optional Filter)</label>
          <select
            value={destinationAccount}
            onChange={(e) => setDestinationAccount(e.target.value)}
            className="w-full p-2 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
          >
            <option value="">All Reachable Downstream</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.holder_name} ({acc.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-[11px] mb-1">Max Hops (1-8)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="8"
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="flex-1 accent-blue-500 cursor-pointer"
            />
            <span className="text-white font-bold w-4 text-center">{maxHops}</span>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleTrace}
            disabled={loading || !sourceAccount}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>{loading ? "Tracing Provenance..." : "Trace Fund Flow"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hop-by-Hop Breakdown Timeline */}
      {hops.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400 uppercase tracking-wider text-[11px] font-semibold">
              Discovered Multi-Hop Trail ({hops.length} Hops)
            </span>
            <span className="text-emerald-400 font-bold">
              Total Trail: ₹
              {hops[hops.length - 1]?.cumulative_amount?.toLocaleString("en-IN") || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hops.map((hop, idx) => {
              const isActive = activeHopIndex === idx;
              const hopDate = new Date(hop.timestamp);

              return (
                <div
                  key={`${hop.transaction_id}-${idx}`}
                  onClick={() => selectHop(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer font-mono text-xs space-y-2 ${
                    isActive
                      ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-600/20 ring-1 ring-blue-400"
                      : "bg-[#0a0d14] border-[#1f293d] hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isActive ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      HOP {hop.hop_number}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      +{hop.hop_elapsed_minutes || 0}m latency
                    </span>
                  </div>

                  <div className="text-sm font-bold text-emerald-400">
                    ₹{hop.amount.toLocaleString("en-IN")}
                  </div>

                  <div className="text-[11px] text-gray-300 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-gray-500">From:</span>
                      <span className="text-white truncate font-medium">{hop.from_account_id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-gray-500">To:</span>
                      <span className="text-white truncate font-medium">{hop.to_account_id}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Txn: {hop.transaction_id}</span>
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
