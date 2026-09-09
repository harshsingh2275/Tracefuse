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
  Activity,
} from "lucide-react";

interface PatternBadgeProps {
  type: string;
  className?: string;
}

export const PatternBadge: React.FC<PatternBadgeProps> = ({ type, className = "" }) => {
  const norm = type.toLowerCase().trim();

  let label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let tooltip = "Algorithmic forensic pattern signature detected";
  let Icon = Zap;
  let bg = "bg-severity-normal-bg text-severity-normal border-severity-normal-border";

  switch (norm) {
    case "fan_out":
      label = "Fan-Out";
      tooltip = "One account sending money to many others quickly";
      Icon = Share2;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
    case "fan_in":
      label = "Fan-In";
      tooltip = "Many accounts sending money to one account quickly";
      Icon = GitMerge;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
    case "velocity":
      label = "Velocity";
      tooltip = "Unusually high transaction speed for this account";
      Icon = Activity;
      bg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
      break;
    case "rapid_pass_through":
    case "pass_through":
      label = "Pass-Through";
      tooltip = "Funds moved onward almost immediately after arriving";
      Icon = ArrowRightLeft;
      bg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
      break;
    case "fragmentation":
      label = "Fragmentation";
      tooltip = "One large amount split into many smaller transfers";
      Icon = Layers;
      bg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
      break;
    case "circular_movement":
    case "circular_loop":
      label = "Circular Loop";
      tooltip = "Money moving in a loop back to its origin";
      Icon = RotateCw;
      bg = "bg-severity-critical-bg text-severity-critical border-severity-critical-border";
      break;
    case "shared_device":
      label = "Shared Device";
      tooltip = "Multiple accounts linked to the same device";
      Icon = Smartphone;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
    case "new_intermediary":
    case "new_conduit":
      label = "New Conduit";
      tooltip = "A newly created account used to route funds";
      Icon = Sparkles;
      bg = "bg-navy-subtle text-navy border-navy/20";
      break;
  }

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-sans font-medium whitespace-nowrap cursor-help transition-opacity hover:opacity-90 ${bg} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
