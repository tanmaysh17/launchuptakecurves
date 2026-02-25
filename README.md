# Oncology Forecasting Tool Suite

Interactive browser-based tools for commercial, HEOR, and market access teams to model drug adoption curves and patient persistency in oncology.

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Live Demo

| Tool | URL |
|------|-----|
| Launch Uptake Modeler | https://tanmaysh17.github.io/launchuptakecurves/ |
| Persistency Curve Designer | https://tanmaysh17.github.io/launchuptakecurves/persistency.html |

## Overview

This suite contains two standalone modules that address the two most common quantitative questions in oncology commercial forecasting:

1. **How fast will this therapy be adopted after launch?** — answered by the Launch Uptake Modeler.
2. **How long will patients stay on therapy?** — answered by the Persistency Curve Designer.

Both tools run entirely in the browser. No server, no authentication, no data leaves the user's machine. All state can be encoded in a shareable URL.

**Who it is for:** commercial forecasters, portfolio strategists, HEOR analysts, market access modelers, and medical affairs teams building business cases or HTA submissions for oncology products.

---

## Module 1: Launch Uptake Modeler

Models cumulative product adoption over time following a drug launch. Supports scenario comparison, KPI milestone tracking, and fitting to historical analog data.

### Models

| Model | Description | Best for |
|-------|-------------|----------|
| Logistic | Symmetric S-curve, inflection at 50% of ceiling | Balanced adoption dynamics, SaaS-style rollouts |
| Gompertz | Asymmetric S-curve, inflection near 36.8% of ceiling | High early inertia: pharma, enterprise, complex formulary access |
| Richards | Generalized logistic with asymmetry parameter nu | Uncertain curve shape; fitting analog launch data |
| Bass Diffusion | Innovation (p) + imitation (q) diffusion model | Network effects, social contagion, durable goods dynamics |
| Linear Ramp | Straight ramp to ceiling after optional lag | Capacity-constrained or process-driven adoption |

### Key Features

- Compare up to four scenarios simultaneously on chart, table, and KPI milestone views.
- Fit models to observed analog launch data; reports R², RMSE, and MAPE.
- Set ceiling (peak share), launch lag, time horizon, and time-to-peak targets.
- Switch between cumulative % and volume mode using TAM input.
- Export data as CSV; share state via URL.
- Collapsible model guide with parameter explanations, best practices, and recommended ranges.

### Use Cases

- Pre-launch peak share forecasting with downside/base/upside scenarios.
- Analog benchmarking: fit to a comparable product's historical launch trajectory.
- Demand planning: translate adoption curve into patient or unit volume over time.
- Portfolio strategy: compare launch speed assumptions across multiple assets.

---

## Module 2: Persistency Curve Designer

Models patient duration of therapy (DoT) using parametric and non-parametric survival curves. Computes business metrics, fits to Kaplan-Meier data, and simulates multi-cohort demand waterfalls.

### Models

| Model | Formula | Best for |
|-------|---------|----------|
| Weibull | `S(t) = C * exp(-(t/lambda)^k)` | IO monotherapy (k < 1), maintenance therapy (k > 1), HTA submissions |
| Exponential | `S(t) = C * exp(-lambda*t)` | Chemotherapy reference, sparse data, sensitivity analysis |
| Log-Normal | `S(t) = C * (1 - Phi((ln(t)-ln(median))/sigma))` | Oral TKIs (osimertinib, ibrutinib, palbociclib) |
| Piecewise Linear | Knot interpolation | Adjuvant/fixed-duration regimens, fallback when parametric fitting fails |
| Mixture Cure | `S(t) = pi + (1-pi)*Weibull(t)` | CAR-T (axi-cel, tisa-cel), long-term IO responders with plateau |

### Key Features

- Computes Median DoT, Mean DoT, S(6)/S(12)/S(24), and annual vials per patient.
- Fits all fittable models (Weibull, Exponential, Log-Normal, Mixture Cure) to KM data via Nelder-Mead optimization; ranks by R².
- Accepts quick target syntax (`M3=85%, M12=38%`) when full KM data are unavailable.
- Renders instantaneous hazard chart alongside the survival curve.
- Industry benchmark overlays: IO monotherapy, oral TKI, CAR-T, chemotherapy, maintenance therapy.
- Cohort waterfall simulation: total patients on drug over time under steady new-starts assumptions.
- Model Guide panel: inline clinical context, hazard interpretation, and parameter reference for the active model.
- Exports survival series, cohort data, and model parameters as CSV or JSON.

### Use Cases

- Revenue forecasting: Mean DoT × patients starting × price per treatment-month.
- Payer submission support: generate persistency curves for outcomes-based contracts.
- Demand planning: cohort simulation produces monthly patients on drug and vial requirements.
- HTA dossier preparation: fit and compare parametric models per NICE TSD 14 / CADTH guidance.
- Competitive benchmarking: overlay your curve against published real-world persistency analogs.

---

## Quick Start (Developer)

**Prerequisites:** Node.js 18+, npm 9+.

```bash
# Clone the repository
git clone https://github.com/tanmaysh17/launchuptakecurves.git
cd launchuptakecurves

# Install dependencies
npm install

# Start development server (serves both apps at localhost:5173)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

The development server serves the uptake modeler at `http://localhost:5173/` and the persistency tool at `http://localhost:5173/persistency.html`.

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 (multi-page app) |
| Charts | Recharts 2 |
| Styles | Tailwind CSS 3 |
| Tests | Vitest + Testing Library |
| Optimization | Nelder-Mead (custom implementation) |

### Multi-page App Structure

Vite is configured with two entry points: `index.html` (uptake modeler) and `persistency.html` (persistency tool). Both compile to the same `dist/` directory and are deployed together.

```
src/
  main.tsx                      # Entry point for Launch Uptake Modeler
  App.tsx                       # Uptake modeler root component
  components/
    ModelAbout.tsx              # Collapsible model guide (uptake)
    chart/                      # Recharts wrappers
    controls/                   # Parameter sliders, model selector
    fit/                        # KM fitting panel
    table/                      # Scenario comparison table
    ui/                         # Shared: AppNav, PillTabs, ParameterSlider, Toast
  lib/
    models.ts                   # Model formulas, MODEL_DESCRIPTIONS, Nelder-Mead optimizer
    milestones.ts               # Milestone computation utilities
    theme.ts                    # Dark/light theme management
  types.ts                      # All TypeScript types for the uptake module

  persistency/
    main.tsx                    # Entry point for Persistency Curve Designer
    App.tsx                     # Persistency tool root component
    types.ts                    # All TypeScript types for the persistency module
    components/
      ModelGuide.tsx            # Collapsible model guide (persistency)
      MetricsPanel.tsx          # DoT, S(6/12/24), annual vials
      CohortPanel.tsx           # Waterfall simulation
      FitPanel.tsx              # KM data paste, auto-fit, model comparison table
      BenchmarkToggles.tsx      # Reference curve overlays
      ExportPanel.tsx           # CSV/JSON export modal
      chart/
        PersistencyChart.tsx    # Survival curve (Recharts)
        HazardChart.tsx         # Instantaneous hazard
        CohortChart.tsx         # Stacked cohort waterfall
      controls/                 # Per-model parameter sliders
    lib/
      curves.ts                 # All survival model formulas + computeSeries
      metrics.ts                # Median DoT, Mean DoT, S(t), annual vials
      cohort.ts                 # Multi-cohort simulation (Little's Law)
      fitting.ts                # Nelder-Mead fitting, model comparison, KM parser
      presets.ts                # Built-in oncology presets
    state/
      reducer.ts                # useReducer state management
    tests/                      # Vitest unit tests for curves, metrics, cohort

public/
  readme.html                   # In-app readme for Launch Uptake Modeler
  persistency-readme.html       # In-app readme for Persistency Curve Designer
```

### Shared Components

Both modules share UI primitives from `src/components/ui/`:

- `AppNav` — module switcher and theme toggle header.
- `PillTabs` — generic tab selector (generic over the key type).
- `ParameterSlider` — labeled range input with formatted display and hint text.
- `SectionLabel` — uppercase label for panel sections.
- `Toast` — auto-dismissing notification.

### Nelder-Mead Optimizer

Curve fitting runs entirely in the browser. `src/persistency/lib/fitting.ts` implements Nelder-Mead simplex optimization to minimize sum of squared errors between the parametric model and input KM data. No WebAssembly or server calls. Fitting completes in under 50ms for typical input sizes.

---

## Deployment

The project deploys to GitHub Pages at `https://tanmaysh17.github.io/launchuptakecurves/` via GitHub Actions on push to `main`.

Vite is configured with `base: "/launchuptakecurves/"` in `vite.config.ts` to produce correct asset paths for the project-site URL structure.

The build output in `dist/` includes both HTML entry points, all chunk assets, and the static files from `public/` (including both readme HTML files).

---

## Development Notes

### Adding a New Survival Model

1. Add the new model key to `CurveModel` in `src/persistency/types.ts`.
2. Define the parameter interface and add it to `ModelParams`.
3. Implement the survival function in `src/persistency/lib/curves.ts` and add it to `survivalAt()`.
4. Add fitting support in `src/persistency/lib/fitting.ts` if the model is parametric.
5. Create a controls component in `src/persistency/components/controls/`.
6. Add the tab entry to `MODEL_TABS` and the render case to `renderModelControls()` in `App.tsx`.
7. Add model info to `MODEL_INFO` in `src/persistency/components/ModelGuide.tsx`.

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode during development
npm run test:watch
```

Tests cover curve math (`curves.test.ts`), metric computation (`metrics.test.ts`), and cohort simulation (`cohort.test.ts`).

---

## Contributing

Open a pull request against `main`. Keep changes scoped — the tool suite is deliberately self-contained and dependency-light. New model proposals should include unit tests for the survival function and a corresponding entry in the Model Guide.

## License

MIT.
