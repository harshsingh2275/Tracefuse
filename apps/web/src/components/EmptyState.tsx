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
      className={`p-10 rounded-2xl bg-[#0d121d]/80 border border-[#1f293d] border-dashed text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold font-mono text-white">{title}</h4>
        <p className="text-xs text-gray-400 font-sans leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
