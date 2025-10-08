// src/pages/PrintableReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000";

// Static fallbacks for ranges (same idea as Dashboard)
const FALLBACK = {
  Hemoglobin: [13, 17],
  WBC: [4.0, 11.0],
  RBC: [4.5, 6.0],
  Platelets: [150, 450],
  Hematocrit: [38, 50],
  MCV: [80, 100],
  MCH: [27, 33],
  MCHC: [32, 36],
  Glucose: [70, 99],
};

// tiny helpers
const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
const round1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : "—");

function getToken() {
  const qs = new URLSearchParams(window.location.search);
  return qs.get("token") || localStorage.getItem("token") || "";
}

function resolveRange(metric, value, ranges) {
  const r = ranges?.[metric];
  let low = null, high = null, unit = "";
  if (r && Number.isFinite(+r.min) && Number.isFinite(+r.max) && +r.max > +r.min && !(+r.min === 0 && +r.max === 0)) {
    low = +r.min; high = +r.max; unit = r.unit || "";
  }
  if (low === null || high === null) {
    const fb = FALLBACK[metric];
    if (Array.isArray(fb) && Number.isFinite(+fb[0]) && Number.isFinite(+fb[1]) && +fb[1] > +fb[0]) {
      low = +fb[0]; high = +fb[1];
    }
  }
  if (low === null || high === null) {
    low = Math.floor(Math.min(value, 0));
    high = Math.ceil(Math.max(value, 1));
  }
  return { low, high, unit };
}

function Meter({ metric, raw, ranges }) {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return null;

  const { low, high, unit } = resolveRange(metric, value, ranges);
  const pct = clamp((value / (high || 1)) * 100, 0, 100);
  const abnormal = value < low || value > high;

  // dial %
  const dialPct = clamp(((value - low) / (high - low)) * 100, 0, 100);
  const stroke = 440;
  const dash = (stroke * dialPct) / 100;

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="text-base font-medium">{metric}</div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${abnormal ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {abnormal ? (value > high ? "High" : "Low") : "Normal"}
        </span>
      </div>

      {/* Dial + value */}
      <div className="flex gap-4 items-center">
        <svg width="64" height="64" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" stroke="#eee" strokeWidth="14" fill="none" />
          <circle
            cx="80" cy="80" r="70" fill="none" strokeLinecap="round"
            stroke={abnormal ? "#ef4444" : "#10b981"} strokeWidth="14"
            strokeDasharray={`${dash} ${stroke}`}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="leading-tight">
          <div className={`text-xl font-semibold ${abnormal ? "text-red-600" : "text-gray-800"}`}>{round1(value)}</div>
          <div className="text-xs text-gray-500">{unit}</div>
        </div>

        {/* Range bar */}
        <div className="flex-1 ml-2">
          <div className="h-2 w-full bg-green-100 rounded">
            <div className="h-2 rounded bg-green-300" style={{ width: "100%" }}></div>
          </div>
          <div className="h-1 mt-2 relative">
            <div className={`absolute top-0 h-1 ${abnormal ? "bg-red-500" : "bg-green-500"} rounded`}
                 style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Normal: {low}–{high}{unit && ` ${unit}`}</div>
        </div>
      </div>
    </div>
  );
}

export default function PrintableReport() {
  const { id } = useParams();
  const token = useMemo(() => getToken(), []);
  const [report, setReport] = useState(null);
  const [ranges] = useState({}); // ranges rebuilt locally; FALLBACK covers the rest
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const hdrs = { Authorization: `Bearer ${token}` };

    async function load() {
      const [r, t] = await Promise.all([
        axios.get(`${API}/api/report/${id}`, { headers: hdrs }),
        axios.get(`${API}/api/history/metrics`, { headers: hdrs }),
      ]);
      setReport(r.data);
      setTrends(t.data || []);
    }
    load().catch(console.error);
  }, [id, token]);

  if (!report) {
    return <div className="p-8 text-gray-600">Preparing printable report…</div>;
  }

  const metricEntries = Object.entries(report.metrics || {}).filter(([, v]) =>
    Number.isFinite(Number.parseFloat(v))
  );

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      {/* Title */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Health Report</h1>
        <div className="text-sm text-gray-500 mb-6">
          Report ID: {report.id} {report.uploaded_at ? `• ${new Date(report.uploaded_at).toLocaleString()}` : ""}
        </div>

        {/* Metrics grid */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Health Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            {metricEntries.map(([metric, val]) => (
              <Meter key={metric} metric={metric} raw={val} ranges={ranges} />
            ))}
          </div>
        </section>

        {/* Doctor / Patient summaries */}
        <section className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Doctor Summary</h3>
            <p className="whitespace-pre-line text-sm text-gray-800 leading-relaxed">{report.doctor_summary}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Patient Summary</h3>
            <p className="whitespace-pre-line text-sm text-gray-800 leading-relaxed">{report.patient_summary}</p>
          </div>
        </section>

        {/* Trends table (same columns as dashboard) */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold mb-2">Trend Analysis Table</h3>
          <div className="overflow-hidden border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Hemoglobin</th>
                  <th className="px-3 py-2 text-left">Platelets</th>
                  <th className="px-3 py-2 text-left">WBC</th>
                  <th className="px-3 py-2 text-left">RBC</th>
                  <th className="px-3 py-2 text-left">Glucose</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((row, i) => (
                  <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.Hemoglobin}</td>
                    <td className="px-3 py-2">{row.Platelets}</td>
                    <td className="px-3 py-2">{row.WBC}</td>
                    <td className="px-3 py-2">{row.RBC}</td>
                    <td className="px-3 py-2">{row.Glucose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
