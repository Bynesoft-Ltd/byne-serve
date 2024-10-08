from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reports = relationship("Report", back_populates="model", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, index=True)
    status = Column(String)
    timestamp = Column(DateTime(timezone=True))
    method = Column(String)
    error = Column(String, nullable=True)
    traceback = Column(String, nullable=True)
    env_info = Column(JSON, nullable=True)
    model_id = Column(Integer, ForeignKey("models.id"))
    model = relationship("Model", back_populates="reports")

    def __init__(self, **kwargs):
        super(Report, self).__init__(**kwargs)
        if self.timestamp is None:
            self.timestamp = func.now()