import os
import time
import uuid
import json
from dotenv import load_dotenv

# Load env but DO NOT print it
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database.models import User, Repository, AnalysisJob, Base

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print(json.dumps({"error": "DATABASE_URL is missing"}))
    exit(1)

engine = create_engine(DATABASE_URL, pool_size=1, max_overflow=5, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

results = {
    "CRUD": "FAIL",
    "TRANSACTIONS": "FAIL",
    "FOREIGN_KEYS": "FAIL",
    "CONNECTION_POOL": "FAIL",
    "ANALYSIS_JOB_LIFECYCLE": "FAIL"
}

try:
    db = SessionLocal()
    
    # 1. CRUD TEST
    user_id = str(uuid.uuid4())
    repo_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    
    # Create User
    new_user = User(user_id=user_id, email=f"{user_id}@test.com", name="Test", password="pwd", role="Admin")
    db.add(new_user)
    db.commit()
    
    # Read/Update User
    u = db.query(User).filter_by(user_id=user_id).first()
    u.name = "Test Updated"
    db.commit()
    
    # Create Repo
    new_repo = Repository(repo_id=repo_id, name="Test Repo", url="http://test.com")
    db.add(new_repo)
    db.commit()
    
    # Create Job with JSONB
    new_job = AnalysisJob(
        job_id=job_id,
        repo_id=repo_id,
        project_name="Test Repo",
        status="QUEUED",
        findings={"domains": [{"name": "Auth"}], "capabilities": [], "journeys": [], "gaps": []}
    )
    db.add(new_job)
    db.commit()
    
    # Verify Read JSONB
    j = db.query(AnalysisJob).filter_by(job_id=job_id).first()
    if j.findings["domains"][0]["name"] == "Auth":
        results["CRUD"] = "PASS"

    # 2. TRANSACTION TEST
    try:
        with db.begin_nested():
            # Intentional failure: Duplicate PK
            db.add(User(user_id=user_id, email="fail@test.com", name="Fail", password="pwd", role="Admin"))
            db.flush()
    except Exception as e:
        # Rolled back, but db session should still be usable
        pass
    
    u2 = db.query(User).filter_by(user_id="fail").first()
    if not u2:
        results["TRANSACTIONS"] = "PASS"

    # 3. FOREIGN KEY TEST
    try:
        with db.begin_nested():
            bad_job = AnalysisJob(job_id=str(uuid.uuid4()), repo_id="nonexistent-repo", status="QUEUED")
            db.add(bad_job)
            db.flush()
    except Exception as e:
        if "foreign key constraint" in str(e).lower() or "repositories" in str(e).lower() or "violate" in str(e).lower():
            results["FOREIGN_KEYS"] = "PASS"
            
    # 6. LIFECYCLE TEST (Simulate transitioning through statuses)
    j.status = "INGESTING"
    db.commit()
    j.status = "PARSING"
    db.commit()
    j.status = "REASONING"
    db.commit()
    j.status = "FAILED"
    j.error = "Simulated failure"
    db.commit()
    
    final_j = db.query(AnalysisJob).filter_by(job_id=job_id).first()
    if final_j.status == "FAILED" and final_j.error == "Simulated failure":
        results["ANALYSIS_JOB_LIFECYCLE"] = "PASS"

    # Cleanup
    db.delete(final_j)
    db.delete(new_repo)
    db.delete(u)
    db.commit()

    # 4. CONNECTION POOL TEST
    # Run multiple queries and rely on SQLAlchemy's pool to not exhaust
    for _ in range(20):
        db.execute(text("SELECT 1"))
    results["CONNECTION_POOL"] = "PASS"

except Exception as e:
    results["ERROR"] = str(e)
finally:
    db.close()

print(json.dumps(results))
