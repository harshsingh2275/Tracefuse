import React from "react";
import {
  Share2,
  GitMerge,
  ArrowRightLeft,
  Layers,
  RotateCw,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

interface PatternBadgeProps {
  type: string;
  className?: string;
}

export const PatternBadge: React.FC<PatternBadgeProps> = ({ type, className = "" }) => {
  const norm = type.toLowerCase();

  let label = type.replace(/_/g, " ");
  let Icon = Zap;
  let bg = "bg-slate-100 text-slate-700 border-border-warm";

  switch (norm) {
    case "fan_out":
      label = "Fan-Out";
      Icon = Share2;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
    case "fan_in":
      label = "Fan-In";
      Icon = GitMerge;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
    case "rapid_pass_through":
      label = "Pass-Through";
      Icon = ArrowRightLeft;
      bg = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "fragmentation":
      label = "Fragmentation";
      Icon = Layers;
      bg = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "circular_movement":
      label = "Circular Loop";
      Icon = RotateCw;
      bg = "bg-severity-critical-bg text-severity-critical border-severity-critical-border";
      break;
    case "shared_device":
      label = "Shared Device";
      Icon = Smartphone;
      bg = "bg-slate-100 text-slate-800 border-slate-300";
      break;
    case "new_intermediary":
      label = "New Conduit";
      Icon = Sparkles;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-sans font-medium whitespace-nowrap ${bg} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
