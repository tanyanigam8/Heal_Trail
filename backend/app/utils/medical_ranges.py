# app/utils/medical_ranges.py

"""
Canonical normal ranges for common labs.
We return a 3-tuple (low, high, unit) for each metric.
"""

# Units picked to match the values your PDF produces.
REFERENCE_RANGES = {
    "Hemoglobin": (13.0, 17.0, "g/dL"),
    "Hematocrit": (38.8, 50.0, "%"),
    "RBC":        (4.5, 6.0,  "10^6/µL"),
    "WBC":        (4.0, 11.0, "10^3/µL"),
    "Platelets":  (150, 450,  "10^3/µL"),
    "MCV":        (80, 100,   "fL"),
    "MCH":        (27, 33,    "pg"),
    "MCHC":       (32, 36,    "g/dL"),
    "Glucose":    (70, 99,    "mg/dL"),

    # Extras (safe if missing in the report)
    "Creatinine": (0.6, 1.3,  "mg/dL"),
    "Urea":       (15, 45,    "mg/dL"),
    "Cholesterol":(125, 200,  "mg/dL"),
    "HDL":        (40, 60,    "mg/dL"),
    "LDL":        (0, 100,    "mg/dL"),
    "Triglycerides": (0, 150, "mg/dL"),
    "Vitamin D":  (20, 50,    "ng/mL"),
    "Calcium":    (8.5, 10.5, "mg/dL"),
    "Bilirubin":  (0.1, 1.2,  "mg/dL"),
    "SGOT":       (0, 40,     "U/L"),
    "SGPT":       (0, 45,     "U/L"),
    "TSH":        (0.4, 4.0,  "µIU/mL"),
}


def get_normal_range_for_metric(metric_name: str):
    """
    Always returns (low, high, unit). If unknown, returns (None, None, "").
    Case-insensitive lookup; trims whitespace.
    """
    key = (metric_name or "").strip()
    # try exact, then Title-case fallback
    rng = REFERENCE_RANGES.get(key)
    if rng is None:
        rng = REFERENCE_RANGES.get(key.title())
    if rng is None:
        return None, None, ""
    # Ensure it's a 3-tuple
    if len(rng) == 2:
        low, high = rng
        return low, high, ""
    return rng


def get_static_reference_ranges() -> dict:
    """
    Returns {metric: {"min": x, "max": y, "unit": "..."}}
    """
    out = {}
    for m, rng in REFERENCE_RANGES.items():
        if isinstance(rng, tuple):
            if len(rng) == 3:
                low, high, unit = rng
            elif len(rng) == 2:
                low, high = rng
                unit = ""
            else:
                continue
            out[m] = {"min": low, "max": high, "unit": unit}
    return out
