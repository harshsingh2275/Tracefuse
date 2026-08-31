import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-[#182030]/60 ${className}`}
        />
      ))}
    </>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-[#111622]/80 border border-[#1f293d] p-6 animate-pulse space-y-3">
        <Skeleton className="h-4 w-36 bg-blue-500/20" />
        <Skeleton className="h-8 w-2/3 bg-gray-700/50" />
        <Skeleton className="h-4 w-1/2 bg-gray-700/30" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[#111622] border border-[#1f293d] p-4 animate-pulse space-y-2">
            <Skeleton className="h-3 w-16 bg-gray-700/40" />
            <Skeleton className="h-7 w-24 bg-blue-500/20" />
            <Skeleton className="h-3 w-20 bg-gray-700/30" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-xl bg-[#111622] border border-[#1f293d] p-4 animate-pulse space-y-3">
        <Skeleton className="h-8 w-full bg-gray-800" />
        <Skeleton className="h-10 w-full bg-gray-800/60" count={4} />
      </div>
    </div>
  );
};
