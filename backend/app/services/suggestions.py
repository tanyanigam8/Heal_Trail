
# app/services/suggestions.py
from __future__ import annotations

from typing import Dict, Any, List, Tuple

# Small, safe, static knowledge-base. This avoids LLM timeouts and keeps advice consistent.
# ⚠️ Always shown with a medical disclaimer in the UI.
KB: Dict[str, Dict[str, Dict[str, List[str]]]] = {
    "Hemoglobin": {
        "low": {
            "home": [
                "Iron-rich foods: lean red meat, chicken, fish, spinach, beans, lentils.",
                "Add vitamin C (citrus, amla, bell peppers) with iron meals to boost absorption.",
                "Avoid tea/coffee within 1–2 hours of iron-rich meals.",
                "Ensure adequate B12/folate intake (eggs, dairy, green leafy veg).",
            ],
            "meds": [
                "Discuss oral iron (e.g., ferrous sulfate) with your doctor.",
                "If B12/folate deficiency is suspected, supplementation may be needed (doctor-guided).",
            ],
        },
        "high": {
            "home": [
                "Hydrate well; avoid smoking if applicable.",
            ],
            "meds": [
                "High hemoglobin can have serious causes (e.g., polycythemia). Seek medical review.",
            ],
        },
    },
    "Hematocrit": {
        "low": {
            "home": [
                "Similar to low hemoglobin: iron-rich diet + vitamin C, consider B12/folate sources.",
            ],
            "meds": [
                "Doctor may recommend iron/B12/folate after evaluation.",
            ],
        },
        "high": {
            "home": ["Hydration; avoid smoking."],
            "meds": ["See your doctor to assess causes such as dehydration or polycythemia."],
        },
    },
    "WBC": {
        "low": {
            "home": [
                "Practice infection precautions (hand hygiene, avoid sick contacts).",
                "Adequate sleep and nutrition.",
            ],
            "meds": [
                "Further evaluation needed. Do not start antibiotics without prescription.",
            ],
        },
        "high": {
            "home": [
                "Rest, hydrate; monitor temperature.",
            ],
            "meds": [
                "High WBC often reflects infection/inflammation. Seek medical advice, especially with fever.",
            ],
        },
    },
    "Platelets": {
        "low": {
            "home": [
                "Avoid alcohol; avoid NSAIDs like ibuprofen unless doctor says otherwise.",
            ],
            "meds": [
                "Low platelets can cause bleeding risk. Get doctor guidance promptly.",
            ],
        },
        "high": {
            "home": ["Hydration; treat underlying issues per doctor advice."],
            "meds": ["Persistent high platelets need medical evaluation."],
        },
    },
    "Glucose": {
        "high": {
            "home": [
                "Reduce refined carbs/sugary drinks; shift to high-fiber, low-glycemic meals.",
                "Aim ≥150 min/week moderate exercise + resistance training 2–3x/week.",
                "Weight management if overweight; consistent sleep schedule.",
            ],
            "meds": [
                "Discuss metformin or other therapies with your doctor if fasting glucose remains high.",
                "Monitor fasting and post-meal glucose; keep a log.",
            ],
        },
        "low": {
            "home": [
                "If symptomatic and truly low, take quick carbs (glucose tablets/juice) and recheck.",
                "Ensure regular balanced meals; avoid skipping meals.",
            ],
            "meds": [
                "Recurrent low glucose needs medical review to adjust medicines/diet.",
            ],
        },
    },
    "MCV": {
        "low": {
            "home": ["Often due to iron deficiency—see Hemoglobin (low)."],
            "meds": ["Doctor may treat iron deficiency after tests (ferritin, iron studies)."],
        },
        "high": {
            "home": ["Increase B12/folate foods (eggs, dairy, spinach, legumes)."],
            "meds": ["Doctor may evaluate B12/folate levels; supplementation if deficient."],
        },
    },
    "MCH": {
        "low": {
            "home": ["Track with Hemoglobin/MCV—iron-rich diet + vitamin C."],
            "meds": ["Doctor-guided iron therapy if deficient."],
        },
        "high": {
            "home": ["Check B12/folate intake; limit alcohol if high intake."],
            "meds": ["Doctor may check B12/folate; supplementation as needed."],
        },
    },
    "MCHC": {
        "low": {
            "home": ["As with iron-deficiency patterns—optimize iron, vitamin C."],
            "meds": ["Doctor may recommend iron after testing."],
        },
        "high": {
            "home": ["Hydration; discuss with doctor (may relate to hemolysis/lab artifact)."],
            "meds": ["Needs clinical correlation by a doctor."],
        },
    },
    "ESR": {
        "high": {
            "home": ["Anti-inflammatory diet (omega-3s, fruits/veg), gentle activity, adequate sleep."],
            "meds": ["ESR is nonspecific; clinical evaluation recommended if persistently high."],
        }
    },
    "RBC": {
        "low": {
            "home": ["Similar to low hemoglobin—iron-rich diet; B12/folate as appropriate."],
            "meds": ["Doctor may treat underlying anemia after evaluation."],
        },
        "high": {
            "home": ["Hydration; avoid smoking."],
            "meds": ["Requires medical evaluation."],
        },
    },
}

def _status(value: float, low: float, high: float) -> str:
    if value < low:
        return "low"
    if value > high:
        return "high"
    return "normal"

def _get_range_for(metric: str, ranges: Dict[str, Dict[str, Any]]) -> Tuple[float, float, str]:
    r = ranges.get(metric, {}) or {}
    lo = float(r.get("min", 0.0))
    hi = float(r.get("max", 0.0))
    unit = str(r.get("unit", "")) if r.get("unit") is not None else ""
    if hi <= lo:
        # very defensive: create a minimal band if invalid
        hi = max(lo + 1.0, 1.0)
    return lo, hi, unit

def generate_suggestions(metrics: Dict[str, float], ranges: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Returns { metric: {status, home:[], meds:[], note:str} } for ABNORMAL metrics only.
    """
    out: Dict[str, Any] = {}
    for metric, raw in (metrics or {}).items():
        try:
            val = float(raw)
        except Exception:
            continue
        lo, hi, _ = _get_range_for(metric, ranges)
        status = _status(val, lo, hi)
        if status == "normal":
            continue

        kb = KB.get(metric, {})
        block = kb.get(status, {})
        home = list(block.get("home", []))
        meds = list(block.get("meds", []))
        note = "Discuss results with your clinician, especially if you have symptoms."

        # Generic fallbacks if we don't have curated entries
        if not home and status == "high":
            home = ["Reduce added sugars/refined carbs; hydrate; increase physical activity where safe."]
        if not home and status == "low":
            home = ["Ensure balanced nutrition and regular meals; consider common nutrient gaps."]

        if not meds and status == "high":
            meds = ["Medication choices depend on cause—seek clinician advice."]
        if not meds and status == "low":
            meds = ["Supplements/medicines should be clinician-guided after tests."]

        out[metric] = {
            "status": status,
            "home": home,
            "meds": meds,
            "note": note,
        }
    return out
