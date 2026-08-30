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
import { TimelineEventResponse } from "@tracefuse/shared";

interface InvestigationTimelineProps {
  events: TimelineEventResponse[];
  className?: string;
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  events,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "burst" | "high_value">("all");
  const [scrubIndex, setScrubIndex] = useState<number>(events.length);
  const [isPlaying, setIsPlaying] = useState(false);

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
        return (
          e.source_account_id.toLowerCase().includes(q) ||
          e.destination_account_id.toLowerCase().includes(q) ||
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
    <div className={`bg-[#111622] border border-[#1f293d] rounded-xl p-6 shadow-xl space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1f293d]">
        <div>
          <h3 className="text-lg font-bold font-mono text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Chronological Transaction Timeline
          </h3>
          <p className="text-xs text-gray-400">
            Temporal event flow with velocity spikes and rapid pass-through conduit annotations
          </p>
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-[#0a0d14] border border-[#1f293d] p-2 rounded-xl">
          <button
            onClick={() => {
              if (scrubIndex >= events.length) setScrubIndex(1);
              setIsPlaying(!isPlaying);
            }}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
            title={isPlaying ? "Pause Timeline" : "Play Timeline Flow"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setScrubIndex(events.length);
            }}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all cursor-pointer"
            title="Reset Timeline to End"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
            <span>Step {scrubIndex} / {events.length}</span>
            <input
              type="range"
              min="1"
              max={events.length || 1}
              value={scrubIndex}
              onChange={(e) => setScrubIndex(Number(e.target.value))}
              className="w-24 sm:w-36 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1f293d]">
          <span className="text-gray-500 uppercase text-[10px]">Events in View</span>
          <div className="text-base font-bold text-white mt-0.5">{filteredEvents.length} txns</div>
        </div>
        <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1f293d]">
          <span className="text-gray-500 uppercase text-[10px]">Cumulative Volume</span>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            ₹{totalVolume.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1f293d]">
          <span className="text-gray-500 uppercase text-[10px]">High-Value Transfers</span>
          <div className="text-base font-bold text-amber-400 mt-0.5">
            {filteredEvents.filter((e) => e.is_high_value).length}
          </div>
        </div>
        <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1f293d]">
          <span className="text-gray-500 uppercase text-[10px]">Pattern State</span>
          <div className="text-base font-bold text-blue-400 mt-0.5">Active Sequence</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType("high_value")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              filterType === "high_value"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            High Value (≥ ₹1L)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search account or txn ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Vertical Timeline Feed */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f293d]">
        {filteredEvents.map((evt, idx) => {
          const evtTime = new Date(evt.timestamp);
          const elapsedMins = firstTimestamp
            ? Math.round((evtTime.getTime() - firstTimestamp.getTime()) / 60000)
            : 0;

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[27px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-[#111622] transition-transform group-hover:scale-125 ${
                  evt.is_high_value ? "bg-amber-400" : "bg-blue-500"
                }`}
              />

              {/* Event Card */}
              <div className="bg-[#0a0d14] border border-[#1f293d] hover:border-blue-500/40 p-4 rounded-xl transition-all shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/80">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="text-gray-300">{evt.id}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 uppercase text-[11px]">
                      {evt.transaction_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-gray-400">
                      {evtTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="text-gray-500">({elapsedMins}m from start)</span>
                  </div>
                </div>

                {/* Counterparty & Amount Flow */}
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-white font-semibold">{evt.source_account_id}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-white font-semibold">{evt.destination_account_id}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-emerald-400">
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
