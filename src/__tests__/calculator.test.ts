import { describe, it, expect } from "vitest";
import { calculateTrade, parseNumberInput } from "@/lib/calculator";
import { INSTRUMENTS } from "@/lib/types";

describe("calculateTrade", () => {
  it("detects BUY direction when entry is greater than stop loss", () => {
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.082,
      tp: 1.091,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.direction).toBe("buy");
    expect(result.validationError).toBeNull();
  });

  it("detects SELL direction when entry is less than stop loss", () => {
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.088,
      tp: 1.079,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.direction).toBe("sell");
    expect(result.validationError).toBeNull();
  });

  it("calculates exact pip distances for standard Forex (pip = 0.0001)", () => {
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.082, // 0.0030 diff = 30 pips
      tp: 1.091, // 0.0060 diff = 60 pips
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.riskDistance).toBeCloseTo(30.0, 1);
    expect(result.profitDistance).toBeCloseTo(60.0, 1);
    expect(result.riskRewardRatio).toBeCloseTo(2.0, 2);
    expect(result.riskRewardRating).toBe("good");
    expect(result.riskRewardText).toBe("1 : 2.00");
  });

  it("calculates exact pip distances for JPY pairs (pip = 0.01)", () => {
    const result = calculateTrade({
      instrument: "jpy",
      entry: 155.0,
      sl: 154.5, // 0.50 diff = 50 pips
      tp: 156.25, // 1.25 diff = 125 pips
      riskAmount: 100,
      pipValue: 10,
    });

    expect(result.riskDistance).toBeCloseTo(50.0, 1);
    expect(result.profitDistance).toBeCloseTo(125.0, 1);
    expect(result.riskRewardRatio).toBeCloseTo(2.5, 2);
  });

  it("calculates exact pip distances for Gold XAUUSD (pip = 0.1)", () => {
    const result = calculateTrade({
      instrument: "gold",
      entry: 2650.0,
      sl: 2645.0, // 5.0 diff = 50 pips
      tp: 2665.0, // 15.0 diff = 150 pips
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.riskDistance).toBeCloseTo(50.0, 1);
    expect(result.profitDistance).toBeCloseTo(150.0, 1);
    expect(result.riskRewardRatio).toBeCloseTo(3.0, 2);
  });

  it("calculates exact point distances for Crypto & Indices (point = 1.0)", () => {
    const cryptoResult = calculateTrade({
      instrument: "crypto",
      entry: 90000,
      sl: 89000, // 1000 points
      tp: 93000, // 3000 points
      riskAmount: 100,
      pipValue: 1,
    });

    expect(cryptoResult.riskDistance).toBe(1000);
    expect(cryptoResult.profitDistance).toBe(3000);
    expect(cryptoResult.riskRewardRatio).toBe(3);

    const indexResult = calculateTrade({
      instrument: "indices",
      entry: 44000,
      sl: 43800, // 200 points
      tp: 44400, // 400 points
      riskAmount: 100,
      pipValue: 1,
    });

    expect(indexResult.riskDistance).toBe(200);
    expect(indexResult.profitDistance).toBe(400);
    expect(indexResult.riskRewardRatio).toBe(2);
  });

  it("calculates correct lot size using D = A ÷ B ÷ C", () => {
    // Risk = $50, Stop = 30 pips, Pip value = $10/pip
    // Lot = 50 / (30 * 10) = 50 / 300 = 0.16666... => 0.17 lots
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.082,
      tp: 1.091,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.lotSize).toBe(0.17);
    expect(result.lotSizeFormatted).toBe("0.17");
    expect(result.isMicroLot).toBe(false);
    expect(result.actualRisk).toBeCloseTo(0.17 * 30 * 10, 2); // $51.00
    expect(result.potentialWin).toBeCloseTo(0.17 * 60 * 10, 2); // $102.00
  });

  it("identifies positions below broker micro lot (< 0.01 lots)", () => {
    // Risk = $10, Stop = 300 pips, Pip value = $10
    // Lot = 10 / 3000 = 0.00333... < 0.005
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.3,
      sl: 1.27,
      tp: null,
      riskAmount: 10,
      pipValue: 10,
    });

    expect(result.isMicroLot).toBe(true);
    expect(result.lotSizeFormatted).toBe("< 0.01");
    expect(result.formulaText).toContain("below 0.01 micro lot");
  });

  it("flags validation error when stop loss equals entry price", () => {
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.085,
      tp: 1.09,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.validationError).toBe("Stop loss cannot be equal to entry price");
  });

  it("flags validation error when take profit equals entry price", () => {
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.08,
      tp: 1.085,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.validationError).toBe("Take profit cannot be equal to entry price");
  });

  it("flags validation error when SL and TP are on the same side of entry", () => {
    // Both SL and TP are below entry (invalid trade idea)
    const result = calculateTrade({
      instrument: "forex",
      entry: 1.085,
      sl: 1.08,
      tp: 1.075,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(result.validationError).toBe(
      "Stop loss and take profit should be on opposite sides of entry"
    );
  });

  it("works completely offline with empty or partial inputs", () => {
    const emptyResult = calculateTrade({
      instrument: "forex",
      entry: null,
      sl: null,
      tp: null,
      riskAmount: 50,
      pipValue: 10,
    });

    expect(emptyResult.lotSizeFormatted).toBe("—");
    expect(emptyResult.direction).toBeNull();
    expect(emptyResult.riskRewardText).toBe("—");
  });
});

describe("parseNumberInput", () => {
  it("parses valid numbers, strings, and comma-formatted numbers", () => {
    expect(parseNumberInput(123)).toBe(123);
    expect(parseNumberInput("1.0850")).toBe(1.085);
    expect(parseNumberInput("2,350.50")).toBe(2350.5);
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput(null)).toBeNull();
    expect(parseNumberInput(undefined)).toBeNull();
    expect(parseNumberInput("invalid")).toBeNull();
  });
});
