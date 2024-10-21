from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.database import get_db
from ..db.models import Report, Model
from ..schemas.report import ReportCreate, ReportOut
from .auth import get_current_user

router = APIRouter()


@router.post("/{model_name}/report", response_model=ReportOut)
def create_report(model_name: str, report: ReportCreate, db: Session = Depends(get_db)):
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    db_report = Report(**report.dict(), model_id=db_model.id)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("/{model_name}", response_model=List[ReportOut])
def read_reports(
        model_name: str,
        skip: int = 0,
        limit: int = 100,
        status: str = None,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    query = db.query(Report).filter(Report.model_id == db_model.id)

    if status:
        query = query.filter(Report.status == status)

    reports = query.order_by(Report.timestamp.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/{report_id}", response_model=ReportOut)
def read_report(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return db_report


@router.delete("/{report_id}", response_model=ReportOut)
def delete_report(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(db_report)
    db.commit()
    return db_report