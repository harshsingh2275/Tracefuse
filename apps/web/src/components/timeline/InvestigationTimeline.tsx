"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Zap,
  ArrowRight,
  Flame,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { TimelineEventResponse, AccountSummaryResponse } from "@tracefuse/shared";

interface InvestigationTimelineProps {
  events: TimelineEventResponse[];
  accounts?: AccountSummaryResponse[];
  className?: string;
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  events,
  accounts = [],
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "burst" | "high_value">("all");
  const [scrubIndex, setScrubIndex] = useState<number>(events.length);
  const [isPlaying, setIsPlaying] = useState(false);

  const getAccountName = (accId: string) => {
    const found = accounts.find((a) => a.id === accId);
    return found?.holder_name || accId;
  };

  // Playback timer effect
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setScrubIndex((prev) => {
          if (prev >= events.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, events.length]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.slice(0, scrubIndex).filter((e) => {
      if (filterType === "high_value" && !e.is_high_value) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const srcName = getAccountName(e.source_account_id).toLowerCase();
        const dstName = getAccountName(e.destination_account_id).toLowerCase();
        return (
          e.source_account_id.toLowerCase().includes(q) ||
          e.destination_account_id.toLowerCase().includes(q) ||
          srcName.includes(q) ||
          dstName.includes(q) ||
          e.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sortedEvents, scrubIndex, filterType, searchQuery]);

  const totalVolume = useMemo(() => {
    return filteredEvents.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEvents]);

  const firstTimestamp = sortedEvents.length > 0 ? new Date(sortedEvents[0].timestamp) : null;

  return (
    <div className={`bg-white border border-border-warm rounded-xl p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border-warm">
        <div>
          <h3 className="text-lg font-serif font-bold text-ink-primary tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-navy" />
            Chronological Transaction Timeline
          </h3>
          <p className="text-xs text-ink-secondary">
            Temporal event flow with velocity spikes and rapid pass-through conduit annotations
          </p>
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 border border-border-warm p-2 rounded-xl">
          <button
            onClick={() => {
              if (scrubIndex >= events.length) setScrubIndex(1);
              setIsPlaying(!isPlaying);
            }}
            className="p-1.5 rounded-lg bg-navy hover:bg-navy-hover text-white transition-all cursor-pointer shadow-sm"
            title={isPlaying ? "Pause Timeline" : "Play Timeline Flow"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setScrubIndex(events.length);
            }}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
            title="Reset Timeline to End"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-secondary">
            <span>Step {scrubIndex} / {events.length}</span>
            <input
              type="range"
              min="1"
              max={events.length || 1}
              value={scrubIndex}
              onChange={(e) => setScrubIndex(Number(e.target.value))}
              className="w-24 sm:w-36 accent-navy cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-50 rounded-lg border border-border-warm">
          <span className="text-ink-secondary uppercase text-[10px]">Events in View</span>
          <div className="text-base font-bold text-ink-primary mt-0.5">{filteredEvents.length} txns</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border-warm">
          <span className="text-ink-secondary uppercase text-[10px]">Cumulative Volume</span>
          <div className="text-base font-bold text-emerald-700 mt-0.5">
            ₹{totalVolume.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border-warm">
          <span className="text-ink-secondary uppercase text-[10px]">High-Value Transfers</span>
          <div className="text-base font-bold text-amber-700 mt-0.5">
            {filteredEvents.filter((e) => e.is_high_value).length}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-border-warm">
          <span className="text-ink-secondary uppercase text-[10px]">Pattern State</span>
          <div className="text-base font-bold text-navy mt-0.5 font-sans">Active Sequence</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-navy text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary hover:bg-slate-100"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType("high_value")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === "high_value"
                ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                : "text-ink-secondary hover:text-ink-primary hover:bg-slate-100"
            }`}
          >
            High Value (≥ ₹1L)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search account name, ID, or txn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-border-warm rounded-lg text-xs text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Timeline Event Feed */}
      <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
        {filteredEvents.map((evt, idx) => {
          const evtTime = new Date(evt.timestamp);
          const elapsedMins = firstTimestamp
            ? Math.max(0, Math.round((evtTime.getTime() - firstTimestamp.getTime()) / 60000))
            : 0;

          const sourceName = getAccountName(evt.source_account_id);
          const destName = getAccountName(evt.destination_account_id);

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[31px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-transform group-hover:scale-125 ${
                  evt.is_high_value ? "bg-amber-500 ring-2 ring-amber-200" : "bg-navy ring-2 ring-navy-subtle"
                }`}
              />

              {/* Event Card */}
              <div className="bg-slate-50 border border-border-warm hover:border-slate-300 p-4 rounded-xl transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-border-warm">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-navy-subtle text-navy border border-navy/20 font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="text-ink-secondary">{evt.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-ink-secondary uppercase text-[11px]">
                      {evt.transaction_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-ink-primary font-medium">
                      {evtTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="text-ink-secondary">({elapsedMins}m from start)</span>
                  </div>
                </div>

                {/* Counterparty & Amount Flow */}
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
                  <div className="flex items-center gap-2 text-ink-primary">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{sourceName}</span>
                      <span className="font-mono text-[10px] text-slate-500">({evt.source_account_id})</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-navy shrink-0 mx-1" />

                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{destName}</span>
                      <span className="font-mono text-[10px] text-slate-500">({evt.destination_account_id})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-emerald-700">
                      ₹{evt.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
