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
  let iconBg = "bg-navy-subtle text-navy border-navy/20";

  if (variant === "critical") {
    iconBg = "bg-severity-critical-bg text-severity-critical border-severity-critical-border";
  } else if (variant === "warning") {
    iconBg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
  } else if (variant === "success") {
    iconBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (variant === "accent") {
    iconBg = "bg-navy-subtle text-navy border-navy/20";
  }

  return (
    <div
      className={`bg-white border border-border-warm hover:border-slate-300 p-4 sm:p-5 rounded-xl transition-all duration-200 shadow-sm relative overflow-hidden group ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-sans font-medium text-ink-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xl sm:text-2xl font-bold font-mono text-ink-primary tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-ink-secondary font-sans flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
