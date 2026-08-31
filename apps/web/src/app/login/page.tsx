"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, KeyRound, ArrowRight, Lock, Terminal, Sparkles } from "lucide-react";

function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = (codeToTest?: string) => {
    const code = codeToTest ?? passcode;
    setError("");
    setLoading(true);

    // Hardcoded password for judging evaluation per Section 3 & Section 60
    if (code === "demo2026" || code === "admin") {
      document.cookie = "tracefuse_session=authenticated_analyst; path=/; max-age=86400; SameSite=Lax";
      const destination = searchParams.get("from") || "/dashboard";
      router.push(destination);
    } else {
      setLoading(false);
      setError("Invalid access passcode. Please enter 'demo2026' for hackathon demo access.");
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111622] border border-[#1f293d] p-8 rounded-2xl shadow-2xl space-y-6 relative z-10">
      {/* Header Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono font-medium tracking-wide text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
          TRACEFUSE COCKPIT AUTH
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-mono">
          Investigator Access
        </h1>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Financial Crime & Pattern Detection Console — Build Bank Hackathon Track 2
        </p>
      </div>

      {/* Login Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="space-y-4 pt-2"
      >
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between">
            <span>Demo Access Passcode</span>
            <span className="font-mono text-gray-500 text-[11px]">Default: demo2026</span>
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="Enter passcode (demo2026)"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm transition-all"
              autoFocus
            />
            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{loading ? "Authenticating..." : "Enter Investigation Cockpit"}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>

      {/* Quick Demo Access for Hackathon Judges (Section 21) */}
      <div className="pt-3 border-t border-[#1f293d] space-y-2.5">
        <button
          type="button"
          onClick={() => {
            document.cookie = "tracefuse_session=authenticated_analyst; path=/; max-age=86400; SameSite=Lax";
            router.push("/investigations/inv_flagship_demo?tab=graph");
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-mono text-xs font-bold rounded-xl border border-blue-400/40 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            Load Demo Investigation (1-Click Judge Access)
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => handleLogin("demo2026")}
          className="w-full py-2 px-3 bg-[#182030] hover:bg-[#202b40] text-gray-400 hover:text-white font-mono text-xs rounded-xl border border-[#26344d] transition-all flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            Passcode: <strong className="text-gray-200">demo2026</strong>
          </span>
          <span className="text-blue-400 group-hover:underline text-[11px]">Go to Dashboard &rarr;</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-400" />
            System Status: Active
          </span>
          <span>Build Bank Hackathon 2026</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0d14] text-[#f3f4f6] relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full top-1/4 left-1/3 pointer-events-none" />

      <Suspense fallback={<div className="text-gray-400 font-mono text-xs">Loading Auth Gate...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
