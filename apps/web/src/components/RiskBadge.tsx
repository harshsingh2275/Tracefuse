import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from "lucide-react";

interface RiskBadgeProps {
  level: "low" | "medium" | "high" | "critical" | string;
  score?: number;
  className?: string;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  className = "",
  showScore = true,
}) => {
  const normLevel = level.toLowerCase();

  let bg = "bg-slate-100 border-border-warm text-slate-700";
  let Icon = ShieldCheck;
  let label = "Low Risk";

  if (normLevel === "critical") {
    bg = "bg-severity-critical-bg border-severity-critical-border text-severity-critical font-bold";
    Icon = Flame;
    label = "Critical";
  } else if (normLevel === "high" || normLevel === "suspicious") {
    bg = "bg-severity-suspicious-bg border-severity-suspicious-border text-severity-suspicious font-bold";
    Icon = AlertOctagon;
    label = "Suspicious";
  } else if (normLevel === "medium") {
    bg = "bg-severity-suspicious-bg border-severity-suspicious-border text-severity-suspicious font-medium";
    Icon = AlertTriangle;
    label = "Medium Risk";
  } else {
    bg = "bg-slate-100 border-border-warm text-slate-700 font-medium";
    Icon = ShieldCheck;
    label = "Low Risk";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-sans ${bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[11px] opacity-90 font-semibold">({Math.round(score)})</span>
      )}
    </span>
  );
};
