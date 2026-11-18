"use client";

import React from "react";
import { DollarSign, ShieldAlert, Award, Calculator, Info } from "lucide-react";
import { CalculationResult, InstrumentConfig } from "@/lib/types";

interface LotSizeCardProps {
  result: CalculationResult;
  config: InstrumentConfig;
  riskAmount: string;
  pipValue: string;
  onRiskAmountChange: (val: string) => void;
  onPipValueChange: (val: string) => void;
}

const PRESET_RISKS = ["25", "50", "100", "200", "500"];

export function LotSizeCard({
  result,
  config,
  riskAmount,
  pipValue,
  onRiskAmountChange,
  onPipValueChange,
}: LotSizeCardProps) {
  const {
    lotSizeFormatted,
    isMicroLot,
    actualRisk,
    potentialWin,
    formulaText,
    riskDistance,
    riskRewardRatio,
  } = result;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Position Sizing & Risk Management
        </h2>
        <span className="text-xs text-slate-400 font-mono">D = A ÷ B ÷ C</span>
      </div>

      {/* Inputs: Risk $, Pip Value $, Stop Pips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Risk Amount (A) */}
        <div>
          <label
            htmlFor="risk-amount-input"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            A — Risk ($)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              $
            </span>
            <input
              type="number"
              id="risk-amount-input"
              step="any"
              inputMode="decimal"
              value={riskAmount}
              onChange={(e) => onRiskAmountChange(e.target.value)}
              className="w-full pl-6 pr-2 py-2 text-sm font-mono font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {/* Quick Presets */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {PRESET_RISKS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onRiskAmountChange(preset)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                  riskAmount === preset
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Pip Value (C) */}
        <div>
          <label
            htmlFor="pip-value-input"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1"
          >
            <span>C — {config.unitName === "pips" ? "Pip" : "Point"} Value ($)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              $
            </span>
            <input
              type="number"
              id="pip-value-input"
              step="any"
              inputMode="decimal"
              value={pipValue}
              onChange={(e) => onPipValueChange(e.target.value)}
              className="w-full pl-6 pr-2 py-2 text-sm font-mono font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="block text-[10px] text-slate-400 mt-1 truncate">
            Default: ${config.defaultPipValue} / standard lot
          </span>
        </div>

        {/* Stop Pips (B) */}
        <div>
          <label
            htmlFor="stop-pips-display"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
          >
            B — Stop {config.unitName}
          </label>
          <input
            type="text"
            id="stop-pips-display"
            readOnly
            value={riskDistance !== null ? riskDistance.toFixed(1) : "—"}
            className="w-full py-2 px-3 text-sm font-mono font-semibold rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <span className="block text-[10px] text-slate-400 mt-1">
            Distance from Entry to SL
          </span>
        </div>
      </div>

      {/* Lot Size Result Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-emerald-500/30 text-center relative overflow-hidden">
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
          Recommended Position Size
        </span>

        <div className="my-2 flex items-baseline justify-center gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
            {lotSizeFormatted}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">
            {lotSizeFormatted !== "—" ? "Lots" : ""}
          </span>
        </div>

        {/* Formula breakdown */}
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all px-2">
          {formulaText}
        </p>

        {isMicroLot && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            Size is below broker minimum 0.01 micro lot. Consider widening stop or increasing risk.
          </div>
        )}
      </div>

      {/* Risk / Reward Visualizer Bar */}
      {riskRewardRatio !== null && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Risk/Reward Visualizer</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              1 : {riskRewardRatio.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {/* Risk Portion (fixed 1 unit) */}
            <div
              style={{
                width: `${Math.min(100, Math.max(15, (1 / (1 + riskRewardRatio)) * 100))}%`,
              }}
              className="h-full bg-rose-500/80 transition-all flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-tighter"
            >
              Risk
            </div>
            {/* Reward Portion */}
            <div
              style={{
                width: `${Math.min(85, Math.max(10, (riskRewardRatio / (1 + riskRewardRatio)) * 100))}%`,
              }}
              className="h-full bg-emerald-500/80 transition-all flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-tighter"
            >
              Reward
            </div>
          </div>
        </div>
      )}

      {/* PnL Estimates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-rose-500" />
            Maximum Risk:
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {actualRisk !== null ? `$${actualRisk.toFixed(2)}` : "$—"}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-slate-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            Potential Profit:
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {potentialWin !== null ? `$${potentialWin.toFixed(2)}` : "$—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Calculations round lot size to 2 decimal places standard for MetaTrader / cTrader / TradingView.</span>
      </div>
    </div>
  );
}
