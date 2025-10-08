# app/services/chart_generator.py

import os
from typing import Dict, Any, Optional

# Use non-interactive backend for servers
import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

from app.utils.medical_ranges import get_normal_range_for_metric


def _ensure_dir(path: str) -> None:
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)


def _safe_normal_range(metric: str):
    """
    Supports both 2-tuple and 3-tuple returns from get_normal_range_for_metric.
    Always yields (low, high, unit).
    """
    res = get_normal_range_for_metric(metric)
    if isinstance(res, tuple):
        if len(res) == 3:
            return res
        if len(res) == 2:
            low, high = res
            return low, high, ""
    return None, None, ""


def _get_range_for_metric(metric: str, ranges: Optional[Dict[str, Dict[str, Any]]]) -> Optional[tuple]:
    """
    Return (min, max, unit) for the metric from provided ranges,
    falling back to static medical ranges if missing/invalid.
    """
    rmin = rmax = None
    unit = ""

    if isinstance(ranges, dict):
        r = ranges.get(metric, {}) or {}
        rmin = r.get("min")
        rmax = r.get("max")
        unit = (r.get("unit") or "").strip()

    if isinstance(rmin, (int, float)) and isinstance(rmax, (int, float)):
        return float(rmin), float(rmax), unit

    # Fallback to static
    low, high, unit2 = _safe_normal_range(metric)
    if isinstance(low, (int, float)) and isinstance(high, (int, float)):
        return float(low), float(high), unit or unit2

    return None


def generate_charts(
    *,
    metrics: Dict[str, float],
    user_id: int,
    ranges: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, str]:
    """
    Create simple charts for each metric showing:
      - normal band (min..max)
      - actual value (vertical line)
    Saves PNGs under app/charts/user_{user_id}/ and returns {metric: path}.
    """
    base_dir = os.path.join("app", "charts", f"user_{user_id}")
    _ensure_dir(base_dir)

    saved: Dict[str, str] = {}

    for metric, value in (metrics or {}).items():
        try:
            val = float(value)
        except Exception:
            continue

        rr = _get_range_for_metric(metric, ranges)
        if rr is None:
            continue

        rmin, rmax, unit = rr

        fig = plt.figure(figsize=(5, 2.6))
        ax = plt.gca()

        # Normal band
        ax.axvspan(rmin, rmax, alpha=0.25)

        # Actual value
        ax.axvline(val, linewidth=2)

        # Frame
        ax.set_xlim(min(val, rmin) - 1, max(val, rmax) + 1)
        ax.set_yticks([])
        ax.set_xlabel(f"{metric} ({unit})" if unit else metric)
        ax.set_title(f"{metric}: {val}")

        out_path = os.path.join(base_dir, f"{metric.replace(' ', '_')}.png")
        plt.tight_layout()
        plt.savefig(out_path, dpi=160)
        plt.close(fig)

        saved[metric] = out_path

    return saved
