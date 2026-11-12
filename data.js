// ForecastFit demo data.
// ALL values below are FICTIONAL, generated for demonstration only.
// They do not come from any real employer, contact center, or person.
// Pattern: a typical single-peak weekday call curve across 30-minute
// intervals, with a plausible forecast that misses in realistic ways
// (under-forecast at the morning peak, over-forecast overnight).

const DEMO_DAYS = [
  { id: "mon", label: "Mon", peakBoost: 1.00, forecastBias: -0.06 },
  { id: "tue", label: "Tue", peakBoost: 0.97, forecastBias: -0.04 },
  { id: "wed", label: "Wed", peakBoost: 1.05, forecastBias: -0.09 },
  { id: "thu", label: "Thu", peakBoost: 1.02, forecastBias: -0.05 },
  { id: "fri", label: "Fri", peakBoost: 0.93, forecastBias: -0.02 },
];

// 24 intraday buckets (business day 07:00-19:00 in 30-min intervals).
const INTERVALS = [];
for (let h = 7; h < 19; h++) {
  INTERVALS.push(String(h).padStart(2, "0") + ":00");
  INTERVALS.push(String(h).padStart(2, "0") + ":30");
}

// Deterministic pseudo-random so the demo looks identical on every visit.
function seededWave(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildDay(day, dayIndex) {
  const rand = seededWave(42 + dayIndex * 17);
  const actual = [];
  const forecast = [];
  for (let i = 0; i < INTERVALS.length; i++) {
    const t = i / (INTERVALS.length - 1); // 0..1 across the day
    // Single-peak curve centered at 10:30, shoulder around 14:00.
    const morning = Math.exp(-Math.pow((t - 0.29) / 0.16, 2));
    const afternoon = 0.45 * Math.exp(-Math.pow((t - 0.62) / 0.22, 2));
    const base = 18 + 240 * (morning + afternoon) * day.peakBoost;
    const noise = (rand() - 0.5) * 0.10 * base;
    const a = Math.max(5, Math.round(base + noise));
    // Forecast smooths the peak away and carries the day's bias.
    const f = Math.max(
      5,
      Math.round((18 + 240 * (morning * 0.9 + afternoon)) * (1 + day.forecastBias))
    );
    actual.push(a);
    forecast.push(f);
  }
  return { id: day.id, label: day.label, intervals: INTERVALS, forecast, actual };
}

const FORECASTFIT_DATA = {
  generatedFor: "ForecastFit demo - fictional data, not from any real operation",
  days: DEMO_DAYS.map(buildDay),
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = FORECASTFIT_DATA;
}
