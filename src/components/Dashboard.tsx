"use client";

import React, { useState, useMemo } from "react";
import { Header } from "./Header";
import { ModeToggle } from "./ModeToggle";
import { ChartUploader } from "./ChartUploader";
import { ExtractedConfirmation } from "./ExtractedConfirmation";
import { InstrumentSelector } from "./InstrumentSelector";
import { PriceInputs } from "./PriceInputs";
import { TradeStats } from "./TradeStats";
import { LotSizeCard } from "./LotSizeCard";
import { AIChartExtraction, INSTRUMENTS, InstrumentKey } from "@/lib/types";
import { calculateTrade, parseNumberInput } from "@/lib/calculator";

export function Dashboard() {
  const [mode, setMode] = useState<"chart" | "manual">("chart");
  const [instrument, setInstrument] = useState<InstrumentKey>("forex");
  const [entry, setEntry] = useState<string>("");
  const [sl, setSl] = useState<string>("");
  const [tp, setTp] = useState<string>("");
  const [riskAmount, setRiskAmount] = useState<string>("50");
  const [pipValue, setPipValue] = useState<string>("10");
  const [extractedData, setExtractedData] = useState<AIChartExtraction | null>(null);

  // When user selects a different instrument, update default pip value to match specs
  const handleInstrumentChange = (newInstrument: InstrumentKey) => {
    setInstrument(newInstrument);
    const targetConfig = INSTRUMENTS[newInstrument];
    if (targetConfig) {
      setPipValue(targetConfig.defaultPipValue.toString());
    }
  };

  // When Claude extracts levels from an uploaded screenshot
  const handleExtracted = (data: AIChartExtraction) => {
    setExtractedData(data);
    if (data.instrument && INSTRUMENTS[data.instrument]) {
      setInstrument(data.instrument);
      setPipValue(INSTRUMENTS[data.instrument].defaultPipValue.toString());
    }
    if (data.entry !== null && data.entry !== undefined) {
      setEntry(data.entry.toString());
    }
    if (data.sl !== null && data.sl !== undefined) {
      setSl(data.sl.toString());
    }
    if (data.tp !== null && data.tp !== undefined) {
      setTp(data.tp.toString());
    }
  };

  const handleClearPrices = () => {
    setEntry("");
    setSl("");
    setTp("");
    setExtractedData(null);
  };

  const handleClearChart = () => {
    handleClearPrices();
  };

  // Reactive trade calculations (fully client-side & offline)
  const calculationResult = useMemo(() => {
    return calculateTrade({
      instrument,
      entry: parseNumberInput(entry),
      sl: parseNumberInput(sl),
      tp: parseNumberInput(tp),
      riskAmount: parseNumberInput(riskAmount) ?? 50,
      pipValue: parseNumberInput(pipValue) ?? 10,
    });
  }, [instrument, entry, sl, tp, riskAmount, pipValue]);

  const currentConfig = INSTRUMENTS[instrument] || INSTRUMENTS.forex;

  return (
    <main className="w-full max-w-xl mx-auto space-y-4">
      <Header />

      <ModeToggle mode={mode} onChange={setMode} />

      {/* Chart Upload Section (Visible in "chart" mode) */}
      {mode === "chart" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <ChartUploader
            onExtracted={handleExtracted}
            onClear={handleClearChart}
          />
        </div>
      )}

      {/* AI Extracted Level Confirmation Banner */}
      <ExtractedConfirmation
        data={extractedData}
        onDismiss={() => setExtractedData(null)}
      />

      {/* Price Inputs & Trade Parameters Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <InstrumentSelector
          value={instrument}
          onChange={handleInstrumentChange}
        />

        <PriceInputs
          instrument={instrument}
          entry={entry}
          sl={sl}
          tp={tp}
          validationError={calculationResult.validationError}
          onEntryChange={setEntry}
          onSlChange={setSl}
          onTpChange={setTp}
          onClear={handleClearPrices}
        />

        <TradeStats
          result={calculationResult}
          config={currentConfig}
        />
      </div>

      {/* Lot Size & Risk Management Card */}
      <LotSizeCard
        result={calculationResult}
        config={currentConfig}
        riskAmount={riskAmount}
        pipValue={pipValue}
        onRiskAmountChange={setRiskAmount}
        onPipValueChange={setPipValue}
      />
    </main>
  );
}
