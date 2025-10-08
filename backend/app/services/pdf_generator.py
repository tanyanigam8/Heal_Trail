# app/services/pdf_generator.py
from __future__ import annotations

import os
import io
import html
from typing import Dict, Any, Tuple, List, Optional

# Fallback: ReportLab
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# Pretty renderer (preferred)
try:
    from weasyprint import HTML, CSS  # type: ignore
    _HAS_WEASY = True
except Exception:
    _HAS_WEASY = False

from app.utils.medical_ranges import get_normal_range_for_metric
from app.services.suggestions import generate_suggestions


# -----------------------------
# helpers
# -----------------------------
def _coerce_float(val) -> float:
    try:
        return float(val)
    except Exception:
        return 0.0


def _take_low_high_unit(metric: str) -> Tuple[float, float, str]:
    """
    Accept both shapes from get_normal_range_for_metric:
      - (low, high)
      - (low, high, unit)
    """
    try:
        rng = get_normal_range_for_metric(metric)
    except Exception:
        rng = (0.0, 0.0)

    low = high = 0.0
    unit = ""
    if isinstance(rng, (tuple, list)):
        if len(rng) >= 2:
            low = _coerce_float(rng[0])
            high = _coerce_float(rng[1])
        if len(rng) >= 3 and isinstance(rng[2], str):
            unit = rng[2] or ""
    return low, high, unit


def _normalize_ranges(metrics: Dict[str, float], maybe_ranges: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Ensure every metric has a sensible (min,max,unit) band.
    Prefer incoming ranges; fallback to static ranges (with or without unit).
    """
    fixed: Dict[str, Dict[str, Any]] = {}
    maybe_ranges = maybe_ranges or {}

    for m in metrics.keys():
        src = maybe_ranges.get(m, {}) or {}
        rmin = src.get("min")
        rmax = src.get("max")
        unit = src.get("unit", "")

        ok = isinstance(rmin, (int, float)) and isinstance(rmax, (int, float)) and rmax > rmin

        if not ok:
            lo, hi, u = _take_low_high_unit(m)
            if hi > lo:
                rmin, rmax = lo, hi
                unit = unit or u
            else:
                # last-resort band around current value
                v = _coerce_float(metrics[m])
                rmin, rmax = v * 0.8, v * 1.2

        fixed[m] = {"min": float(rmin), "max": float(rmax), "unit": unit or ""}

    return fixed


def _split_meta(metadata: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, Dict[str, Any]]]:
    """
    Robustly extract metrics and ranges from whatever was saved.

    Accepts:
      - {"Hemoglobin": 11.2, "WBC": 5.8, "ranges": {...}}
      - {"metrics": {...}, "ranges": {...}}
      - {"ranges": {...}}  (-> metrics will be empty)
    """
    if not isinstance(metadata, dict):
        return {}, {}

    # ranges
    ranges: Dict[str, Dict[str, Any]] = {}
    if "ranges" in metadata and isinstance(metadata["ranges"], dict):
        ranges = metadata["ranges"]

    # metrics may be on root OR under "metrics"
    msrc = metadata.get("metrics") if isinstance(metadata.get("metrics"), dict) else metadata

    metrics: Dict[str, float] = {}
    for k, v in (msrc or {}).items():
        if k == "ranges":
            continue
        try:
            metrics[k] = float(v)
        except Exception:
            pass

    return metrics, ranges


def _status(value: float, lo: float, hi: float) -> str:
    if value < lo:
        return "low"
    if value > hi:
        return "high"
    return "normal"


def _html_escape(s: str) -> str:
    return html.escape(s or "")


# -----------------------------
# Public entry used by /download-report
# -----------------------------
def generate_summary_pdf(
    doctor_summary: str,
    patient_summary: str,
    metadata: Dict[str, Any],
    user_id: int,
    trend_series: Optional[Dict[str, List[float]]] = None,  # NEW: for sparklines
) -> str:
    """
    Build a PDF that mirrors the summary page:
      - Health Metrics (donut gauge + range bar marker + sparkline)
      - Suggestions (home & meds)
      - Doctor / Patient summaries
      - Optional PNG charts at the end
    """
    os.makedirs("generated_reports", exist_ok=True)
    out_path = os.path.join("generated_reports", f"health_summary_{user_id}.pdf")

    metrics, incoming_ranges = _split_meta(metadata or {})
    ranges = _normalize_ranges(metrics, incoming_ranges)
    suggestions = generate_suggestions(metrics=metrics, ranges=ranges)

    # Prefer WeasyPrint HTML for a closer match; fall back to ReportLab.
    if _HAS_WEASY:
        html_str, css_str = _build_html_doc(
            doctor_summary=doctor_summary,
            patient_summary=patient_summary,
            metrics=metrics,
            ranges=ranges,
            suggestions=suggestions,
            user_id=user_id,
            series_map=trend_series or {},
        )
        try:
            HTML(string=html_str).write_pdf(out_path, stylesheets=[CSS(string=css_str)])
            return out_path
        except Exception:
            pass  # fall back

    _build_reportlab_doc(
        out_path=out_path,
        doctor_summary=doctor_summary,
        patient_summary=patient_summary,
        metrics=metrics,
        ranges=ranges,
        suggestions=suggestions,
        user_id=user_id,
    )
    return out_path


# -----------------------------
# HTML (WeasyPrint)
# -----------------------------
def _sparkline_path(series: List[float], w: int = 140, h: int = 28, pad: int = 3) -> str:
    pts = [float(x) for x in series if isinstance(x, (int, float))]
    if len(pts) < 2:
        # flat baseline
        return f"M{pad},{h/2} L{w-pad},{h/2}"
    lo, hi = min(pts), max(pts)
    rng = (hi - lo) or 1.0
    step = (w - pad * 2) / (len(pts) - 1)
    cmds = []
    for i, v in enumerate(pts):
        x = pad + i * step
        y = pad + (h - pad * 2) * (1 - (v - lo) / rng)
        cmds.append(("L" if i else "M") + f"{x:.2f},{y:.2f}")
    return " ".join(cmds)


def _build_html_doc(
    doctor_summary: str,
    patient_summary: str,
    metrics: Dict[str, float],
    ranges: Dict[str, Dict[str, Any]],
    suggestions: Dict[str, Any],
    user_id: int,
    series_map: Dict[str, List[float]],
) -> Tuple[str, str]:

    css = """
    @page { size: A4; margin: 22mm; }
    body { font-family: Inter, Arial, Helvetica, sans-serif; color: #0f172a; }
    h1 { font-size: 22px; color: #166534; margin: 0 0 14px; }
    h2 { font-size: 16px; margin: 22px 0 10px; }
    .grid { display: grid; gap: 10px; grid-template-columns: repeat(3, 1fr); }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
    .row { display:flex; align-items:center; justify-content:space-between; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; }
    .badge-green { background: #ecfdf5; color: #059669; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .name { font-size: 13px; font-weight: 600; }
    .val { font-size: 16px; font-weight: 700; margin-top: 6px; }
    .unit { font-size: 11px; color:#6b7280; }
    .normal { font-size: 11px; color:#6b7280; margin-bottom:6px; }
    .bar-wrap { position: relative; height: 8px; background: #e5e7eb; border-radius: 999px; }
    .bar-fill { position:absolute; inset:0; background: rgba(34,197,94,0.18); border-radius: 999px; }
    .marker { position:absolute; top:-3px; width:2px; height:14px; background: #10b981; }
    .marker-red { background:#ef4444; }
    .section { margin-top: 18px; }
    ul { margin:6px 0 0 18px; padding:0; }
    li { margin: 2px 0; font-size: 12px; }
    .note { color:#6b7280; font-size:11px; margin-top: 4px; }
    .muted { font-size: 12px; color:#475569; white-space: pre-wrap; }
    .charts-grid { display:grid; gap:8px; grid-template-columns: repeat(2,1fr); margin-top: 8px; }
    .chip { font-size:11px; padding:2px 8px; border-radius: 12px; background:#f1f5f9; color:#475569; }
    .row2 { display:grid; grid-template-columns: 86px 1fr; gap: 10px; align-items:center; }
    """

    # Build metric cards (donut + range bar + sparkline)
    cards_html = []
    for m, v in metrics.items():
        r = ranges.get(m, {})
        lo = _coerce_float(r.get("min", 0.0))
        hi = _coerce_float(r.get("max", 1.0))
        unit = r.get("unit", "")
        val = _coerce_float(v)
        status = _status(val, lo, hi)
        pct = 50.0 if not (hi > lo) else max(0.0, min(100.0, (val - lo) / (hi - lo) * 100.0))
        is_abn = status != "normal"
        badge_cls = "badge-red" if is_abn else "badge-green"
        marker_cls = "marker-red" if is_abn else ""
        color = "#ef4444" if is_abn else "#10b981"

        # SVG donut ring (stroke dasharray)
        size = 74
        cx = cy = size / 2
        rads = 30
        circ = 2 * 3.14159265 * rads
        dash = circ * pct / 100.0

        # Sparkline path
        series = series_map.get(m, []) or []
        sp_path = _sparkline_path(series, w=140, h=28, pad=3)

        cards_html.append(f"""
          <div class="card">
            <div class="row">
              <div class="name">{_html_escape(m)}</div>
              <span class="badge {badge_cls}">{status.title()}</span>
            </div>

            <div class="row2" style="margin-top:8px">
              <!-- Donut -->
              <div>
                <svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">
                  <circle cx="{cx}" cy="{cy}" r="{rads}" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                  <circle cx="{cx}" cy="{cy}" r="{rads}" stroke="{color}" stroke-width="8" fill="none"
                          stroke-dasharray="{dash:.2f} {circ - dash:.2f}"
                          transform="rotate(-90 {cx} {cy})"/>
                  <text x="{cx}" y="{cy - 2}" text-anchor="middle" font-size="13" font-weight="700" fill="{color}">{val:g}</text>
                  <text x="{cx}" y="{cy + 12}" text-anchor="middle" font-size="9" fill="#6b7280">{_html_escape(unit)}</text>
                </svg>
              </div>

              <!-- Range bar + sparkline -->
              <div>
                <div class="normal">Normal: {_html_escape(f"{lo:g}")}–{_html_escape(f"{hi:g}")} {_html_escape(unit)}</div>
                <div class="bar-wrap">
                  <div class="bar-fill"></div>
                  <div class="marker {marker_cls}" style="left: calc({pct}% - 1px)"></div>
                </div>

                <div style="margin-top:6px">
                  <svg width="140" height="28" viewBox="0 0 140 28">
                    <path d="{sp_path}" fill="none" stroke="{color}" stroke-width="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        """)

    metrics_section = f"""
      <h2>📊 Health Metrics</h2>
      <div class="grid">
        {''.join(cards_html)}
      </div>
    """

    # suggestions
    sug_blocks = []
    if suggestions:
        for metric, block in suggestions.items():
            s = block.get("status", "abnormal").title()
            home = "".join([f"<li>{_html_escape(t)}</li>" for t in (block.get("home") or [])])
            meds = "".join([f"<li>{_html_escape(t)}</li>" for t in (block.get("meds") or [])])
            note = _html_escape(block.get("note", ""))
            sug_blocks.append(f"""
              <div class="card">
                <div class="row" style="margin-bottom:6px">
                  <div class="name">{_html_escape(metric)}</div>
                  <span class="chip">{_html_escape(s)}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                  <div><div class="name" style="font-size:12px">At home</div><ul>{home}</ul></div>
                  <div><div class="name" style="font-size:12px">Medication / clinical</div><ul>{meds}</ul></div>
                </div>
                <div class="note">{note}</div>
              </div>
            """)

    suggestions_section = f"""
      <h2>💡 Suggestions</h2>
      {'<div class="grid">' + ''.join(sug_blocks) + '</div>' if sug_blocks else '<p class="muted">No specific suggestions. Everything in range 🎉</p>'}
    """

    doc_sum = f"<h2>🩺 Doctor Summary</h2><div class='muted'>{_html_escape(doctor_summary)}</div>"
    pat_sum = f"<h2>👤 Patient Summary</h2><div class='muted'>{_html_escape(patient_summary)}</div>"

    charts_html = ""
    charts_dir = os.path.join("app", "charts", f"user_{user_id}")
    if os.path.isdir(charts_dir):
        imgs = []
        for fname in sorted(os.listdir(charts_dir)):
            if fname.lower().endswith(".png"):
                imgs.append(os.path.join(charts_dir, fname).replace("\\", "/"))
        if imgs:
            img_tags = "".join([f'<img src="file:///{_html_escape(p)}" style="width:100%;border:1px solid #e5e7eb;border-radius:8px" />' for p in imgs])
            charts_html = f"<h2>📈 Metric Charts (reference)</h2><div class='charts-grid'>{img_tags}</div>"

    html_doc = f"""
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>Health Report Summary</h1>
        {metrics_section}
        <div class="section">{suggestions_section}</div>
        <div class="section">{doc_sum}</div>
        <div class="section">{pat_sum}</div>
        <div class="section">{charts_html}</div>
      </body>
    </html>
    """
    return html_doc, css


# -----------------------------
# ReportLab fallback (unchanged layout)
# -----------------------------
def _build_reportlab_doc(
    out_path: str,
    doctor_summary: str,
    patient_summary: str,
    metrics: Dict[str, float],
    ranges: Dict[str, Dict[str, Any]],
    suggestions: Dict[str, Any],
    user_id: int,
) -> None:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elements: List[Any] = []

    elements.append(Paragraph("<b>Health Report Summary</b>", styles["Title"]))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("📊 Health Metrics", styles["Heading2"]))
    data = [["Metric", "Value", "Normal Range", "Status"]]
    for m, v in metrics.items():
        r = ranges.get(m, {})
        lo = _coerce_float(r.get("min", 0.0))
        hi = _coerce_float(r.get("max", 1.0))
        unit = r.get("unit", "")
        status = _status(_coerce_float(v), lo, hi)
        rng_text = f"{lo:g}–{hi:g} {unit}".strip()
        data.append([m, f"{_coerce_float(v):g} {unit}".strip(), rng_text, status.title()])

    table = Table(data, colWidths=[140, 120, 160, 80])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 1), (-1, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("💡 Suggestions", styles["Heading2"]))
    if suggestions:
        for metric, block in suggestions.items():
            elements.append(Paragraph(f"<b>{metric}</b> <font size=9 color='#64748b'>({block.get('status','').title()})</font>", styles["Normal"]))
            if block.get("home"):
                elements.append(Paragraph("<b>At home</b>", styles["Normal"]))
                for t in block["home"]:
                    elements.append(Paragraph(f"• {t}", styles["Normal"]))
            if block.get("meds"):
                elements.append(Paragraph("<b>Medication / clinical</b>", styles["Normal"]))
                for t in block["meds"]:
                    elements.append(Paragraph(f"• {t}", styles["Normal"]))
            note = block.get("note")
            if note:
                elements.append(Paragraph(f"<font size=9 color='#64748b'>{note}</font>", styles["Normal"]))
            elements.append(Spacer(1, 6))
    else:
        elements.append(Paragraph("No specific suggestions. Everything in range 🎉", styles["Normal"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("🩺 Doctor Summary", styles["Heading2"]))
    elements.append(Paragraph(_html_escape(doctor_summary).replace("\n", "<br/>"), styles["Normal"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("👤 Patient Summary", styles["Heading2"]))
    elements.append(Paragraph(_html_escape(patient_summary).replace("\n", "<br/>"), styles["Normal"]))
    elements.append(Spacer(1, 12))

    charts_dir = os.path.join("app", "charts", f"user_{user_id}")
    if os.path.isdir(charts_dir):
        elements.append(Paragraph("📈 Metric Charts (reference)", styles["Heading2"]))
        for fname in sorted(os.listdir(charts_dir)):
            if not fname.lower().endswith(".png"):
                continue
            img_path = os.path.join(charts_dir, fname)
            try:
                elements.append(Image(img_path, width=440, height=200))
                elements.append(Spacer(1, 8))
            except Exception:
                continue

    doc.build(elements)

    with open(out_path, "wb") as f:
        f.write(buf.getvalue())
