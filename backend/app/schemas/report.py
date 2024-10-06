from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class ReportBase(BaseModel):
    machine_id: str
    status: str
    timestamp: datetime
    method: str
    error: Optional[str] = None
    traceback: Optional[str] = None
    env_info: Optional[Dict] = None

class ReportCreate(ReportBase):
    pass

class ReportOut(ReportBase):
    id: int
    model_id: int

    class Config:
        from_attributes = True