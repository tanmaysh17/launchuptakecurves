import type { Preset } from "../types";

export const PRESETS: Preset[] = [
  {
    id: "ioMonotherapy",
    label: "IO Monotherapy (e.g., Pembrolizumab)",
    description: "Moderate early dropout with a long tail of durable responders. Shape k < 1 gives decreasing hazard.",
    model: "weibull",
    params: { lambda: 8, k: 0.7, ceiling: 100 }
  },
  {
    id: "chemotherapy",
    label: "Chemotherapy (6-cycle regimen)",
    description: "Steep initial drop — most patients complete 4–6 cycles then discontinue. Nearly exponential decay.",
    model: "exponential",
    params: { lambda: 0.15, ceiling: 100 }
  },
  {
    id: "oralTKI",
    label: "Oral TKI (e.g., Osimertinib)",
    description: "Log-normal curve: high early persistence, median ~14 months, gradual late dropout.",
    model: "logNormal",
    params: { medianMonths: 14, sigma: 0.8, ceiling: 100 }
  },
  {
    id: "carT",
    label: "CAR-T (one-time infusion)",
    description: "Mixture cure model: ~35% of patients achieve durable complete response (cured fraction).",
    model: "mixtureCure",
    params: { pi: 0.35, lambda: 6, k: 1.2 }
  },
  {
    id: "adjuvant",
    label: "Adjuvant Therapy (12-month course)",
    description: "Piecewise linear: 95% at 3 months, 80% at 6, 60% at 9, 40% completing full 12 months.",
    model: "piecewise",
    params: {
      knots: [
        { month: 0, survival: 100 },
        { month: 3, survival: 95 },
        { month: 6, survival: 80 },
        { month: 9, survival: 60 },
        { month: 12, survival: 40 },
        { month: 18, survival: 15 },
        { month: 24, survival: 5 }
      ]
    }
  },
  {
    id: "maintenance",
    label: "Maintenance Therapy (long-term)",
    description: "Weibull with high k (increasing hazard) — patients tolerate well initially, dropout accelerates over time.",
    model: "weibull",
    params: { lambda: 18, k: 1.5, ceiling: 100 }
  }
];
