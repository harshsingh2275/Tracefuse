"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Judge access passcode per Section 3 & 60
    if (passcode === "demo2026" || passcode === "admin") {
      document.cookie = "tracefuse_session=authenticated_analyst; path=/; max-age=86400; SameSite=Lax";
      router.push("/dashboard");
    } else {
      setError("Invalid access code. Please use the judge demo pass: demo2026");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0d14]">
      <div className="w-full max-w-md bg-[#111622] border border-[#1f293d] p-8 rounded-xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 text-xs font-mono font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
            TRACEFUSE COCKPIT AUTH
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Investigator Sign In</h2>
          <p className="text-xs text-gray-400">Financial Crime & AML Investigation Console</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Demo Access Code
            </label>
            <input
              type="password"
              placeholder="Enter demo passcode (demo2026)"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2.5 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-blue-600/20"
          >
            Authenticate Session
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Judge/Evaluator Passcode: <span className="font-mono text-gray-300">demo2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
