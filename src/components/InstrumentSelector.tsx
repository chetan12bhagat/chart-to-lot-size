"use client";

import React from "react";
import { INSTRUMENTS, InstrumentKey } from "@/lib/types";

interface InstrumentSelectorProps {
  value: InstrumentKey;
  onChange: (key: InstrumentKey) => void;
}

export function InstrumentSelector({ value, onChange }: InstrumentSelectorProps) {
  const selectedConfig = INSTRUMENTS[value] || INSTRUMENTS.forex;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="instrument-select"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Trading Instrument
        </label>
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
          Pip/Point: {selectedConfig.pipSize}
        </span>
      </div>

      <div className="relative">
        <select
          id="instrument-select"
          value={value}
          onChange={(e) => onChange(e.target.value as InstrumentKey)}
          aria-describedby="instrument-specs"
          className="w-full py-2.5 px-3 text-sm font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
        >
          <option value="forex">Forex Majors & Minors (EURUSD, GBPUSD) — pip 0.0001</option>
          <option value="jpy">JPY Pairs (USDJPY, GBPJPY) — pip 0.01</option>
          <option value="gold">Gold (XAUUSD) — pip 0.10</option>
          <option value="crypto">Cryptocurrency (BTC/ETH) — point 1.0</option>
          <option value="indices">Indices (US30 / NAS100 / SPX500) — point 1.0</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      <p id="instrument-specs" className="text-[11px] text-slate-400 dark:text-slate-500">
        Contract Spec: {selectedConfig.contractSpecs}
      </p>
    </div>
  );
}
