# app/services/history.py

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.models.history import ReportHistory
from app.core.database import get_db


def save_report_summary(
    db: Session,
    user_id: int,
    metadata: dict,
    doctor_summary: str,
    patient_summary: str,
):
    """
    Create a full ReportHistory row with combined metrics in metadata.
    This is typically called from routes.py after summaries are generated.
    """
    if not isinstance(metadata, dict):
        raise ValueError("metadata must be a dict")

    entry = ReportHistory(
        user_id=user_id,
        report_metadata=json.dumps(metadata),
        summary_doctor=str(doctor_summary),
        summary_patient=str(patient_summary),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_user_metric_trends(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """
    Read past ReportHistory rows and build a time‑series table.
    Expects each row's report_metadata to contain keys like:
    Hemoglobin, Platelets, WBC, RBC, Glucose, and a report_date (dd/mm/YYYY).
    """
    rows = (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user_id)
        .order_by(ReportHistory.id.asc())
        .all()
    )

    def _f(v):
        try:
            return float(v)
        except Exception:
            return -1.0

    out: List[Dict[str, Any]] = []
    for r in rows:
        try:
            meta = json.loads(r.report_metadata or "{}")
            raw_date = meta.get("report_date") or meta.get("date") or "Unknown"
            try:
                # normalize to YYYY-MM-DD when possible
                dt = datetime.strptime(raw_date, "%d/%m/%Y").strftime("%Y-%m-%d")
            except Exception:
                dt = raw_date

            out.append({
                "date": dt,
                "Hemoglobin": _f(meta.get("Hemoglobin")),
                "Platelets": _f(meta.get("Platelets")),
                "WBC": _f(meta.get("WBC")),
                "RBC": _f(meta.get("RBC")),
                "Glucose": _f(meta.get("Glucose")),
            })
        except Exception:
            continue
    return out


def update_trend_table(user_id: int, metric_name: str, value: float, db: Optional[Session] = None) -> None:
    """
    No-op placeholder to match summary.py's call signature.

    Why no‑op?
    - Your /upload route already persists a *single, combined* row per report via store_report_in_db
      using the `ranges` dict returned from summary.py. That is what `get_user_metric_trends(...)`
      expects (combined metrics per row).
    - If we inserted a DB row per metric here, we'd pollute history and break your trend reader.

    Keep this stub so the pipeline never crashes; history is persisted by the route afterward.
    """
    return None
