"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Lock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "TraceFuse — Investigator Access";
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter your investigator passcode.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await api.login(passcode.trim());
      router.push("/dashboard");
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Invalid access passcode.";
      setError(msg);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setLoading(true);
    try {
      await api.demoLogin();
      router.push("/investigations/inv_flagship_demo?tab=graph");
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Demo authentication failed.";
      setError(msg);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface border border-border-warm p-8 rounded-2xl shadow-sm space-y-6 relative z-10">
      {/* Header Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide text-navy bg-navy-subtle border border-navy/20 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-navy" />
          TraceFuse Investigator Console
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
        onSubmit={handleLogin}
        className="space-y-4 pt-2"
      >
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-1.5">
            Passcode
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-linen border border-border-warm rounded-xl text-ink-primary placeholder-ink-muted focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy font-mono text-sm transition-all"
              autoFocus
            />
            <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-3 pointer-events-none" />
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

      {/* Demo Investigation Fast-Track Access */}
      <div className="pt-3 border-t border-border-warm space-y-3">
        <button
          type="button"
          onClick={handleDemoAccess}
          disabled={loading}
          className="w-full py-3 px-4 bg-navy hover:bg-navy-hover text-white text-xs font-semibold rounded-xl border border-navy shadow-md shadow-navy/20 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-70"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Load Demo Investigation (1-Click Judge Access)
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Muted Footer Captions */}
        <div className="text-center space-y-1 pt-1">
          <p className="text-[11px] text-ink-secondary">
            Access restricted to authorized fraud investigation personnel.
          </p>
          <p className="text-[11px] text-ink-muted font-sans">
            Build Bank Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linen text-ink-primary relative overflow-hidden font-sans">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
