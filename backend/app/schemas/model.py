from pydantic import BaseModel
from typing import List
from datetime import datetime

class ModelBase(BaseModel):
    name: str

class ModelCreate(ModelBase):
    pass

class DailyCount(BaseModel):
    date: str
    count: int

class MethodHistory(BaseModel):
    method: str
    history: List[DailyCount]

class ModelOut(ModelBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True