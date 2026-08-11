from fastapi import (
    APIRouter,
    Request,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
    Depends,
)
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from workers.job_runner import enqueue_job
from .storage_adapter import LocalStorageAdapter
import uuid
import subprocess
import urllib.parse
import socket
import ipaddress
from database.connection import get_db
from database.models import Repository, AnalysisJob
from sqlalchemy.orm import Session

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
storage = LocalStorageAdapter()

ALLOWED_GIT_HOSTS = {"github.com", "gitlab.com", "bitbucket.org"}


def is_valid_git_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if hostname not in ALLOWED_GIT_HOSTS:
            return False

        # SSRF Protection: Resolve IP and check if it's private/local
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
            return False

        return True
    except Exception:
        return False


@router.post("/upload")
@limiter.limit("10/minute")
def upload_repository(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    repository_url: Optional[str] = Form(None),
    project_name: Optional[str] = Form(None),
    analysis_type: str = Form("full"),
    db: Session = Depends(get_db),
):
    if not file and not repository_url:
        raise HTTPException(
            status_code=400,
            detail="Must provide either a ZIP file or a Git repository URL",
        )

    # Simulate size validation (2GB limit)
    if file and file.size and file.size > 2000 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Repository too large. Limit is 2GB."
        )

    repo_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    final_project_name = project_name or (file.filename if file else repository_url)

    try:
        extract_path = None
        if file:
            if not file.filename.endswith(".zip"):
                raise HTTPException(
                    status_code=400,
                    detail="Only .zip files are supported for file upload",
                )
            zip_path = storage.save_zip(file, repo_id)
            try:
                extract_path = storage.extract_zip(zip_path, repo_id)
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))
        elif repository_url:
            if not is_valid_git_url(repository_url):
                raise HTTPException(
                    status_code=400, detail="Invalid or unsupported Git URL"
                )
            extract_path = f"/tmp/codeatlas_workspace/{repo_id}"

            try:
                subprocess.run(
                    [
                        "git",
                        "clone",
                        "--depth",
                        "1",
                        "--config",
                        "core.hooksPath=/dev/null",
                        repository_url,
                        extract_path,
                    ],
                    check=True,
                    capture_output=True,
                    timeout=120,
                )
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=400, detail="Git clone timed out")
            except subprocess.CalledProcessError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to clone repository: {e.stderr.decode('utf-8')}",
                )

        new_repo = Repository(
            repo_id=repo_id, name=final_project_name, url=repository_url
        )
        new_job = AnalysisJob(
            job_id=job_id,
            repo_id=repo_id,
            project_name=final_project_name,
            status="Uploaded",
        )
        db.add(new_repo)
        db.flush()
        db.add(new_job)
        db.commit()

        enqueue_job(job_id, background_tasks, extract_path)

        return {"message": "Repository accepted", "repo_id": repo_id, "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        storage.cleanup(repo_id)
        raise HTTPException(
            status_code=500, detail=f"Failed to process upload: {str(e)}"
        )


@router.get("/")
@limiter.limit("60/minute")
def get_repositories(
    request: Request, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    repos = (
        db.query(Repository.repo_id, Repository.name).offset(skip).limit(limit).all()
    )
    return {"repositories": [{"repo_id": r.repo_id, "name": r.name} for r in repos]}


@router.get("/jobs")
@limiter.limit("60/minute")
def get_all_jobs(
    request: Request, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    jobs = (
        db.query(
            AnalysisJob.job_id,
            AnalysisJob.repo_id,
            AnalysisJob.project_name,
            AnalysisJob.status,
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "jobs": [
            {
                "job_id": j.job_id,
                "repo_id": j.repo_id,
                "project_name": j.project_name,
                "status": j.status,
            }
            for j in jobs
        ]
    }


@router.get("/{repo_id}")
@limiter.limit("60/minute")
def get_repository(request: Request, repo_id: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.repo_id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return {"repo_id": repo.repo_id, "name": repo.name}


@router.get("/jobs/{job_id}")
@limiter.limit("60/minute")
def get_job_status(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job.job_id,
        "repo_id": job.repo_id,
        "project_name": job.project_name,
        "status": job.status,
        "error": job.error,
        "findings": job.findings,
        "graph_preview": job.graph_preview,
    }


@router.delete("/jobs/{job_id}")
@limiter.limit("30/minute")
def delete_job(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
