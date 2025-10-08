# app/services/extractor.py

import io
import re
from typing import Dict, Tuple, Any

from app.utils.medical_ranges import get_normal_range_for_metric

# Optional PDF libs
try:
    import PyPDF2  # type: ignore
except Exception:
    PyPDF2 = None

try:
    import pdfplumber  # type: ignore
except Exception:
    pdfplumber = None


# ---------------------------
# PDF text extraction
# ---------------------------
def _extract_text_pypdf2(data: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(parts).strip()


def _extract_text_pdfplumber(data: bytes) -> str:
    parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for p in pdf.pages:
            try:
                parts.append(p.extract_text() or "")
            except Exception:
                continue
    return "\n".join(parts).strip()


def _read_upload_bytes(file) -> bytes:
    """
    Accepts a FastAPI UploadFile or a file-like; returns bytes.
    """
    # Starlette UploadFile has .file (SpooledTemporaryFile)
    if hasattr(file, "file"):
        return file.file.read()
    # Already bytes
    if isinstance(file, (bytes, bytearray)):
        return bytes(file)
    # A path-like object
    try:
        with open(file, "rb") as f:
            return f.read()
    except Exception:
        pass
    raise RuntimeError("Unsupported file object for PDF extraction.")


def extract_pdf_text(file) -> str:
    data = _read_upload_bytes(file)
    # Try PyPDF2 first
    if PyPDF2 is not None:
        try:
            text = _extract_text_pypdf2(data)
            if text.strip():
                return text
        except Exception:
            pass
    # Fallback to pdfplumber
    if pdfplumber is not None:
        try:
            text = _extract_text_pdfplumber(data)
            if text.strip():
                return text
        except Exception:
            pass
    raise RuntimeError(
        "No PDF text extractor available or failed to extract text. "
        "Install PyPDF2 or pdfplumber."
    )


# ---------------------------
# Metric parsing
# ---------------------------
_METRIC_PATTERNS = {
    # name: regex pattern capturing a float/int
    "Hemoglobin":  r"hemoglobin[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "Hematocrit":  r"hematocrit[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "RBC":         r"\bRBC\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "WBC":         r"\bWBC\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "Platelets":   r"platelet[s]?\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "MCV":         r"\bMCV\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "MCH":         r"\bMCH\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "MCHC":        r"\bMCHC\b[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
    "Glucose":     r"glucose(?:\s*\(fasting\))?[^0-9\-]*([0-9]+(?:\.[0-9]+)?)",
}

def _parse_metrics(text: str) -> Dict[str, float]:
    metrics: Dict[str, float] = {}
    low_text = text.lower()
    for name, pat in _METRIC_PATTERNS.items():
        m = re.search(pat, low_text, flags=re.IGNORECASE)
        if not m:
            continue
        try:
            val = float(m.group(1))
        except Exception:
            continue
        metrics[name] = val
    return metrics


# ---------------------------
# Normal ranges
# ---------------------------
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


def _build_ranges_for(metrics: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
    """
    Build {"Metric": {"min": x, "max": y, "unit": "..."}} for each detected metric.
    Works with both old (2-tuple) and new (3-tuple) medical_ranges API.
    """
    out: Dict[str, Dict[str, Any]] = {}
    for k in metrics.keys():
        low, high, unit = _safe_normal_range(k)
        if isinstance(low, (int, float)) and isinstance(high, (int, float)):
            out[k] = {"min": float(low), "max": float(high), "unit": unit or ""}
    return out


# ---------------------------
# Public API
# ---------------------------
def extract_pdf_content(file) -> Tuple[str, Dict[str, float], Dict[str, Dict[str, Any]]]:
    """
    Returns (raw_text, metrics, ranges).
    - raw_text: full text extracted from the PDF
    - metrics:  parsed numeric values from the text
    - ranges:   normal ranges for those metrics (min/max/unit)
    """
    text = extract_pdf_text(file)
    metrics = _parse_metrics(text)
    ranges = _build_ranges_for(metrics)
    return text, metrics, ranges
