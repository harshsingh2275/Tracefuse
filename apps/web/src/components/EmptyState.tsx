import React from "react";
import { FolderSearch, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`p-10 rounded-2xl bg-white border border-border-warm border-dashed text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-navy-subtle border border-navy/20 text-navy flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold font-serif text-ink-primary">{title}</h4>
        <p className="text-xs text-ink-secondary font-sans leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-navy hover:bg-navy-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-navy/20 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
