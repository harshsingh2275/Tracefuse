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
          className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
        />
      ))}
    </>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-white border border-border-warm p-6 animate-pulse space-y-3 shadow-sm">
        <Skeleton className="h-4 w-36 bg-navy-subtle" />
        <Skeleton className="h-8 w-2/3 bg-slate-200" />
        <Skeleton className="h-4 w-1/2 bg-slate-100" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white border border-border-warm p-4 animate-pulse space-y-2 shadow-sm">
            <Skeleton className="h-3 w-16 bg-slate-200" />
            <Skeleton className="h-7 w-24 bg-navy-subtle" />
            <Skeleton className="h-3 w-20 bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-xl bg-white border border-border-warm p-4 animate-pulse space-y-3 shadow-sm">
        <Skeleton className="h-8 w-full bg-slate-100" />
        <Skeleton className="h-10 w-full bg-slate-50" count={4} />
      </div>
    </div>
  );
};
