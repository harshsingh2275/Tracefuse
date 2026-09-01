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
    <div className="space-y-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl bg-white border border-border-warm p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 w-full max-w-2xl">
            <Skeleton className="h-5 w-48 bg-navy-subtle rounded-full" />
            <Skeleton className="h-8 w-3/4 bg-slate-200" />
            <Skeleton className="h-4 w-full bg-slate-100" />
            <Skeleton className="h-4 w-2/3 bg-slate-100" />
          </div>
          <Skeleton className="h-12 w-48 bg-slate-200 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-60 bg-slate-200" />
          <Skeleton className="h-3 w-32 bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-border-warm p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 bg-slate-100" />
                <Skeleton className="h-7 w-7 rounded-lg bg-navy-subtle" />
              </div>
              <Skeleton className="h-7 w-24 bg-slate-200" />
              <Skeleton className="h-3 w-16 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Table & Analytics 2-Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-6 w-52 bg-slate-200" />
              <Skeleton className="h-3 w-72 bg-slate-100" />
            </div>
            <Skeleton className="h-9 w-64 bg-slate-100 rounded-xl" />
          </div>

          <Skeleton className="h-10 w-full bg-white rounded-xl border border-border-warm" />

          <div className="bg-white border border-border-warm rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-border-warm flex gap-4">
              <Skeleton className="h-4 w-1/3 bg-slate-200" />
              <Skeleton className="h-4 w-1/4 bg-slate-200" />
              <Skeleton className="h-4 w-1/6 bg-slate-200" />
              <Skeleton className="h-4 w-1/6 bg-slate-200" />
            </div>
            <div className="divide-y divide-border-warm p-2 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 bg-slate-200" />
                    <Skeleton className="h-3 w-1/3 bg-slate-100" />
                  </div>
                  <Skeleton className="h-6 w-24 bg-slate-100 rounded-full" />
                  <Skeleton className="h-5 w-20 bg-slate-200 font-mono" />
                  <Skeleton className="h-7 w-20 bg-navy-subtle rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border-warm p-5 rounded-2xl space-y-4 shadow-sm">
            <Skeleton className="h-5 w-44 bg-slate-200" />
            <Skeleton className="h-40 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="bg-white border border-border-warm p-5 rounded-2xl space-y-3 shadow-sm">
            <Skeleton className="h-5 w-44 bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InvestigationSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Breadcrumb & Action Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36 bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-32 bg-navy-subtle rounded-lg" />
          <Skeleton className="h-9 w-36 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Case Dossier Main Header Skeleton */}
      <div className="bg-white border border-border-warm p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2.5 w-full max-w-3xl">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 bg-navy-subtle" />
              <Skeleton className="h-4 w-32 bg-slate-100" />
            </div>
            <Skeleton className="h-9 w-4/5 bg-slate-200" />
            <Skeleton className="h-3.5 w-1/2 bg-slate-100" />
          </div>

          <div className="flex flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <Skeleton className="h-8 w-32 bg-slate-100 rounded-full" />
            <Skeleton className="h-8 w-28 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* 4-Metric Grid Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-border-warm">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-28 bg-slate-100" />
              <Skeleton className="h-7 w-32 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Case Genesis Drawer Skeleton */}
      <div className="bg-white border border-border-warm rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-4 bg-slate-200" />
        </div>
        <div className="pt-4 border-t border-border-warm grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full bg-slate-50 rounded-xl" />
          <Skeleton className="h-20 w-full bg-slate-50 rounded-xl" />
        </div>
      </div>

      {/* Tab Navigation Bar Skeleton */}
      <div className="flex items-center gap-2 border-b border-border-warm pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 bg-slate-100 rounded-xl" />
        ))}
      </div>

      {/* Main Canvas / Content Skeleton */}
      <div className="h-[560px] bg-white border border-border-warm rounded-2xl overflow-hidden p-6 relative flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-slate-100 rounded-lg" />
          <Skeleton className="h-8 w-60 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-secondary">Constructing financial crime network graph...</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24 bg-slate-100 rounded-lg" />
          <Skeleton className="h-24 w-36 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ReportSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
      {/* Action Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44 bg-slate-200" />
        <Skeleton className="h-9 w-32 bg-navy-subtle rounded-lg" />
      </div>

      {/* Official Header Card Skeleton */}
      <div className="bg-white border border-border-warm rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border-warm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl bg-navy-subtle" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-52 bg-slate-200" />
              <Skeleton className="h-3 w-40 bg-slate-100" />
            </div>
          </div>
          <Skeleton className="h-6 w-36 bg-red-100 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-2/3 bg-slate-200" />
          <Skeleton className="h-4 w-32 bg-slate-100" />
        </div>
      </div>

      {/* Sections Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-border-warm rounded-2xl p-6 space-y-4 shadow-sm">
          <Skeleton className="h-5 w-60 bg-slate-200 border-b border-border-warm pb-2" />
          <Skeleton className="h-24 w-full bg-slate-50 rounded-xl" />
        </div>
      ))}
    </div>
  );
};
