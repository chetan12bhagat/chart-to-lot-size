"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { INSTRUMENTS, InstrumentKey } from "@/lib/types";

interface PriceInputsProps {
  instrument: InstrumentKey;
  entry: string;
  sl: string;
  tp: string;
  validationError: string | null;
  onEntryChange: (val: string) => void;
  onSlChange: (val: string) => void;
  onTpChange: (val: string) => void;
  onClear: () => void;
}

export function PriceInputs({
  instrument,
  entry,
  sl,
  tp,
  validationError,
  onEntryChange,
  onSlChange,
  onTpChange,
  onClear,
}: PriceInputsProps) {
  const config = INSTRUMENTS[instrument] || INSTRUMENTS.forex;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Price Levels
        </span>
        {(entry || sl || tp) && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Prices
          </button>
        )}
      </div>

      {/* Entry Price */}
      <div>
        <label
          htmlFor="entry-price-input"
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Entry Price (EP)
        </label>
        <input
          type="number"
          id="entry-price-input"
          step="any"
          inputMode="decimal"
          placeholder={`e.g. ${config.placeholderPrice}`}
          value={entry}
          onChange={(e) => onEntryChange(e.target.value)}
          className="w-full py-2.5 px-3 text-sm font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Stop Loss & Take Profit in 2 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="stop-loss-input"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between"
          >
            <span>Stop Loss (SL)</span>
            <span className="text-[10px] text-rose-500 font-semibold uppercase">Risk</span>
          </label>
          <input
            type="number"
            id="stop-loss-input"
            step="any"
            inputMode="decimal"
            placeholder="e.g. Stop price"
            value={sl}
            onChange={(e) => onSlChange(e.target.value)}
            className="w-full py-2.5 px-3 text-sm font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="take-profit-input"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between"
          >
            <span>Take Profit (TP)</span>
            <span className="text-[10px] text-emerald-500 font-semibold uppercase">Target</span>
          </label>
          <input
            type="number"
            id="take-profit-input"
            step="any"
            inputMode="decimal"
            placeholder="e.g. Target price"
            value={tp}
            onChange={(e) => onTpChange(e.target.value)}
            className="w-full py-2.5 px-3 text-sm font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Validation Warning */}
      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 text-xs font-medium animate-fadeIn"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
