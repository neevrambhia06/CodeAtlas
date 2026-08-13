import os
import sys
import uuid
import pytest
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to path so we can import modules properly
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# ---------------------------------------------------------------------------
# Test Database Configuration
# ---------------------------------------------------------------------------
# We need to run tests against a real Postgres database to verify compatibility.
# If TEST_DATABASE_URL is provided, we use that. Otherwise, we default to
# a local Postgres instance if available. In CI, TEST_DATABASE_URL MUST be set.

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/codeatlas_test"
)

# Set the environment variable so the app uses the test DB during tests
# THIS MUST HAPPEN BEFORE IMPORTING connection.py OR models.py
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from database.models import Base, User, Repository, AnalysisJob

# Create engine for testing
try:
    engine = create_engine(TEST_DATABASE_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    pytest.skip(
        f"Could not connect to test database {TEST_DATABASE_URL}. Error: {e}",
        allow_module_level=True,
    )


@pytest.fixture(scope="session")
def setup_database():
    """Create all tables before tests run and drop them afterwards."""
    try:
        # Check connection first
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        pytest.skip(f"Test database at {TEST_DATABASE_URL} is unreachable.")

    # We are testing against a persistent DB, so don't create/drop tables
    # Base.metadata.create_all(bind=engine)

    yield

    # Drop tables after tests
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    """Provides a transactional database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_database_connection(db_session):
    """Verify basic connectivity and SQLAlchemy text queries work on Postgres."""
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_user_persistence(db_session):
    """Verify we can create and retrieve users."""
    user_id = str(uuid.uuid4())
    user = User(
        user_id=user_id,
        email=f"test_{user_id}@example.com",
        name="Test User",
        password="hashed_password",
        role="Developer",
    )
    db_session.add(user)
    db_session.commit()

    # Retrieve
    saved_user = db_session.query(User).filter(User.user_id == user_id).first()
    assert saved_user is not None
    assert saved_user.email == user.email
    assert saved_user.role == "Developer"


def test_project_creation_and_retrieval(db_session):
    """Verify repository metadata persistence."""
    repo_id = str(uuid.uuid4())
    repo = Repository(
        repo_id=repo_id, name="Test Project", url="https://github.com/test/repo"
    )
    db_session.add(repo)
    db_session.commit()

    saved_repo = (
        db_session.query(Repository).filter(Repository.repo_id == repo_id).first()
    )
    assert saved_repo is not None
    assert saved_repo.name == "Test Project"
    assert saved_repo.url == "https://github.com/test/repo"


def test_analysis_job_lifecycle(db_session):
    """Verify we can create, update, and persist JSON results for an analysis job."""
    # 1. Setup prerequisite repository
    repo_id = str(uuid.uuid4())
    repo = Repository(repo_id=repo_id, name="Lifecycle Test")
    db_session.add(repo)
    db_session.flush()

    # 2. Create Job
    job_id = str(uuid.uuid4())
    job = AnalysisJob(
        job_id=job_id, repo_id=repo_id, project_name="Lifecycle Test", status="QUEUED"
    )
    db_session.add(job)
    db_session.commit()

    # Verify creation
    saved_job = (
        db_session.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    )
    assert saved_job.status == "QUEUED"
    assert saved_job.findings == {}  # Default should be empty dict/JSON

    # 3. Update Status
    saved_job.status = "INGESTING"
    db_session.commit()

    updated_job = (
        db_session.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    )
    assert updated_job.status == "INGESTING"

    # 4. Persist complex JSON results (simulating findings)
    complex_findings = {
        "domains": [{"name": "Auth", "description": "Authentication"}],
        "capabilities": [{"id": "cap1", "name": "Login"}],
        "journeys": [],
        "gaps": [],
    }
    graph_preview = {"nodes": [{"id": "n1", "label": "auth.py"}], "edges": []}

    updated_job.status = "COMPLETED"
    updated_job.findings = complex_findings
    updated_job.graph_preview = graph_preview
    db_session.commit()

    # Verify JSON persistence
    final_job = (
        db_session.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    )
    assert final_job.status == "COMPLETED"
    assert final_job.findings["domains"][0]["name"] == "Auth"
    assert len(final_job.graph_preview["nodes"]) == 1


def test_transaction_rollback(db_session):
    """Verify that errors cause a rollback and preserve existing data integrity."""
    # Create initial state
    repo_id = str(uuid.uuid4())
    repo = Repository(repo_id=repo_id, name="Initial Name")
    db_session.add(repo)
    db_session.commit()

    # Start a nested transaction block to simulate a failure
    try:
        # Use a savepoint so we can rollback just this block without failing the test session
        with db_session.begin_nested():
            repo_to_update = (
                db_session.query(Repository)
                .filter(Repository.repo_id == repo_id)
                .first()
            )
            repo_to_update.name = "Updated Name"
            # Force an error by adding a duplicate primary key
            duplicate_repo = Repository(repo_id=repo_id, name="Duplicate")
            db_session.add(duplicate_repo)
            db_session.flush()  # This will raise IntegrityError
    except Exception:
        pass  # Expected failure

    # Because of the nested transaction (savepoint) failing, it rolls back to before the block.
    # Therefore, the name update should ALSO be rolled back.
    db_session.refresh(repo)
    assert repo.name == "Initial Name"
