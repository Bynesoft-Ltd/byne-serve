from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from ..db.database import get_db
from ..db.models import Model, Report
from ..schemas.model import ModelCreate, ModelOut, MethodHistory, DailyCount
from .auth import get_current_user

router = APIRouter()


@router.post("/", response_model=ModelOut)
def create_model(model: ModelCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_model = Model(**model.dict())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model


@router.get("/", response_model=List[ModelOut])
# def read_models(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
def read_models(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        models = db.query(Model).offset(skip).limit(limit).all()
        return models
    except Exception as e:
        print(f"Database query failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/{model_name}", response_model=ModelOut)
def read_model(model_name: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return db_model


@router.put("/{model_name}", response_model=ModelOut)
def update_model(model_name: str, model: ModelCreate, db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    for key, value in model.dict().items():
        setattr(db_model, key, value)
    db.commit()
    db.refresh(db_model)
    return db_model


@router.delete("/{model_name}", response_model=ModelOut)
def delete_model(model_name: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(db_model)
    db.commit()
    return db_model


@router.get("/{model_name}/unique_users", response_model=int)
def get_unique_users(
        model_name: str,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Get the number of unique users (machine_ids) for a specific model.

    Args:
    - model_name (str): The name of the model

    Returns:
    - int: The count of unique machine_ids in the reports for the specified model

    Raises:
    - HTTPException: 404 if the model is not found
    """
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    unique_users = db.query(func.count(func.distinct(Report.machine_id))) \
        .filter(Report.model_id == db_model.id) \
        .scalar()

    return unique_users


@router.get("/{model_name}/history", response_model=List[MethodHistory])
def get_method_history(
        model_name: str,
        start_date: datetime = Query(default=None),
        end_date: datetime = Query(default=None),
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Get the number of calls to different model methods over time for a specific model.

    Args:
    - model_name (str): The name of the model
    - start_date (datetime, optional): The start date for the history (defaults to one month ago)
    - end_date (datetime, optional): The end date for the history (defaults to current date)

    Returns:
    - List[MethodHistory]: A list of MethodHistory objects, each containing a method name and its daily call counts

    Raises:
    - HTTPException: 404 if the model is not found
    """
    db_model = db.query(Model).filter(Model.name == model_name).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    reports = db.query(
        func.date_trunc('day', Report.timestamp).label('date'),
        Report.method,
        func.count().label('count')
    ).filter(
        Report.model_id == db_model.id,
        Report.timestamp.between(start_date, end_date)
    ).group_by(
        func.date_trunc('day', Report.timestamp),
        Report.method
    ).all()

    method_history = {}
    for report in reports:
        if report.method not in method_history:
            method_history[report.method] = []
        method_history[report.method].append(DailyCount(
            date=report.date.strftime("%Y-%m-%d"),
            count=report.count
        ))

    return [MethodHistory(method=method, history=history) for method, history in method_history.items()]