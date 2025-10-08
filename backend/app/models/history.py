# app/models/history.py
from sqlalchemy import Column, Integer, String, DateTime, Text, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    # 👇 tell SQLAlchemy how this links to users.id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    uploaded_at = Column(DateTime, nullable=False, server_default=func.now())
    filename = Column(String(255), nullable=True)

    doctor_summary = Column(Text, nullable=True)
    patient_summary = Column(Text, nullable=True)

    # JSON (string) of metrics for trend charts
    report_metadata = Column(Text, nullable=True)

    # backref for ORM convenience (matches User.reports)
    user = relationship("User", back_populates="reports")

    def __repr__(self) -> str:
        return f"<ReportHistory id={self.id} user_id={self.user_id}>"
