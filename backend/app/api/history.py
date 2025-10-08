from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from app.services.extractor import extract_pdf_content
from app.services.summary import generate_summary
from app.services.pdf_generator import generate_summary_pdf
from app.core.database import get_db, store_report_in_db
from app.core.security import SECRET_KEY, ALGORITHM

import os

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        # ✅ Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token - no subject")

        # ✅ Get user from DB
        from app.models.user import User
        db_user = db.query(User).filter(User.username == username).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = db_user.id
        print(f"📥 Upload received from user_id: {user_id}")

        # ✅ Extract content and metadata
        contents, metadata = extract_pdf_content(file)

        # ✅ Generate summaries
        doctor_summary, patient_summary = generate_summary(contents)

        # ✅ Generate summary PDF
        pdf_path = generate_summary_pdf(metadata, doctor_summary, patient_summary)

        # ✅ Store in database
        store_report_in_db(
            db=db,
            user_id=user_id,
            metadata=str(metadata),
            doctor_summary=doctor_summary,
            patient_summary=patient_summary
        )

        return {
            "doctor_summary": doctor_summary,
            "patient_summary": patient_summary,
            "download_url": "/api/download-report"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception in upload: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/download-report")
async def download_pdf():
    if not os.path.exists("Health_Summary.pdf"):
        raise HTTPException(status_code=404, detail="Summary PDF not found")
    return FileResponse("Health_Summary.pdf", media_type="application/pdf", filename="Health_Summary.pdf")


@router.get("/get-latest-summary")
def get_latest_summary(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        from app.models.user import User
        from app.models.history import ReportHistory  # ✅ FIXED

        db_user = db.query(User).filter(User.username == username).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        latest_report = (
            db.query(ReportHistory)
            .filter(ReportHistory.user_id == db_user.id)
            .order_by(ReportHistory.id.desc())  # ✅ NO created_at field
            .first()
        )

        if not latest_report:
            raise HTTPException(status_code=404, detail="No summary found")

        return {
            "doctor_summary": latest_report.summary_doctor,
            "patient_summary": latest_report.summary_patient,
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"❌ Error fetching summary: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
