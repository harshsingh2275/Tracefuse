import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "critical" | "warning" | "success" | "accent";
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className = "",
}) => {
  let iconBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  let borderGlow = "border-[#1f293d] hover:border-blue-500/40";

  if (variant === "critical") {
    iconBg = "bg-red-500/15 text-red-400 border-red-500/30";
    borderGlow = "border-[#1f293d] hover:border-red-500/40";
  } else if (variant === "warning") {
    iconBg = "bg-amber-500/15 text-amber-400 border-amber-500/30";
    borderGlow = "border-[#1f293d] hover:border-amber-500/40";
  } else if (variant === "success") {
    iconBg = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    borderGlow = "border-[#1f293d] hover:border-emerald-500/40";
  } else if (variant === "accent") {
    iconBg = "bg-purple-500/15 text-purple-400 border-purple-500/30";
    borderGlow = "border-[#1f293d] hover:border-purple-500/40";
  }

  return (
    <div
      className={`bg-[#111622] border ${borderGlow} p-5 rounded-xl transition-all duration-200 shadow-lg relative overflow-hidden group ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400 font-sans flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
