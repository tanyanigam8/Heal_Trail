import React, { useMemo, useState } from "react";

/** Utility */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
const fmt = (n) => (Number.isFinite(+n) ? (+n).toString() : "-");

/** Merge ranges coming from backend with safe fallbacks */
const FALLBACK = {
  Hemoglobin: [13, 17, "g/dL"],
  WBC: [4.0, 11.0, "10^3/µL"],
  RBC: [4.5, 6.0, "10^6/µL"],
  Platelets: [150, 450, "10^3/µL"],
  Hematocrit: [38.8, 50.0, "%"],
  MCV: [80, 100, "fL"],
  MCH: [27, 33, "pg"],
  MCHC: [32, 36, "g/dL"],
  Glucose: [70, 99, "mg/dL"],
};

function resolveRange(metric, r, value) {
  let low = null, high = null, unit = "";
  if (r && Number.isFinite(+r.min) && Number.isFinite(+r.max) && +r.max > +r.min) {
    low = +r.min; high = +r.max; unit = r.unit || "";
  }
  if (low === null || high === null) {
    const fb = FALLBACK[metric];
    if (fb) { low = fb[0]; high = fb[1]; unit = unit || fb[2] || ""; }
  }
  if (low === null || high === null) {
    // very last resort: make a band around value
    const v = Number.isFinite(+value) ? +value : 0;
    low = Math.floor(Math.min(v, 0));
    high = Math.ceil(Math.max(v, 1));
  }
  return { low, high, unit };
}

function statusOf(value, low, high) {
  if (!Number.isFinite(value)) return "unknown";
  if (value < low) return "low";
  if (value > high) return "high";
  return "normal";
}

function statusClasses(status) {
  if (status === "low" || status === "high") {
    return {
      chip: "bg-red-100 text-red-700 ring-1 ring-red-200",
      ring: "#ef4444",
      dot: "bg-red-500",
      text: "text-red-600",
    };
  }
  if (status === "normal") {
    return {
      chip: "bg-green-100 text-green-700 ring-1 ring-green-200",
      ring: "#10b981",
      dot: "bg-green-500",
      text: "text-green-600",
    };
  }
  return {
    chip: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    ring: "#6b7280",
    dot: "bg-gray-400",
    text: "text-gray-600",
  };
}

/** Inline sparkline (only when there's variation) */
function Sparkline({ series, color = "#6b7280" }) {
  const clean = (series || []).map((v) => +v).filter(Number.isFinite);
  if (clean.length < 2) return null;
  const lo = Math.min(...clean);
  const hi = Math.max(...clean);
  if (hi - lo < 1e-9) return null; // flat -> hide

  const W = 140, H = 30, pad = 2;
  const xs = clean.map((_, i) => pad + (i * (W - 2 * pad)) / (clean.length - 1));
  const ys = clean.map((v) => {
    const t = (v - lo) / (hi - lo);
    // invert so larger values are higher visually
    return pad + (1 - t) * (H - 2 * pad);
  });
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  return (
    <svg width={W} height={H} className="mt-2">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

/** Range bar with normal band + value marker */
function RangeBar({ value, low, high, status }) {
  const domainMin = Math.min(value ?? low, low);
  const domainMax = Math.max(value ?? high, high);
  const span = Math.max(1e-6, domainMax - domainMin);

  const normLeft = ((low - domainMin) / span) * 100;
  const normWidth = ((high - low) / span) * 100;
  const valueLeft = ((value - domainMin) / span) * 100;

  const s = statusClasses(status);

  return (
    <div className="relative h-3 w-full rounded bg-gray-200/70">
      {/* normal band */}
      <div
        className="absolute top-0 h-3 rounded bg-green-200/70"
        style={{ left: `${normLeft}%`, width: `${normWidth}%` }}
      />
      {/* marker */}
      <div
        className={`absolute -top-1 h-5 w-1.5 rounded ${s.dot}`}
        style={{ left: `calc(${clamp(valueLeft, 0, 100)}% - 2px)` }}
        title={`Value position: ${fmt(value)} (normal ${fmt(low)}–${fmt(high)})`}
      />
    </div>
  );
}

/** Colored radial value ring using conic-gradient (light track, green/red value) */
function ValueRing({ value, unit, status }) {
  const s = statusClasses(status);
  // not a percentage of anything in particular; just decorative 70% fill
  const pct = 70;

  const ringStyle = {
    background: `conic-gradient(${s.ring} ${pct}%, #e5e7eb ${pct}%)`,
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-16 w-16 rounded-full"
        style={ringStyle}
        aria-hidden="true"
      >
        <div className="absolute inset-1 rounded-full bg-white" />
      </div>
      <div className="leading-tight">
        <div className={`text-lg font-semibold ${s.text}`}>{fmt(value)}</div>
        <div className="text-xs text-gray-500">{unit}</div>
      </div>
    </div>
  );
}

function MetricCard({ name, value, range, history }) {
  const { low, high, unit } = range;
  const status = statusOf(+value, low, high);
  const s = statusClasses(status);

  // last delta (only if we have at least 2 points and variation)
  const delta = useMemo(() => {
    const a = (history || []).map((v) => +v).filter(Number.isFinite);
    if (a.length < 2) return null;
    const d = a[a.length - 1] - a[a.length - 2];
    if (Math.abs(d) < 1e-6) return null;
    return d;
  }, [history]);

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm font-semibold text-slate-800">{name}</div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${s.chip}`}>
          {status === "normal" ? "Normal" : status === "low" ? "Low" : "High"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[auto,1fr] gap-4">
        <ValueRing value={+value} unit={unit} status={status} />
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500">
            Normal: {fmt(low)}–{fmt(high)} {unit}
          </div>
          <RangeBar value={+value} low={low} high={high} status={status} />
          {delta !== null && (
            <div className="text-xs text-gray-500">
              Last change:{" "}
              <span className={delta > 0 ? "text-rose-600" : "text-emerald-600"}>
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </span>
            </div>
          )}
          <Sparkline
            series={history}
            color={status === "normal" ? "#10b981" : "#ef4444"}
          />
        </div>
      </div>
    </div>
  );
}

export default function EnhancedMetrics({ metrics, ranges, trendData }) {
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  // Build per-metric history from the trend table rows
  const historyMap = useMemo(() => {
    const map = {};
    (trendData || []).forEach((row) => {
      Object.entries(row || {}).forEach(([k, v]) => {
        if (k === "date") return;
        const n = +v;
        if (!Number.isFinite(n)) return;
        if (!map[k]) map[k] = [];
        map[k].push(n);
      });
    });
    return map;
  }, [trendData]);

  const entries = useMemo(() => {
    return Object.entries(metrics || {})
      .filter(([, v]) => Number.isFinite(+v))
      .map(([name, value]) => {
        const { low, high, unit } = resolveRange(name, ranges?.[name], +value);
        const status = statusOf(+value, low, high);
        return { name, value: +value, low, high, unit, status, history: historyMap[name] || [] };
      })
      .filter((e) => (onlyAbnormal ? e.status !== "normal" : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [metrics, ranges, historyMap, onlyAbnormal]);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-600">No metrics detected.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setOnlyAbnormal((v) => !v)}
          className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-md border bg-white hover:bg-slate-50 text-slate-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70">
            <path fill="currentColor" d="M3 6h18v2H3V6m4 5h10v2H7v-2m3 5h4v2h-4v-2Z" />
          </svg>
          {onlyAbnormal ? "Show all" : "Show only abnormal"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map((e) => (
          <MetricCard
            key={e.name}
            name={e.name}
            value={e.value}
            range={{ low: e.low, high: e.high, unit: e.unit }}
            history={e.history}
          />
        ))}
      </div>
    </div>
  );
}
