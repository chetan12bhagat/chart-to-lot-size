import { describe, it, expect } from "vitest";
import { parseChartJson, toFloat } from "@/lib/claude";

describe("toFloat", () => {
  it("converts numbers and string numbers accurately", () => {
    expect(toFloat(2350.5)).toBe(2350.5);
    expect(toFloat("2350.50")).toBe(2350.5);
    expect(toFloat("2,350.50")).toBe(2350.5);
    expect(toFloat("$2,340.00")).toBe(2340.0);
    expect(toFloat("null")).toBeNull();
    expect(toFloat("")).toBeNull();
    expect(toFloat(null)).toBeNull();
    expect(toFloat(undefined)).toBeNull();
  });
});

describe("parseChartJson", () => {
  it("parses valid JSON response", () => {
    const raw = JSON.stringify({
      instrument: "gold",
      direction: "buy",
      entry: 2650.5,
      sl: 2640.0,
      tp: 2670.0,
    });

    const parsed = parseChartJson(raw);
    expect(parsed.instrument).toBe("gold");
    expect(parsed.direction).toBe("buy");
    expect(parsed.entry).toBe(2650.5);
    expect(parsed.sl).toBe(2640.0);
    expect(parsed.tp).toBe(2670.0);
  });

  it("handles markdown code fences around JSON", () => {
    const raw =
      "Here is the chart data:\n" +
      "```json\n" +
      '{"instrument":"forex","direction":"sell","entry":1.085,"sl":1.088,"tp":1.080}\n' +
      "```\n" +
      "Good luck!";

    const parsed = parseChartJson(raw);
    expect(parsed.instrument).toBe("forex");
    expect(parsed.direction).toBe("sell");
    expect(parsed.entry).toBe(1.085);
    expect(parsed.sl).toBe(1.088);
    expect(parsed.tp).toBe(1.08);
  });

  it("handles trailing commas in JSON", () => {
    const raw = '{"instrument": "crypto", "direction": "buy", "entry": 65200.5, "sl": 64000.0, "tp": 68000.0, }';
    const parsed = parseChartJson(raw);
    expect(parsed.instrument).toBe("crypto");
    expect(parsed.entry).toBe(65200.5);
    expect(parsed.sl).toBe(64000.0);
    expect(parsed.tp).toBe(68000.0);
  });

  it("handles null values from unreadable chart fields", () => {
    const raw = '{"instrument": "jpy", "direction": "buy", "entry": 150.25, "sl": null, "tp": null}';
    const parsed = parseChartJson(raw);
    expect(parsed.instrument).toBe("jpy");
    expect(parsed.direction).toBe("buy");
    expect(parsed.entry).toBe(150.25);
    expect(parsed.sl).toBeNull();
    expect(parsed.tp).toBeNull();
  });

  it("throws an error when no JSON is present in the reply", () => {
    expect(() => parseChartJson("Sorry, I could not detect any chart levels.")).toThrow(
      "No JSON object found in AI reply"
    );
  });
});
