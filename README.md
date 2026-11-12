# ForecastFit

Workforce management (WFM) forecast accuracy tracker. It compares forecast vs actual contact volume across intraday intervals and shows where the forecast missed, by how much, and in which direction.

**Live demo:** https://billysonnie.github.io/ForecastFit/

## What it does

- Weekly **WAPE** (weighted absolute percentage error) and signed **bias** (over- vs under-forecast) scorecards
- Per-day WAPE and bias chips
- Per-day charts of forecast vs actual across 30-minute intervals, with the miss area shaded red (under-forecast, understaffing risk) or blue (over-forecast, overstaffing cost)
- A ranked table of the biggest single-interval misses of the week

## Data

**All data in this demo is fictional.** It is generated in `data.js` with a deterministic seeded pattern that mimics a plausible single-peak weekday call curve. It does not come from any real contact center, employer, or person. To use real data, replace `FORECASTFIT_DATA` in `data.js` with the same shape: one entry per day with `intervals`, `forecast`, and `actual` arrays.

## Run it

It is a static site with no build step and no dependencies. Open `index.html` in a browser, or serve the folder with any static server.

## Tests

Metric math and demo-data integrity are covered by a Node test suite:

```
node test.js
```

## Model limitations

- WAPE is undefined (shown as `n/a`) when total actual volume is zero; per-interval error is skipped for zero-volume intervals.
- Accuracy metrics say nothing about whether the *staffing* was right - that depends on shrinkage, AHT, and service targets (see my StaffingPilot project for the staffing side).
- A single-peak weekday pattern is demo-shaped; real queues have events, holidays, and channel mix that this demo does not model.
- Bias and WAPE are volume-weighted, so small overnight intervals barely move the weekly score even when their percentage error is large.
