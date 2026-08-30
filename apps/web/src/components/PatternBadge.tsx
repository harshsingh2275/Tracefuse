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
  let bg = "bg-gray-800 text-gray-300 border-gray-700";

  switch (norm) {
    case "fan_out":
      label = "Fan-Out";
      Icon = Share2;
      bg = "bg-blue-500/10 text-blue-400 border-blue-500/30";
      break;
    case "fan_in":
      label = "Fan-In";
      Icon = GitMerge;
      bg = "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      break;
    case "rapid_pass_through":
      label = "Pass-Through";
      Icon = ArrowRightLeft;
      bg = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case "fragmentation":
      label = "Fragmentation";
      Icon = Layers;
      bg = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      break;
    case "circular_movement":
      label = "Circular Loop";
      Icon = RotateCw;
      bg = "bg-rose-500/10 text-rose-400 border-rose-500/30";
      break;
    case "shared_device":
      label = "Shared Device";
      Icon = Smartphone;
      bg = "bg-purple-500/10 text-purple-400 border-purple-500/30";
      break;
    case "new_intermediary":
      label = "New Conduit";
      Icon = Sparkles;
      bg = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      break;
    case "velocity":
      label = "Velocity Burst";
      Icon = Zap;
      bg = "bg-orange-500/10 text-orange-400 border-orange-500/30";
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${bg} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
