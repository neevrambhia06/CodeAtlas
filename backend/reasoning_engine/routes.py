from fastapi import APIRouter, HTTPException, Depends, Request
from database.connection import get_db
from database.models import AnalysisJob
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.get("/capabilities/{job_id}")
@limiter.limit("60/minute")
def get_capabilities(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    findings = job.findings or {}
    return {"job_id": job_id, "capabilities": findings.get("capabilities", [])}


@router.get("/journeys/{job_id}")
@limiter.limit("60/minute")
def get_journeys(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    findings = job.findings or {}
    return {"job_id": job_id, "journeys": findings.get("journeys", [])}


@router.get("/logic-gaps/{job_id}")
@limiter.limit("60/minute")
def get_logic_gaps(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    findings = job.findings or {}
    return {"job_id": job_id, "logic_gaps": findings.get("gaps", [])}
