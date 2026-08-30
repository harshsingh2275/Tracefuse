import React from "react";
import { Clock, Search, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: "new" | "investigating" | "escalated" | "resolved" | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const s = status.toLowerCase();

  let bg = "bg-blue-500/15 border-blue-500/30 text-blue-400";
  let Icon = Clock;
  let label = "New";

  if (s === "investigating") {
    bg = "bg-purple-500/15 border-purple-500/30 text-purple-300";
    Icon = Search;
    label = "Investigating";
  } else if (s === "escalated") {
    bg = "bg-red-500/15 border-red-500/30 text-red-400";
    Icon = AlertCircle;
    label = "Escalated";
  } else if (s === "resolved") {
    bg = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    Icon = CheckCircle2;
    label = "Resolved";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium capitalize ${bg} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
