import React from "react";
import { Clock, Search, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: "new" | "investigating" | "escalated" | "resolved" | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const s = status.toLowerCase();

  let bg = "bg-navy-subtle border-navy/20 text-navy";
  let Icon = Clock;
  let label = "New";

  if (s === "investigating") {
    bg = "bg-severity-suspicious-bg border-severity-suspicious-border text-severity-suspicious";
    Icon = Search;
    label = "Investigating";
  } else if (s === "escalated") {
    bg = "bg-severity-critical-bg border-severity-critical-border text-severity-critical font-bold";
    Icon = AlertCircle;
    label = "Escalated";
  } else if (s === "resolved") {
    bg = "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300";
    Icon = CheckCircle2;
    label = "Resolved";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-sans font-medium capitalize ${bg} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
