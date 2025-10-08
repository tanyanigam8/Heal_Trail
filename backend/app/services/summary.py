# app/services/summary.py
import os
import logging
from typing import Any, Dict, Tuple

import httpx

from app.services.extractor import extract_pdf_content
from app.services.chart_generator import generate_charts
from app.utils.medical_ranges import get_normal_range_for_metric  # fallback bands
from app.services.suggestions import generate_suggestions         # ✅ new

logger = logging.getLogger(__name__)

# ---- LLM (Ollama) ----
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

_http = httpx.Client(timeout=httpx.Timeout(connect=20, read=120, write=20, pool=20))


def _ollama_chat(system: str, user: str) -> str:
    try:
        resp = _http.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 400},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        content = (data.get("message") or {}).get("content")
        return (content or "").strip() or "(empty LLM response)"
    except Exception as e:
        logger.exception("Ollama chat failed")
        return f"(LLM error) {e}"


def _summarize_with_llm(text: str, audience: str) -> str:
    if LLM_PROVIDER != "ollama":
        return "(LLM not configured)"

    system = (
        "You are a clinician assistant. Read the lab report text and produce a concise, technical summary. "
        "If any values look out of range, mention them briefly."
        if audience == "doctor"
        else
        "You are a friendly health coach. Summarize the report for a patient in simple language, "
        "avoid jargon, highlight anything that may need attention, and suggest general next steps to discuss with a doctor."
    )
    return _ollama_chat(system, (text or "")[:12000])


def _normalize_extractor_result(result: Any) -> Tuple[str, Dict[str, float], Dict[str, Dict[str, Any]]]:
    text: str = ""
    metrics: Dict[str, float] = {}
    ranges: Dict[str, Dict[str, Any]] = {}

    if isinstance(result, tuple):
        if len(result) >= 3:
            text = str(result[0] or "")
            metrics = dict(result[1] or {})
            ranges = dict(result[2] or {})
        elif len(result) == 2:
            text = str(result[0] or "")
            metrics = dict(result[1] or {})
        elif len(result) == 1:
            text = str(result[0] or "")
    else:
        text = str(result or "")
    return text, metrics, ranges


def _fixed_ranges(metrics: Dict[str, float], raw_ranges: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Return cleaned ranges:
      - drop bogus 0–0 / non-finite values
      - fill from static medical ranges when missing
    """
    fixed: Dict[str, Dict[str, Any]] = {}

    for metric in metrics.keys():
        r = (raw_ranges or {}).get(metric) or {}
        rmin, rmax, unit = r.get("min"), r.get("max"), r.get("unit", "")

        def _is_ok(a, b) -> bool:
            return isinstance(a, (int, float)) and isinstance(b, (int, float)) and b > a and not (a == 0 and b == 0)

        if _is_ok(rmin, rmax):
            fixed[metric] = {"min": float(rmin), "max": float(rmax), "unit": unit}
            continue

        low, high = get_normal_range_for_metric(metric)
        if isinstance(low, (int, float)) and isinstance(high, (int, float)) and high > low:
            fixed[metric] = {"min": float(low), "max": float(high), "unit": unit}

    return fixed


async def generate_summary(file, user_id: int):
    """
    1) Extract text & metrics (and optional ranges)
    2) Fix/complete ranges (so no 0–0 comes out)
    3) Generate charts
    4) Ask LLMs
    5) Build abnormal-only suggestions (home + meds) using static KB
    """
    logger.info("📥 Inside generate_summary")

    extracted = extract_pdf_content(file)
    text, metrics, ranges = _normalize_extractor_result(extracted)
    logger.info("🧹 Text length=%s | metrics=%s", len(text or ""), list(metrics.keys()))

    # Clean + complete normal bands
    ranges = _fixed_ranges(metrics, ranges)
    if ranges:
        logger.info("📐 Ranges prepared for: %s", list(ranges.keys()))

    # Charts (saved to app/charts/user_{id})
    charts = generate_charts(metrics=metrics, ranges=ranges, user_id=user_id)
    logger.info("📊 Charts generated: %s", charts)

    # Summaries via local LLM
    doctor_summary = _summarize_with_llm(text or "", "doctor")
    patient_summary = _summarize_with_llm(text or "", "patient")
    logger.info("✅ Summaries ready (doc len=%s, pat len=%s)", len(doctor_summary or ""), len(patient_summary or ""))

    # ✅ Personalized suggestions for ABNORMAL metrics only
    suggestions = generate_suggestions(metrics=metrics, ranges=ranges)

    return {
        "doctor_summary": doctor_summary,
        "patient_summary": patient_summary,
        "metrics": metrics,     # numeric values
        "ranges": ranges,       # cleaned normal bands
        "charts": charts,
        "suggestions": suggestions,  # ✅ new
    }
