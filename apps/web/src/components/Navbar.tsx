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
  Zap,
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
    <header className="sticky top-0 z-50 bg-[#0a0d14]/90 backdrop-blur-md border-b border-[#1f293d] px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600/25 transition-all">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-base font-bold text-white tracking-wider flex items-center gap-1.5">
                <span>TRACEFUSE</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-normal">
                  PROTOTYPE
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono tracking-tight -mt-0.5">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
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
        <div className="flex items-center gap-3">
          {/* Flagship Demo Button (<60s to wow per Section 21) */}
          <Link
            href="/investigations/inv_flagship_demo?tab=graph"
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-medium rounded-lg shadow-lg shadow-blue-600/20 border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">Load Demo Investigation</span>
            <span className="sm:hidden">Demo Case</span>
          </Link>

          {/* Analyst Profile & Sign Out */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-800">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-medium text-gray-200 flex items-center gap-1 justify-end">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                Priya Sharma
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Lead AML Investigator</span>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out of Cockpit"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
