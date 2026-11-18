"use client";

import React from "react";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

export function Header() {
  return (
    <header className="w-full max-w-xl mb-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 text-xs font-semibold tracking-wide uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <TrendingUp className="w-3.5 h-3.5" />
        Trading Risk & Lot Size Engine
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Chart to Lot Size
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        Paste a trading chart to extract levels with Claude AI, or calculate positions offline with zero latency.
      </p>
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" />
          Offline Manual Mode
        </span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Server-Side Claude Vision
        </span>
      </div>
    </header>
  );
}
