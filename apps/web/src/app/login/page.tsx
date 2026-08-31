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
    <div className="w-full max-w-md bg-white border border-border-warm p-8 rounded-2xl shadow-sm space-y-6 relative z-10">
      {/* Header Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide text-navy bg-navy-subtle border border-navy/20 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-navy" />
          TRACEFUSE SURVEILLANCE GATE
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight font-serif">
          Investigator Access
        </h1>
        <p className="text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
          Financial Crime & Forensic Pattern Detection Console — Build Bank Hackathon Track 2
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
          <label className="block text-xs font-semibold text-ink-primary mb-1.5 flex items-center justify-between">
            <span>Demo Access Passcode</span>
            <span className="font-mono text-ink-secondary text-[11px]">Default: demo2026</span>
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-border-warm rounded-xl text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy font-mono text-sm transition-all"
              autoFocus
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-severity-critical-bg border border-severity-critical-border rounded-xl text-xs text-severity-critical flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-severity-critical shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-navy hover:bg-navy-hover text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-navy/20 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{loading ? "Authenticating..." : "Enter Investigation Cockpit"}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>

      {/* Quick Demo Access for Hackathon Judges (<60s to wow) */}
      <div className="pt-3 border-t border-border-warm space-y-2.5">
        <button
          type="button"
          onClick={() => {
            document.cookie = "tracefuse_session=authenticated_analyst; path=/; max-age=86400; SameSite=Lax";
            router.push("/investigations/inv_flagship_demo?tab=graph");
          }}
          className="w-full py-3 px-4 bg-navy hover:bg-navy-hover text-white text-xs font-semibold rounded-xl border border-navy shadow-md shadow-navy/20 transition-all flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Load Demo Investigation (1-Click Judge Access)
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => handleLogin("demo2026")}
          className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-ink-secondary hover:text-ink-primary text-xs rounded-xl border border-border-warm transition-all flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-navy" />
            Passcode: <strong className="text-ink-primary font-mono">demo2026</strong>
          </span>
          <span className="text-navy font-semibold text-[11px] group-hover:underline">Go to Dashboard &rarr;</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-ink-secondary font-mono pt-1">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-700" />
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-linen text-ink-primary relative overflow-hidden font-sans">
      <Suspense fallback={<div className="text-ink-secondary text-xs">Loading Auth Gate...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
