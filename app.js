// ForecastFit metric engine + renderer.
// The metric functions are dependency-free and also run under Node for tests.

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

// Weighted Absolute Percentage Error: sum|A-F| / sum(A).
// Returns null when total actual volume is zero (undefined metric).
function wape(forecast, actual) {
  const totalActual = sum(actual);
  if (totalActual === 0) return null;
  const absErr = actual.reduce((acc, a, i) => acc + Math.abs(a - forecast[i]), 0);
  return absErr / totalActual;
}

// Signed bias: (sum F - sum A) / sum A. Positive = over-forecast.
function bias(forecast, actual) {
  const totalActual = sum(actual);
  if (totalActual === 0) return null;
  return (sum(forecast) - totalActual) / totalActual;
}

// Per-interval absolute error percent |A-F|/A for one day.
function intervalErrors(forecast, actual) {
  return actual.map((a, i) => (a === 0 ? null : Math.abs(a - forecast[i]) / a));
}

function pct(x, digits) {
  if (x === null || x === undefined || !isFinite(x)) return "n/a";
  return (x * 100).toFixed(digits === undefined ? 1 : digits) + "%";
}

function analyze(data) {
  const dayStats = data.days.map((d) => ({
    id: d.id,
    label: d.label,
    wape: wape(d.forecast, d.actual),
    bias: bias(d.forecast, d.actual),
    totalActual: sum(d.actual),
    totalForecast: sum(d.forecast),
  }));
  const allF = [];
  const allA = [];
  data.days.forEach((d) => {
    allF.push(...d.forecast);
    allA.push(...d.actual);
  });
  const weekWape = wape(allF, allA);
  const weekBias = bias(allF, allA);

  // Worst single intervals across the week by absolute error percent.
  const worst = [];
  data.days.forEach((d) => {
    intervalErrors(d.forecast, d.actual).forEach((e, i) => {
      if (e !== null) {
        worst.push({
          day: d.label,
          interval: d.intervals[i],
          error: e,
          forecast: d.forecast[i],
          actual: d.actual[i],
        });
      }
    });
  });
  worst.sort((a, b) => b.error - a.error);

  return { dayStats, weekWape, weekBias, worst: worst.slice(0, 8) };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { wape, bias, intervalErrors, analyze };
}

/* ---------- browser rendering below ---------- */
if (typeof document !== "undefined") {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderChart(day) {
    const W = 720, H = 240, P = 34;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    const maxV = Math.max(...day.actual, ...day.forecast) * 1.08;
    const x = (i) => P + (i / (day.intervals.length - 1)) * (W - 2 * P);
    const y = (v) => H - P - (v / maxV) * (H - 2 * P);

    // gridlines
    for (let g = 0; g <= 4; g++) {
      const v = (maxV / 4) * g;
      svg.appendChild(el("line", {
        x1: P, x2: W - P, y1: y(v), y2: y(v), class: "grid",
      }));
      svg.appendChild(el("text", {
        x: 4, y: y(v) + 4, class: "tick",
      }, String(Math.round(v))));
    }
    // x labels every 2 hours
    day.intervals.forEach((label, i) => {
      if (i % 4 === 0) {
        svg.appendChild(el("text", { x: x(i) - 12, y: H - 10, class: "tick" }, label));
      }
    });

    function path(vals) {
      return vals.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
    }
    svg.appendChild(el("path", { d: path(day.forecast), class: "line forecast" }));
    svg.appendChild(el("path", { d: path(day.actual), class: "line actual" }));

    // shade miss area between the lines at each interval
    day.actual.forEach((a, i) => {
      const f = day.forecast[i];
      const top = y(Math.max(a, f));
      const hgt = Math.abs(y(a) - y(f));
      if (hgt > 2) {
        svg.appendChild(el("rect", {
          x: x(i) - 3, y: top, width: 6, height: hgt,
          class: a > f ? "miss under" : "miss over",
        }));
      }
    });
    return svg;
  }

  function render() {
    const data = FORECASTFIT_DATA;
    const result = analyze(data);

    document.getElementById("weekWape").textContent = pct(result.weekWape);
    document.getElementById("weekBias").textContent = pct(result.weekBias);
    const biasWord = result.weekBias > 0.005 ? "over-forecast" : result.weekBias < -0.005 ? "under-forecast" : "on target";
    document.getElementById("weekBiasLabel").textContent = "weekly bias (" + biasWord + ")";

    const dayRow = document.getElementById("dayScores");
    result.dayStats.forEach((s) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.innerHTML = "<strong>" + s.label + "</strong><span>WAPE " + pct(s.wape) + "</span><span>bias " + pct(s.bias) + "</span>";
      dayRow.appendChild(chip);
    });

    const charts = document.getElementById("charts");
    data.days.forEach((day) => {
      const card = document.createElement("section");
      card.className = "card";
      const h = document.createElement("h2");
      h.textContent = day.label;
      card.appendChild(h);
      card.appendChild(renderChart(day));
      charts.appendChild(card);
    });

    const tbody = document.querySelector("#worstTable tbody");
    result.worst.forEach((w) => {
      const tr = document.createElement("tr");
      [w.day, w.interval, w.forecast, w.actual, pct(w.error)].forEach((v) => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  render();
}
