# app/api/routes.py

import os
import io
import json
import glob
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse, StreamingResponse
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.services.summary import generate_summary
from app.services.pdf_generator import generate_summary_pdf
from app.core.database import get_db, store_report_in_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Upload report + generate summary (+ suggestions) and persist to history
# -----------------------------------------------------------------------------
@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    try:
        # ---- auth ----
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        db_user = db.query(User).filter(User.username == username).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")

        logger.info("✅ Received file: %s for user_id: %s", file.filename, db_user.id)

        # ---- generate summaries, metrics, ranges, suggestions, charts ----
        result = await generate_summary(file=file, user_id=db_user.id)
        logger.info("✅ Summary generated successfully")

        # We save ONLY the numeric metrics as "metadata" for trend history
        # (keep it simple and consistent for /history/metrics)
        metrics: Dict[str, Any] = result.get("metrics") or {}

        # ---- persist a history row for this user ----
        store_report_in_db(
            db=db,
            user_id=db_user.id,
            doctor_summary=result.get("doctor_summary") or "",
            patient_summary=result.get("patient_summary") or "",
            metadata=metrics,            # <= store numeric metrics
            filename=file.filename,      # if the column exists it will be saved
        )

        # ---- return everything the frontend needs ----
        return {
            "doctor_summary": result.get("doctor_summary") or "",
            "patient_summary": result.get("patient_summary") or "",
            "metrics": result.get("metrics") or {},         # numeric values
            "ranges": result.get("ranges") or {},           # normal bands
            "charts": result.get("charts") or {},           # optional image paths
            "suggestions": result.get("suggestions") or {}, # ✅ now included
        }

    except HTTPException:
        raise
    except Exception:
        logger.error("❌ Upload Error", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


# -----------------------------------------------------------------------------
# History metrics for Trend Analysis (table)
# -----------------------------------------------------------------------------
@router.get("/history/metrics")
def get_history_metrics(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> List[Dict[str, Any]]:
    # ---- auth ----
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ---- query history ----
    from app.models.history import ReportHistory

    rows = (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user.id)
        .order_by(ReportHistory.id.asc())
        .all()
    )

    def _parse_meta(entry) -> Dict[str, Any]:
        # tolerant to different column names and storage formats
        for attr in ("report_metadata", "metadata_json", "metadata", "report_data", "meta", "data"):
            if hasattr(entry, attr):
                raw = getattr(entry, attr)
                if not raw:
                    continue
                if isinstance(raw, dict):
                    return raw
                try:
                    return json.loads(raw)
                except Exception:
                    return {}
        return {}

    def _sf(x: Optional[Any]) -> float:
        try:
            return float(x)
        except Exception:
            return -1.0

    out: List[Dict[str, Any]] = []
    for r in rows:
        meta = _parse_meta(r)
        date_str = r.uploaded_at.strftime("%Y-%m-%d") if getattr(r, "uploaded_at", None) else f"id-{r.id}"
        out.append(
            {
                "date": date_str,
                "Hemoglobin": _sf(meta.get("Hemoglobin")),
                "Platelets": _sf(meta.get("Platelets")),
                "WBC": _sf(meta.get("WBC")),
                "RBC": _sf(meta.get("RBC")),
                "Glucose": _sf(meta.get("Glucose")),
            }
        )
    return out


# -----------------------------------------------------------------------------
# List this user's recent reports (id/filename/date + quick metric keys)
# -----------------------------------------------------------------------------
@router.get("/history/reports")
def list_user_reports(
    limit: int = 50,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> List[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.models.history import ReportHistory
    rows = (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user.id)
        .order_by(ReportHistory.id.desc())
        .limit(max(1, min(limit, 200)))
        .all()
    )

    def _parse_meta(entry) -> Dict[str, Any]:
        raw = getattr(entry, "report_metadata", None)
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str) and raw.strip():
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": r.id,
                "filename": getattr(r, "filename", None),
                "uploaded_at": r.uploaded_at.isoformat() if getattr(r, "uploaded_at", None) else None,
                "metric_keys": sorted(k for k in _parse_meta(r).keys() if k != "ranges"),
            }
        )
    return out


# -----------------------------------------------------------------------------
# Download the latest (or specific) report as a PDF
#  - unchanged behavior EXCEPT we now pass tiny trend series per metric
#    so the PDF graphs match the summary page.
# -----------------------------------------------------------------------------
@router.get("/download-report")
def download_report(
    report_id: Optional[int] = Query(
        None, description="If provided, download that specific report; otherwise the latest."
    ),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    # ---- auth ----
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.models.history import ReportHistory

    # pick the row to render
    q = db.query(ReportHistory).filter(ReportHistory.user_id == user.id)
    if report_id is not None:
        q = q.filter(ReportHistory.id == report_id)
    row = q.order_by(ReportHistory.id.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found for this user.")

    # Parse metadata JSON (robust)
    metadata: Dict[str, Any] = {}
    raw_meta = getattr(row, "report_metadata", None)
    if isinstance(raw_meta, dict):
        metadata = raw_meta
    elif isinstance(raw_meta, str) and raw_meta.strip():
        try:
            metadata = json.loads(raw_meta)
        except Exception:
            metadata = {}

    # ---- build tiny series for sparklines (last up to 8 values)
    # We only create series for the metrics present in THIS report.
    rows = (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user.id)
        .order_by(ReportHistory.id.asc())
        .all()
    )

    def _parse_meta(entry) -> Dict[str, Any]:
        for attr in ("report_metadata", "metadata_json", "metadata", "report_data", "meta", "data"):
            if hasattr(entry, attr):
                raw = getattr(entry, attr)
                if not raw:
                    continue
                if isinstance(raw, dict):
                    return raw
                try:
                    return json.loads(raw)
                except Exception:
                    return {}
        return {}

    # metrics keys in the current/latest report
    current_metrics: Dict[str, float] = {}
    try:
        base = metadata.get("metrics") if isinstance(metadata.get("metrics"), dict) else metadata
        for k, v in (base or {}).items():
            if k == "ranges":
                continue
            try:
                current_metrics[k] = float(v)
            except Exception:
                pass
    except Exception:
        current_metrics = {}

    series_map: Dict[str, List[float]] = {k: [] for k in current_metrics.keys()}
    for r in rows:
        meta = _parse_meta(r)
        src = meta.get("metrics") if isinstance(meta.get("metrics"), dict) else meta
        for k in list(series_map.keys()):
            try:
                series_map[k].append(float(src.get(k)))
            except Exception:
                # keep alignment even if a value is missing (skip silently)
                pass

    # keep last few points for a compact sparkline
    for k in series_map:
        if len(series_map[k]) > 8:
            series_map[k] = series_map[k][-8:]

    # ---- generate the PDF (now with trend_series) ----
    pdf_path = generate_summary_pdf(
        doctor_summary=row.doctor_summary or getattr(row, "summary_doctor", "") or "",
        patient_summary=row.patient_summary or getattr(row, "summary_patient", "") or "",
        metadata=metadata,
        user_id=user.id,
        trend_series=series_map,  # ✅ this makes the PDF charts match the page
    )
    if not (isinstance(pdf_path, str) and os.path.exists(pdf_path)):
        logger.error("PDF generation failed; path not created: %r", pdf_path)
        raise HTTPException(status_code=500, detail="Failed to generate PDF.")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Health_Summary.pdf",
    )
