export type InstrumentKey = "forex" | "jpy" | "gold" | "crypto" | "indices";

export type TradeDirection = "buy" | "sell";

export interface InstrumentConfig {
  key: InstrumentKey;
  name: string;
  description: string;
  pipSize: number;
  unitName: "pips" | "points";
  defaultPipValue: number;
  contractSpecs: string;
  placeholderPrice: string;
}

export const INSTRUMENTS: Record<InstrumentKey, InstrumentConfig> = {
  forex: {
    key: "forex",
    name: "Forex Major & Minor Pairs",
    description: "EURUSD, GBPUSD, AUDUSD, etc. (pip 0.0001)",
    pipSize: 0.0001,
    unitName: "pips",
    defaultPipValue: 10,
    contractSpecs: "1 Standard Lot = 100,000 units ($10/pip)",
    placeholderPrice: "1.0850",
  },
  jpy: {
    key: "jpy",
    name: "JPY Pairs",
    description: "USDJPY, GBPJPY, EURJPY (pip 0.01)",
    pipSize: 0.01,
    unitName: "pips",
    defaultPipValue: 10,
    contractSpecs: "1 Standard Lot = 100,000 units (~$10/pip)",
    placeholderPrice: "155.20",
  },
  gold: {
    key: "gold",
    name: "Gold (XAUUSD)",
    description: "Gold vs USD (pip 0.10 / $0.10 move)",
    pipSize: 0.1,
    unitName: "pips",
    defaultPipValue: 10,
    contractSpecs: "1 Standard Lot = 100 oz ($10 per $0.10 pip)",
    placeholderPrice: "2650.50",
  },
  crypto: {
    key: "crypto",
    name: "Cryptocurrency",
    description: "BTCUSD, ETHUSD, etc. (point 1.0)",
    pipSize: 1.0,
    unitName: "points",
    defaultPipValue: 1,
    contractSpecs: "1 Standard Contract = 1 Coin ($1/point)",
    placeholderPrice: "88500.00",
  },
  indices: {
    key: "indices",
    name: "Indices (US30 / NAS100 / SPX500)",
    description: "Dow 30, Nasdaq 100, S&P 500 (point 1.0)",
    pipSize: 1.0,
    unitName: "points",
    defaultPipValue: 1,
    contractSpecs: "1 CFD Contract ($1/point per full contract)",
    placeholderPrice: "44200.00",
  },
};

export interface CalculationInput {
  instrument: InstrumentKey;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  riskAmount: number;
  pipValue: number;
}

export type RiskRewardRating = "good" | "okay" | "poor";

export interface CalculationResult {
  direction: TradeDirection | null;
  riskDistance: number | null;
  profitDistance: number | null;
  riskRewardRatio: number | null;
  riskRewardText: string;
  riskRewardRating: RiskRewardRating | null;
  lotSize: number | null;
  lotSizeFormatted: string;
  isMicroLot: boolean;
  actualRisk: number | null;
  potentialWin: number | null;
  formulaText: string;
  validationError: string | null;
}

export interface AIChartExtraction {
  instrument: InstrumentKey;
  direction: TradeDirection | null;
  entry: number | null;
  sl: number | null;
  tp: number | null;
}

export interface ApiResponseSuccess extends AIChartExtraction {
  success: true;
}

export interface ApiResponseError {
  error: string;
  success?: false;
}

export type ApiResponse = ApiResponseSuccess | ApiResponseError;
