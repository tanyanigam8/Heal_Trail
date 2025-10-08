// ✅ File: frontend/src/pages/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import TrendTable from '../components/TrendTable';
import { FaSpinner } from 'react-icons/fa';

const API = 'http://localhost:8000';

// Fallback normal ranges if backend doesn’t send one for a metric
const FALLBACK = {
  Hemoglobin: [13, 17],     // g/dL (adult male)
  Hematocrit: [38.8, 50],   // %
  WBC: [4.0, 11.0],         // x10^3/µL
  RBC: [4.5, 6.0],          // x10^6/µL
  Platelets: [150, 450],    // x10^3/µL
  MCV: [80, 100],           // fL
  MCH: [27, 33],            // pg
  MCHC: [32, 36],           // g/dL
  Glucose: [70, 99],        // mg/dL (fasting)
};

// ---------- utils ----------
const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
const fmt = (n) => (Number.isFinite(n) ? String(n) : '—');

const getStatus = (val, low, high) => {
  if (!Number.isFinite(val) || !Number.isFinite(low) || !Number.isFinite(high) || low >= high) return 'unknown';
  if (val < low) return 'low';
  if (val > high) return 'high';
  return 'normal';
};

const resolveRange = (metric, ranges, value) => {
  const r = ranges?.[metric];
  if (r && Number.isFinite(+r.min) && Number.isFinite(+r.max) && +r.max > +r.min) {
    return { low: +r.min, high: +r.max, unit: r.unit || '' };
  }
  const fb = FALLBACK[metric];
  if (fb && Number.isFinite(+fb[0]) && Number.isFinite(+fb[1]) && +fb[1] > +fb[0]) {
    return { low: +fb[0], high: +fb[1], unit: '' };
  }
  // last resort: band around current value so UI still renders
  const v = Number.isFinite(+value) ? +value : 1;
  return { low: Math.floor(Math.min(v * 0.8, v - 1)), high: Math.ceil(Math.max(v * 1.2, v + 1)), unit: '' };
};

// ⬇️ Sparkline: draws a real line when there’s variation;
// otherwise renders a gentle curved “wiggle” (up for green, slight dip for red)
const Sparkline = ({ series = [], color = '#22c55e' }) => {
  const w = 120;
  const h = 24;
  const pad = 2;

  const pts = (series || [])
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));

  const drawSynthetic = () => {
    const mid = h / 2;
    const c = String(color || '').toLowerCase();
    const isRed = c.includes('ef4444') || c.includes('red');
    const amp = (h * 0.30) * (isRed ? -1 : 1); // red dips, green rises a bit

    const d = `M ${pad} ${mid}
               C ${w * 0.33} ${mid - amp},
                 ${w * 0.66} ${mid + amp},
                 ${w - pad} ${mid - amp / 2}`;

    return (
      <svg width={w} height={h}>
        <line x1="0" y1={mid} x2={w} y2={mid} stroke="#e5e7eb" strokeWidth="1" />
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  if (pts.length < 2) return drawSynthetic();

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const rng = max - min;

  // Flat line? show synthetic wiggle for readability
  if (!Number.isFinite(rng) || rng < 1e-6) return drawSynthetic();

  const step = (w - pad * 2) / (pts.length - 1);
  const path = pts
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - (v - min) / rng);
      return `${i ? 'L' : 'M'}${x},${y}`;
    })
    .join(' ');

  const lastX = pad + (pts.length - 1) * step;
  const lastY = pad + (h - pad * 2) * (1 - (pts[pts.length - 1] - min) / rng);

  return (
    <svg width={w} height={h}>
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#e5e7eb" strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};

// Donut gauge with conic-gradient
const Donut = ({ percent = 0, color = '#22c55e', size = 74, label = '' }) => {
  const p = clamp(percent, 0, 100);
  const bg = '#e5e7eb';
  const ring = `conic-gradient(${color} ${p}%, ${bg} ${p}% 100%)`;
  const hole = size - 16;
  return (
    <div
      className="grid place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ring,
      }}
    >
      <div
        className="grid place-items-center text-sm"
        style={{
          width: hole,
          height: hole,
          borderRadius: '50%',
          background: '#fff',
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Range bar with current marker
const RangeBar = ({ low, high, value, color = '#22c55e', unit = '' }) => {
  const pct = high > low ? clamp(((value - low) / (high - low)) * 100, 0, 100) : 50;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Normal: {fmt(low)}–{fmt(high)} {unit}</span>
      </div>
      <div className="relative h-2 rounded bg-gray-200">
        <div className="absolute inset-0 rounded" style={{ background: 'rgba(34,197,94,0.2)' }} />
        <div
          className="absolute -top-1.5 h-5 w-[2px] rounded"
          style={{ left: `calc(${pct}% - 1px)`, background: color }}
          title={`Your value: ${value}${unit ? ` ${unit}` : ''}`}
        />
      </div>
    </div>
  );
};

// One enhanced metric card
const EnhancedMetricCard = ({ name, value, range, series }) => {
  const { low, high, unit } = range;
  const status = getStatus(value, low, high);
  const isAbn = status !== 'normal' && status !== 'unknown';
  const color = isAbn ? '#ef4444' : '#22c55e';
  const badge =
    status === 'high' ? 'High' : status === 'low' ? 'Low' : status === 'normal' ? 'Normal' : '—';

  // Gauge percent: position across band (clamped)
  const percent = high > low ? ((value - low) / (high - low)) * 100 : 50;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-800">{name}</div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isAbn ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[auto,1fr] gap-4 items-center">
        <Donut
          percent={clamp(percent, 0, 100)}
          color={color}
          label={
            <div className={`text-center ${isAbn ? 'text-red-600' : 'text-green-600'}`}>
              <div className="text-base font-semibold">{fmt(value)}</div>
              <div className="text-[10px] text-gray-400">{unit}</div>
            </div>
          }
        />
        <div className="space-y-2">
          <RangeBar low={low} high={high} value={value} unit={unit} color={color} />
          <Sparkline series={series} color={color} />
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);

  const [doctorSummary, setDoctorSummary] = useState('');
  const [patientSummary, setPatientSummary] = useState('');

  const [metrics, setMetrics] = useState({});     // {metric: value}
  const [ranges, setRanges] = useState({});       // {metric: {min,max,unit?}}
  const [suggestions, setSuggestions] = useState({});
  const [trendData, setTrendData] = useState([]);

  const [showSummaries, setShowSummaries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a PDF report.');
    const token = localStorage.getItem('token');
    if (!token) return alert('You are not logged in.');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setIsLoading(true);
      const { data } = await axios.post(`${API}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      // Robustly pick keys regardless of backend shape
      setDoctorSummary(data.doctor_summary || '');
      setPatientSummary(data.patient_summary || '');

      const m =
        data.metrics ||
        data.metadata ||       // some earlier routes named it metadata
        {};
      const r =
        data.ranges ||
        data.range_map ||
        (data.metadata && data.metadata.ranges) ||
        {};

      setMetrics(m);
      setRanges(r);
      setSuggestions(data.suggestions || {});

      const trendRes = await axios.get(`${API}/api/history/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrendData(trendRes.data || []);

      setShowSummaries(true);
    } catch (e) {
      console.error('❌ Upload error:', e);
      alert('Upload failed. Check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/api/download-report`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Health_Summary.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      alert('Download failed.');
    }
  };

  // Build tiny series per metric from trend history (last up to 8)
  const seriesMap = useMemo(() => {
    const map = {};
    const rows = Array.isArray(trendData) ? trendData : [];
    const keys = Object.keys(metrics || {});
    keys.forEach((k) => {
      const seq = rows.map((r) => Number.parseFloat(r[k])).filter((v) => Number.isFinite(v));
      map[k] = seq.slice(-8); // last few points for sparkline
    });
    return map;
  }, [trendData, metrics]);

  // Compose items for cards (respect toggle)
  const metricItems = useMemo(() => {
    const entries = Object.entries(metrics || {})
      .filter(([, v]) => Number.isFinite(Number.parseFloat(v)))
      .map(([name, raw]) => {
        const value = Number.parseFloat(raw);
        const range = resolveRange(name, ranges, value);
        const status = getStatus(value, range.low, range.high);
        return { name, value, range, status, series: seriesMap[name] || [] };
      });

    return onlyAbnormal ? entries.filter((e) => e.status !== 'normal' && e.status !== 'unknown') : entries;
  }, [metrics, ranges, onlyAbnormal, seriesMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 flex items-center gap-2">
          📤 Upload Health Report
        </h1>

        {/* Upload */}
        <div className="bg-white rounded-xl p-6 shadow-md border mb-8">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mb-4 text-sm file:px-4 file:py-2 file:bg-green-100 file:border file:rounded file:text-green-700"
          />
          <br />
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className={`mt-2 px-6 py-2 rounded-lg font-medium text-white transition-all ${
              isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <FaSpinner className="animate-spin" />
                Generating Summary...
              </span>
            ) : (
              'Generate Summary'
            )}
          </button>
        </div>

        {showSummaries && (
          <>
            {/* Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-md border mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">📊 Health Metrics</h2>
                <button
                  onClick={() => setOnlyAbnormal((s) => !s)}
                  className="text-xs rounded-md border px-3 py-1 hover:bg-gray-50"
                >
                  {onlyAbnormal ? 'Show all' : 'Show only abnormal'}
                </button>
              </div>

              {metricItems.length === 0 ? (
                <p className="text-sm text-gray-600">No metrics detected.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {metricItems.map((m) => (
                    <EnhancedMetricCard
                      key={m.name}
                      name={m.name}
                      value={m.value}
                      range={m.range}
                      series={m.series}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl p-6 shadow-md border mb-8">
              <h2 className="text-xl font-semibold mb-3">💡 Suggestions</h2>
              {suggestions && Object.keys(suggestions).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(suggestions).map(([metric, block]) => (
                    <div key={metric} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{metric}</div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            block.status === 'high'
                              ? 'bg-red-50 text-red-600'
                              : block.status === 'low'
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {block.status}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">At home</div>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {(block.home || []).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Medication/clinical</div>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {(block.meds || []).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{block.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No specific suggestions. Everything in range 🎉</p>
              )}
            </div>

            {/* Doctor & Patient summaries */}
            <div className="bg-white rounded-xl p-6 shadow-md border mb-8">
              <h2 className="text-xl font-semibold mb-4">🩺 Doctor Summary</h2>
              <p className="whitespace-pre-line text-gray-800 text-sm leading-relaxed mb-6">
                {doctorSummary || '(LLM error) timed out'}
              </p>
              <h2 className="text-xl font-semibold mb-4">👤 Patient Summary</h2>
              <p className="whitespace-pre-line text-gray-800 text-sm leading-relaxed">
                {patientSummary || '(LLM error) timed out'}
              </p>
            </div>

            {/* Trend Table */}
            <div className="bg-white rounded-xl p-6 shadow-md border mb-8">
              <h2 className="text-xl font-semibold mb-4">📉 Trend Analysis Table</h2>
              <TrendTable data={trendData} />
            </div>

            {/* Download */}
            <div className="text-right">
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ⬇️ Download Summary
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
