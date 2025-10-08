# ✅ app/utils/range_agent.py

from bs4 import BeautifulSoup
import requests

# Static fallback in case scraping fails
STATIC_RANGES = {
    "hemoglobin": {"min": 13.0, "max": 17.0, "unit": "g/dL"},
    "platelet count": {"min": 150, "max": 450, "unit": "thousand/uL"},
    "white blood cells": {"min": 4.5, "max": 11.0, "unit": "thousand/uL"},
    "rbc": {"min": 4.5, "max": 5.9, "unit": "million/uL"},
    "blood glucose fasting": {"min": 70, "max": 100, "unit": "mg/dL"},
    "blood urea": {"min": 7, "max": 20, "unit": "mg/dL"},
    "serum creatinine": {"min": 0.6, "max": 1.3, "unit": "mg/dL"},
    "total cholesterol": {"min": 125, "max": 200, "unit": "mg/dL"},
    "hdl cholesterol": {"min": 40, "max": 60, "unit": "mg/dL"},
    "ldl cholesterol": {"min": 0, "max": 100, "unit": "mg/dL"},
    "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL"},
}

# 🧠 Cached reference ranges (avoid re-scraping every time)
_cached_ranges = None

def get_all_metric_ranges() -> dict:
    """
    Scrapes or returns static clinical reference ranges for all known metrics.
    Returns lowercase metric names with min/max/unit.
    """
    global _cached_ranges
    if _cached_ranges:
        return _cached_ranges

    url = "https://www.nhp.gov.in/normal-laboratory-values_mtl"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        table = soup.find("table")

        ranges = {}
        for row in table.find_all("tr")[1:]:
            cols = row.find_all("td")
            if len(cols) >= 2:
                name = cols[0].get_text(strip=True).lower()
                range_str = cols[1].get_text(strip=True).replace("to", "-")

                if "-" in range_str:
                    parts = range_str.split("-")
                    try:
                        low = float(parts[0].strip())
                        high = float(parts[1].strip())
                        ranges[name] = {"min": low, "max": high, "unit": ""}
                    except ValueError:
                        continue

        # If scraping failed
        if not ranges:
            print("⚠️ Scraping failed to extract valid ranges. Using fallback.")
            _cached_ranges = STATIC_RANGES
        else:
            _cached_ranges = ranges

    except requests.RequestException as e:
        print(f"❌ Failed to fetch reference data: {e}")
        print("⚠️ Using static fallback ranges.")
        _cached_ranges = STATIC_RANGES

    return _cached_ranges

def get_metric_reference_range(metric_name: str):
    """
    Returns the reference range (min, max, unit) for a specific metric.
    Returns None if not found.
    """
    ranges = get_all_metric_ranges()
    return ranges.get(metric_name.lower())
