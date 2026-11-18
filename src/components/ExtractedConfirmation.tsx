"use client";

import React from "react";
import { CheckCheck, Sparkles, X } from "lucide-react";
import { AIChartExtraction, INSTRUMENTS } from "@/lib/types";

interface ExtractedConfirmationProps {
  data: AIChartExtraction | null;
  onDismiss: () => void;
}

export function ExtractedConfirmation({ data, onDismiss }: ExtractedConfirmationProps) {
  if (!data) return null;

  const instrumentName = INSTRUMENTS[data.instrument]?.name || data.instrument;

  return (
    <div
      role="region"
      aria-label="AI Extracted Chart Levels"
      className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 text-slate-800 dark:text-slate-100 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          AI Extracted Levels Confirmed
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss AI notification"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase">Instrument</span>
          <span className="font-semibold">{instrumentName}</span>
        </div>

        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase">Direction</span>
          <span
            className={`font-bold ${
              data.direction === "buy"
                ? "text-emerald-600 dark:text-emerald-400"
                : data.direction === "sell"
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {data.direction ? data.direction.toUpperCase() : "Auto-detected"}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase">Entry Price</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {data.entry !== null ? data.entry : "—"}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase">Stop Loss / TP</span>
          <span className="font-mono font-medium text-slate-900 dark:text-white">
            {data.sl ?? "—"} / {data.tp ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-500/20 text-xs text-slate-500 dark:text-slate-400">
        <span>You can fine-tune any values below if needed.</span>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Confirmed
        </button>
      </div>
    </div>
  );
}
