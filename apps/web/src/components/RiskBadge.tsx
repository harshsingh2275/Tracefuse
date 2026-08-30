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

  let bg = "bg-gray-800/60 border-gray-700 text-gray-300";
  let Icon = ShieldCheck;
  let label = "Low Risk";

  if (normLevel === "critical") {
    bg = "bg-red-500/15 border-red-500/40 text-red-400";
    Icon = Flame;
    label = "Critical";
  } else if (normLevel === "high") {
    bg = "bg-orange-500/15 border-orange-500/40 text-orange-400";
    Icon = AlertOctagon;
    label = "High Risk";
  } else if (normLevel === "medium") {
    bg = "bg-amber-500/15 border-amber-500/40 text-amber-400";
    Icon = AlertTriangle;
    label = "Medium Risk";
  } else {
    bg = "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
    Icon = ShieldCheck;
    label = "Low Risk";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-75 font-semibold">({Math.round(score)})</span>
      )}
    </span>
  );
};
