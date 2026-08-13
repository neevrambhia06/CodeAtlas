from sqlalchemy import Column, String, JSON, DateTime, Integer, Text, ForeignKey, Float
from sqlalchemy.sql import func
from .connection import Base


class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    password = Column(String, nullable=False)
    role = Column(String, default="Developer")
    auth_provider = Column(String, default="email")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Repository(Base):
    __tablename__ = "repositories"
    repo_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"
    job_id = Column(String, primary_key=True, index=True)
    repo_id = Column(String, ForeignKey("repositories.repo_id"), index=True)
    project_name = Column(String)
    status = Column(String, index=True)
    error = Column(String, nullable=True)
    findings = Column(JSON, default=dict)
    graph_preview = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True)
    action = Column(String)
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
