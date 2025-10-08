# app/core/database.py

from __future__ import annotations

import os
import json
import logging
from typing import Optional, Dict, List
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# -----------------------------------------------------------------------------
# Engine / session
# -----------------------------------------------------------------------------
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in the .env file.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

logger = logging.getLogger(__name__)


def init_db():
    from app.models import user, history  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _ensure_report_history_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Best-effort patch for convenience columns (safe no-ops if present)
# -----------------------------------------------------------------------------
def _ensure_report_history_columns() -> None:
    try:
        from app.models.history import ReportHistory  # local import
        table_name = getattr(ReportHistory, "__tablename__", "report_history")

        insp = inspect(engine)
        if not insp.has_table(table_name):
            Base.metadata.create_all(bind=engine)

        cols = {c["name"] for c in insp.get_columns(table_name)}
        ddl: List[str] = []
        if "uploaded_at" not in cols:
            ddl.append(f"ALTER TABLE {table_name} ADD COLUMN uploaded_at DATETIME NULL")
        if "filename" not in cols:
            ddl.append(f"ALTER TABLE {table_name} ADD COLUMN filename VARCHAR(255) NULL")
        # These are optional; original schema may already have summary_doctor/summary_patient
        if "doctor_summary" not in cols:
            ddl.append(f"ALTER TABLE {table_name} ADD COLUMN doctor_summary LONGTEXT NULL")
        if "patient_summary" not in cols:
            ddl.append(f"ALTER TABLE {table_name} ADD COLUMN patient_summary LONGTEXT NULL")

        if ddl:
            with engine.begin() as conn:
                for stmt in ddl:
                    conn.execute(text(stmt))
            logger.info("🔧 ReportHistory table patched: %s", " | ".join(ddl))
    except Exception as e:
        logger.warning("⚠️ Could not verify/patch ReportHistory columns: %s", e)


# -----------------------------------------------------------------------------
# Robust insert that satisfies legacy + new schemas
# -----------------------------------------------------------------------------
def store_report_in_db(
    db: Session,
    user_id: int,
    doctor_summary: str,
    patient_summary: str,
    metadata: Optional[dict] = None,
    filename: Optional[str] = None,   # ✅ NEW: persist the uploaded filename
):
    """
    Insert a row into report_history using the actual columns present.
    Fills BOTH legacy names (summary_doctor/summary_patient) and new names
    (doctor_summary/patient_summary) if they exist, and always fills a
    metadata column if any of the known names exists.
    """
    from app.models.history import ReportHistory  # local import

    _ensure_report_history_columns()

    insp = inspect(engine)
    table_name = getattr(ReportHistory, "__tablename__", "report_history")
    cols_info = {c["name"]: c for c in insp.get_columns(table_name)}
    cols = set(cols_info.keys())

    insert_cols: List[str] = []
    params: Dict[str, object] = {}

    def add(col: str, value: object):
        if col in cols:
            insert_cols.append(col)
            params[col] = value

    # Required
    add("user_id", user_id)

    # Common optional
    add("uploaded_at", datetime.utcnow())
    add("filename", filename)  # ✅ save the filename if the column exists

    # Doctor/patient — write to ANY that exist to satisfy NOT NULL legacy columns
    for cand in ["doctor_summary", "summary_doctor"]:
        add(cand, str(doctor_summary))
    for cand in ["patient_summary", "summary_patient"]:
        add(cand, str(patient_summary))

    # Metadata variants — write to ALL that exist
    meta_json = json.dumps(metadata or {})
    for cand in ["report_metadata", "metadata_json", "metadata", "report_data", "meta", "data"]:
        add(cand, meta_json)

    # Sanity check: if DB has a NOT NULL column among our targets that we didn't include,
    # log loudly (extremely unlikely now that we fill ALL we find).
    for name, info in cols_info.items():
        lower = name.lower()
        if lower in {
            "doctor_summary", "summary_doctor",
            "patient_summary", "summary_patient",
            "report_metadata", "metadata_json", "metadata", "report_data", "meta", "data"
        } and not info.get("nullable", True) and name not in insert_cols:
            logger.error("❌ NOT NULL column %r exists but wasn't included in insert.", name)

    # Build/execute INSERT
    placeholders = ", ".join([f":{c}" for c in insert_cols])
    cols_sql = ", ".join(insert_cols)
    sql = text(f"INSERT INTO {table_name} ({cols_sql}) VALUES ({placeholders})")

    with engine.begin() as conn:
        conn.execute(sql, params)

    return None


def get_latest_report_for_user(db: Session, user_id: int):
    from app.models.history import ReportHistory  # local import
    return (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user_id)
        .order_by(ReportHistory.id.desc())
        .first()
    )
