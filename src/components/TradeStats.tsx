"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Compass } from "lucide-react";
import { CalculationResult, InstrumentConfig } from "@/lib/types";

interface TradeStatsProps {
  result: CalculationResult;
  config: InstrumentConfig;
}

export function TradeStats({ result, config }: TradeStatsProps) {
  const { direction, riskDistance, profitDistance, riskRewardText, riskRewardRating } = result;

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
      {/* Direction & RR Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <Compass className="w-3.5 h-3.5" />
          Trade Direction
        </span>

        {direction === "buy" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            BUY / LONG
          </span>
        ) : direction === "sell" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-500/30">
            <ArrowDownRight className="w-3.5 h-3.5" />
            SELL / SHORT
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">—</span>
        )}
      </div>

      {/* Distance Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Risk Distance:</span>
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
          {riskDistance !== null ? `${riskDistance.toFixed(1)} ${config.unitName}` : "—"}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Profit Target Distance:</span>
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
          {profitDistance !== null ? `${profitDistance.toFixed(1)} ${config.unitName}` : "—"}
        </span>
      </div>

      {/* Risk : Reward */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
        <span className="text-slate-500">Risk : Reward Ratio:</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {riskRewardText}
          </span>
          {riskRewardRating === "good" && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Good reward
            </span>
          )}
          {riskRewardRating === "okay" && (
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/20">
              Okay
            </span>
          )}
          {riskRewardRating === "poor" && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">
              Reward &lt; Risk
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
