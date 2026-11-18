import {
  CalculationInput,
  CalculationResult,
  INSTRUMENTS,
  InstrumentKey,
  RiskRewardRating,
  TradeDirection,
} from "./types";

/**
 * Calculates trade parameters, lot sizes, distances, and validations.
 * This runs client-side for 100% offline functionality.
 */
export function calculateTrade(input: CalculationInput): CalculationResult {
  const { instrument, entry, sl, tp, riskAmount, pipValue } = input;
  const config = INSTRUMENTS[instrument] || INSTRUMENTS.forex;
  const pip = config.pipSize;

  const validRisk = typeof riskAmount === "number" && isFinite(riskAmount) && riskAmount > 0 ? riskAmount : null;
  const validPipValue = typeof pipValue === "number" && isFinite(pipValue) && pipValue > 0 ? pipValue : null;

  // 1. Detect Trade Direction
  let direction: TradeDirection | null = null;
  if (entry !== null && sl !== null) {
    if (entry > sl) {
      direction = "buy";
    } else if (entry < sl) {
      direction = "sell";
    }
  }

  // 2. Distances in pips / points
  let riskDistance: number | null = null;
  let profitDistance: number | null = null;

  if (entry !== null && sl !== null && pip > 0) {
    riskDistance = Math.abs(entry - sl) / pip;
  }

  if (entry !== null && tp !== null && pip > 0) {
    profitDistance = Math.abs(tp - entry) / pip;
  }

  // 3. Risk-to-Reward Ratio
  let riskRewardRatio: number | null = null;
  let riskRewardText = "—";
  let riskRewardRating: RiskRewardRating | null = null;

  if (riskDistance !== null && profitDistance !== null && riskDistance > 0) {
    const rr = profitDistance / riskDistance;
    riskRewardRatio = rr;
    riskRewardText = `1 : ${rr.toFixed(2)}`;
    if (rr >= 2) {
      riskRewardRating = "good";
    } else if (rr >= 1) {
      riskRewardRating = "okay";
    } else {
      riskRewardRating = "poor";
    }
  }

  // 4. Lot Size calculation (D = A ÷ B ÷ C)
  let lotSize: number | null = null;
  let lotSizeFormatted = "—";
  let isMicroLot = false;
  let actualRisk: number | null = null;
  let potentialWin: number | null = null;
  let formulaText = "Fill entry and stop loss to calculate";

  if (
    validRisk !== null &&
    riskDistance !== null &&
    riskDistance > 0 &&
    validPipValue !== null &&
    validPipValue > 0
  ) {
    const rawLot = validRisk / riskDistance / validPipValue;
    const lotRounded = Math.round(rawLot * 100) / 100;
    lotSize = lotRounded;

    if (rawLot < 0.005) {
      isMicroLot = true;
      lotSizeFormatted = "< 0.01";
      formulaText = `${validRisk} ÷ ${riskDistance.toFixed(1)} ÷ ${validPipValue} = ${rawLot.toFixed(4)} (below 0.01 micro lot)`;
    } else {
      isMicroLot = false;
      lotSizeFormatted = lotRounded.toFixed(2);
      formulaText = `${validRisk} ÷ ${riskDistance.toFixed(1)} ÷ ${validPipValue} = ${rawLot.toFixed(4)}`;
    }

    const calcLot = lotRounded > 0 ? lotRounded : rawLot;
    actualRisk = calcLot * riskDistance * validPipValue;

    if (profitDistance !== null) {
      potentialWin = calcLot * profitDistance * validPipValue;
    }
  }

  // 5. Validations
  let validationError: string | null = null;
  if (entry !== null && sl !== null) {
    if (entry === sl) {
      validationError = "Stop loss cannot be equal to entry price";
    } else if (tp !== null) {
      if (entry === tp) {
        validationError = "Take profit cannot be equal to entry price";
      } else if ((sl - entry) * (tp - entry) > 0) {
        validationError = "Stop loss and take profit should be on opposite sides of entry";
      }
    }
  }

  return {
    direction,
    riskDistance,
    profitDistance,
    riskRewardRatio,
    riskRewardText,
    riskRewardRating,
    lotSize,
    lotSizeFormatted,
    isMicroLot,
    actualRisk,
    potentialWin,
    formulaText,
    validationError,
  };
}

/**
 * Normalizes user input string to number or null
 */
export function parseNumberInput(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isFinite(val) ? val : null;
  const cleaned = val.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isFinite(num) ? num : null;
}
