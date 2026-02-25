import { useState } from "react";
import type { CurveModel } from "../types";

interface ModelGuideProps {
  model: CurveModel;
}

interface ModelInfo {
  label: string;
  formula: string;
  oneLiner: string;
  hazardSummary: string;
  whenToUse: string[];
  clinicalContext: string;
  paramSummary: string[];
}

const MODEL_INFO: Record<CurveModel, ModelInfo> = {
  weibull: {
    label: "Weibull",
    formula: "S(t) = C * exp(-(t / lambda)^k)",
    oneLiner:
      "The standard HTA survival model. Shape parameter k controls whether dropout accelerates, decelerates, or stays constant over time.",
    hazardSummary:
      "k < 1 = decreasing hazard (IO/immunotherapy: early non-responders exit, tail is durable responders). k = 1 = constant (reduces to exponential). k > 1 = increasing hazard (maintenance therapy: cumulative fatigue and tolerability issues).",
    whenToUse: [
      "IO monotherapy (pembrolizumab, nivolumab) — use k = 0.6–0.8.",
      "Maintenance therapy (olaparib, bevacizumab) — use k = 1.2–1.6.",
      "Default starting model for KM fitting and NICE/CADTH HTA submissions.",
    ],
    clinicalContext:
      "Weibull is the most widely accepted parametric model in health technology assessment. NICE DSU TSD 14 lists it as a primary candidate. The shape parameter k is the key clinical input: values below 1 reflect survivor enrichment (early non-responders exit quickly, leaving a persistent tail), while values above 1 reflect cumulative dropout as tolerability declines over time.",
    paramSummary: [
      "lambda (scale): shifts the curve right (higher = longer persistence). Roughly, the characteristic life.",
      "k (shape): < 1 decreasing hazard, = 1 exponential, > 1 increasing hazard.",
      "ceiling: initial persistence fraction. Set below 100 if some patients never properly initiate.",
    ],
  },
  exponential: {
    label: "Exponential",
    formula: "S(t) = C * exp(-lambda * t)",
    oneLiner:
      "Constant hazard (memoryless). The simplest parametric model and a useful statistical reference case.",
    hazardSummary:
      "Flat hazard: the monthly probability of discontinuation is the same at month 1 as at month 24. Clinically unrealistic for most oncology settings but provides a conservative lower-bound estimate.",
    whenToUse: [
      "Chemotherapy regimens where per-cycle dropout is roughly constant.",
      "Reference model when data are very sparse (fewer than 4 observed points).",
      "Sensitivity analysis alongside Weibull in HTA submissions.",
    ],
    clinicalContext:
      "Exponential is a special case of Weibull with k = 1. Its memoryless property means time on therapy provides no information about future dropout risk — which is why it rarely fits real-world data well. Use it as a benchmark or conservative downside, not as a primary model. Median DoT = ln(2) / lambda.",
    paramSummary: [
      "lambda: monthly dropout rate. Median DoT = 0.693 / lambda.",
      "ceiling: initial persistence fraction.",
    ],
  },
  logNormal: {
    label: "Log-Normal",
    formula: "S(t) = C * (1 - Phi((ln(t) - ln(median)) / sigma))",
    oneLiner:
      "Humped hazard that peaks then declines. Common for oral targeted therapies where the median DoT is a direct clinical input.",
    hazardSummary:
      "Hazard rises from zero, peaks at t* = median * exp(-sigma^2), then falls asymptotically toward zero. Reflects survivor enrichment: as time passes, remaining patients are increasingly those who tolerate the therapy well.",
    whenToUse: [
      "Oral TKIs taken daily at home: osimertinib, ibrutinib, alectinib, palbociclib.",
      "When the median DoT is your primary commercial input and must be parameterized directly.",
      "When the KM hazard chart shows a clear hump (rise then fall) rather than a monotone pattern.",
    ],
    clinicalContext:
      "Log-Normal consistently achieves strong fit in real-world adherence analyses for oral oncology agents. The median parameter maps directly to the clinical metric: set it to the observed or assumed median and tune sigma to control tail heaviness. High sigma (0.9–1.3) extends the tail — appropriate when a meaningful fraction of TKI patients persist well past the median. Log-Normal is listed alongside Weibull in NICE TSD 14 as a standard candidate model.",
    paramSummary: [
      "medianMonths: month at which 50% of patients have discontinued. Set this first.",
      "sigma: log-scale standard deviation. Higher values = longer tail. Typical oral TKI range: 0.6–0.9.",
      "ceiling: initial persistence fraction.",
    ],
  },
  piecewise: {
    label: "Piecewise Linear",
    formula: "S(t) = linear interpolation between knot points (month, survival%)",
    oneLiner:
      "Connect-the-dots survival curve. No distributional assumptions — every point on the curve is explicitly set by the analyst.",
    hazardSummary:
      "Hazard is constant within each segment (proportional to the slope of that segment). Hazard can vary freely across segments. Discontinuities at knots are not biologically realistic but are acceptable for planning models.",
    whenToUse: [
      "Fixed-duration regimens with a planned treatment end: adjuvant chemotherapy, induction therapies.",
      "When parametric models fail to converge or produce clinically implausible extrapolation.",
      "When commercial teams need to trace every assumption directly without hidden distributional math.",
    ],
    clinicalContext:
      "Piecewise Linear is the most transparent model for communicating assumptions. Each knot is a number the analyst explicitly set and can justify. It is the preferred fallback when no parametric model achieves adequate fit to observed KM data. Because it requires manual extrapolation beyond the last knot, it is best suited for therapies with a defined endpoint or when long-term extrapolation is not required.",
    paramSummary: [
      "knots: list of (month, survival%) control points. Add points at clinical assessment landmarks.",
      "Survival values must be non-increasing left to right.",
      "Use at least 3 knots; 5–7 knots covering early, mid, and late timepoints give the most useful curve.",
    ],
  },
  mixtureCure: {
    label: "Mixture Cure",
    formula: "S(t) = pi + (1 - pi) * exp(-(t / lambda)^k)",
    oneLiner:
      "Partitions patients into a cured fraction (pi) and an uncured fraction following Weibull. Survival approaches pi rather than zero.",
    hazardSummary:
      "Hazard declines asymptotically to zero. Early hazard is driven by the uncured Weibull component. As time progresses, the surviving population is enriched with cured patients, so the aggregate hazard falls toward zero. The survival curve flattens at pi * 100%.",
    whenToUse: [
      "CAR-T cell therapies: axi-cel (Yescarta), tisa-cel (Kymriah), liso-cel (Breyanzi) in lymphoma.",
      "Long-term IO responders where KM data show a persistent plateau above zero at 24+ months.",
      "Any therapy where a biologically distinct complete-responder subgroup has fundamentally different dynamics from non-responders.",
    ],
    clinicalContext:
      "Mixture Cure requires evidence of a plateau: at least two follow-up timepoints where survival has stabilized above zero. For CAR-T in DLBCL, durable complete response rates at 24 months of 30–40% (ZUMA-1, JULIET, TRANSCEND) support pi values in that range. Fitting pi from fewer than 24 months of follow-up is unreliable; the optimizer may find a numerically feasible but clinically unsupported cure fraction. Validate any pi above 0.4 against external clinical evidence.",
    paramSummary: [
      "pi: cure fraction (0–1). The proportion of patients assumed to never discontinue. Validate against observed long-term CR or progression-free plateau rates.",
      "lambda: Weibull scale for uncured patients. Controls how quickly non-responders exit.",
      "k: Weibull shape for uncured patients. k slightly above 1 (1.0–1.3) is typical for CAR-T.",
    ],
  },
};

export function ModelGuide({ model }: ModelGuideProps) {
  const [collapsed, setCollapsed] = useState(true);
  const info = MODEL_INFO[model];

  return (
    <div className="mt-3 rounded-panel border border-app-border bg-app-surface">
      {/* Header row — always visible */}
      <div className="px-3 py-2.5">
        <div className="font-chrome text-[10px] uppercase tracking-[0.1em] text-app-muted">
          Model Guide
        </div>
        <div className="mt-1 font-chrome text-[13px] text-app-text">{info.label}</div>
        <div className="mt-1 font-mono text-[11px] text-app-accent">{info.formula}</div>
        <p className="mt-2 text-[12px] text-app-muted">{info.oneLiner}</p>

        {/* Hazard summary pill */}
        <div className="mt-2 rounded border border-app-border bg-app-bg/60 px-2 py-1.5 text-[11px] text-app-muted">
          <span className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
            Hazard:{" "}
          </span>
          {info.hazardSummary}
        </div>

        {/* When to use — always shown */}
        <div className="mt-2">
          <div className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
            When to Use
          </div>
          <ul className="mt-1 space-y-0.5 text-[11px] text-app-muted">
            {info.whenToUse.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span className="mt-0.5 shrink-0 text-app-accent">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Collapsible detail section */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between border-t border-app-border px-3 py-2 text-left"
      >
        <span className="font-chrome text-[10px] uppercase tracking-[0.1em] text-app-muted">
          Clinical Context &amp; Parameters
        </span>
        <span className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text">
          {collapsed ? "Expand" : "Collapse"}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3 border-t border-app-border px-3 py-3 text-[12px] text-app-text">
          {/* Clinical context */}
          <div>
            <div className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
              Clinical Context
            </div>
            <p className="mt-1 text-app-muted">{info.clinicalContext}</p>
          </div>

          {/* Parameter guide */}
          <div>
            <div className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
              Parameter Reference
            </div>
            <ul className="mt-1 space-y-1 text-app-muted">
              {info.paramSummary.map((row) => (
                <li key={row} className="flex gap-1.5">
                  <span className="mt-0.5 shrink-0 text-app-accent">–</span>
                  <span>{row}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Link to full readme */}
          <div className="rounded border border-app-border bg-app-bg/60 px-3 py-2 text-[11px] text-app-muted">
            For full model documentation, fitting best practices, and HTA guidance, see the{" "}
            <a
              href="./persistency-readme.html"
              target="_blank"
              rel="noreferrer"
              className="text-app-accent underline underline-offset-2"
            >
              Persistency Curve Designer Readme
            </a>
            .
          </div>
        </div>
      )}
    </div>
  );
}
