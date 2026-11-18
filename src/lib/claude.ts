import { AIChartExtraction, InstrumentKey, TradeDirection } from "./types";

export const CLAUDE_CHART_PROMPT =
  "This image is a trading chart screenshot with a trade idea drawn on it " +
  "(entry, take profit and stop loss levels). Read the price numbers from " +
  "the image. Return ONLY JSON, no other text: " +
  '{"instrument":"gold"|"jpy"|"forex"|"crypto"|"indices","direction":"buy"|"sell",' +
  '"entry":number,"sl":number,"tp":number}. ' +
  "Use the exact numbers shown for the entry price (EP), stop loss (SL) " +
  "and take profit (TP) levels. Format prices as plain numbers without commas " +
  "or currency symbols (e.g. 2350.5, not 2,350.5). " +
  "If a value is unreadable, use null for it.";

export function toFloat(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/[^\d.-]/g, "");
    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
      return null;
    }
    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseChartJson(text: string): AIChartExtraction {
  const cleaned = (text || "").trim();

  // 1. Check if reply is wrapped inside a ```json ... ``` code fence
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : cleaned;

  // 2. Extract JSON object
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in AI reply");
  }

  const rawJson = jsonMatch[0];
  // Strip trailing commas before closing braces/brackets (e.g. {"a": 1, })
  const cleanedJson = rawJson.replace(/,\s*([\]}])/g, "$1");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch {
    parsed = JSON.parse(rawJson);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response is not a valid JSON object");
  }

  // Instrument validation
  let instrument: InstrumentKey = "forex";
  const validInstruments: InstrumentKey[] = ["gold", "jpy", "forex", "crypto", "indices"];
  if (typeof parsed.instrument === "string" && validInstruments.includes(parsed.instrument as InstrumentKey)) {
    instrument = parsed.instrument as InstrumentKey;
  }

  // Direction validation
  let direction: TradeDirection | null = null;
  if (parsed.direction === "buy" || parsed.direction === "sell") {
    direction = parsed.direction;
  }

  return {
    instrument,
    direction,
    entry: toFloat(parsed.entry),
    sl: toFloat(parsed.sl),
    tp: toFloat(parsed.tp),
  };
}
