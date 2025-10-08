# backend/scripts/test_webmd.py
import os, sys
from dotenv import load_dotenv

# Ensure backend/ is on sys.path (…/backend)
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

load_dotenv()  # pick up WEBMD_* flags from backend/.env

from app.services.webmd_fetcher import fetch_webmd_suggestions as f

def show(q: str):
    out = f(q) or ""
    print(f"\n=== {q} ===\n{out[:500]}\n")

if __name__ == "__main__":
    show("high hemoglobin")
    show("low platelets")
