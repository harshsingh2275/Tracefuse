"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Layers,
  Sparkles,
  LogOut,
  UserCheck,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    document.cookie = "tracefuse_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Investigations", href: "/investigations", icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border-warm px-3 sm:px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-navy-subtle border border-navy/20 text-navy group-hover:bg-navy/15 transition-all shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="font-serif text-sm sm:text-base font-bold text-ink-primary tracking-wide flex items-center gap-1.5">
                <span>TraceFuse</span>
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-navy-subtle text-navy border border-navy/20 rounded font-sans font-medium">
                  AML Platform
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-ink-secondary tracking-tight -mt-0.5 font-sans truncate">
                Financial Crime Cockpit
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-navy-subtle text-navy border border-navy/20 font-semibold"
                      : "text-ink-secondary hover:text-ink-primary hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Flagship Demo Button */}
          <Link
            href="/investigations/inv_flagship_demo?tab=graph"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-navy hover:bg-navy-hover text-white text-xs font-sans font-semibold rounded-lg shadow-md shadow-navy/20 border border-navy flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            <span className="hidden md:inline">Load Demo Investigation</span>
            <span className="md:hidden">Demo Case</span>
          </Link>

          {/* Analyst Profile & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-border-warm">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-ink-primary flex items-center gap-1 justify-end font-sans">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Priya Sharma
              </span>
              <span className="text-[10px] text-ink-secondary font-sans">Lead AML Investigator</span>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out of Cockpit"
              className="p-1.5 rounded-lg text-ink-secondary hover:text-severity-critical hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
