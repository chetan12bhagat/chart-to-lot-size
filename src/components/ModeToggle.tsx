"use client";

import React from "react";
import { Sparkles, Calculator } from "lucide-react";

interface ModeToggleProps {
  mode: "chart" | "manual";
  onChange: (mode: "chart" | "manual") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Calculator Modes"
      className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 mb-5"
    >
      <button
        type="button"
        role="tab"
        id="mode-chart-tab"
        aria-selected={mode === "chart"}
        aria-controls="chart-section"
        onClick={() => onChange("chart")}
        className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
          mode === "chart"
            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Read from chart
      </button>

      <button
        type="button"
        role="tab"
        id="mode-manual-tab"
        aria-selected={mode === "manual"}
        aria-controls="manual-section"
        onClick={() => onChange("manual")}
        className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
          mode === "manual"
            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Calculator className="w-4 h-4" />
        Type prices manually
      </button>
    </div>
  );
}
