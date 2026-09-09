"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tracefuse_theme") {
        const val = e.newValue;
        if (val === "dark") {
          document.documentElement.classList.add("dark");
          setTheme("dark");
        } else if (val === "light") {
          document.documentElement.classList.remove("dark");
          setTheme("light");
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("tracefuse_theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("tracefuse_theme", "light");
      } catch {}
    }

    // Notify listeners (e.g. charts) that theme changed
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: nextTheme } }));
  };

  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-lg border border-border-warm bg-surface flex items-center justify-center opacity-60 ${className}`}
        aria-hidden="true"
      >
        <Moon className="w-4 h-4 text-ink-secondary" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`p-1.5 sm:p-2 rounded-lg border border-border-warm bg-surface hover:bg-navy-subtle text-ink-secondary hover:text-ink-primary transition-all cursor-pointer shadow-sm flex items-center justify-center ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-navy animate-in spin-in-45 duration-300" />
      )}
    </button>
  );
};
