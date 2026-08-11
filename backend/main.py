import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api import router as api_router
from auth.routes import router as auth_router
from repositories.routes import router as repositories_router
from reasoning_engine.routes import router as reasoning_router
from admin.routes import router as admin_router
import logging
import json
from datetime import datetime
from database.connection import engine
import database.models as models
import sentry_sdk

models.Base.metadata.create_all(bind=engine)

sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )


# Structured JSON Logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("CodeAtlas")

limiter = Limiter(key_func=get_remote_address)
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI(title="CodeAtlas API", version="0.1.0")

app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET", "local_dev_jwt_secret_12345"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Allow all origins for MVP local testing (e.g. localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Consistent HTTP Error Response Shape
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP error: {exc.status_code} {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": 400,
                "message": "Validation Error",
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Basic error alerting: explicit ALERT tag for repeated 500s or crashes
    logger.error(f"[ALERT] Internal Server Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": 500, "message": "Internal Server Error"}},
    )


app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/auth")
app.include_router(repositories_router, prefix="/repositories")
app.include_router(reasoning_router)
app.include_router(admin_router, prefix="/admin")


from sqlalchemy.orm import Session
from fastapi import Depends
from database.connection import get_db
from sqlalchemy import text
from knowledge_graph.neo4j_client import get_neo4j_client

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "ok", "version": "0.1.0", "postgres": "unknown", "neo4j": "unknown"}
    
    # Check Postgres
    try:
        db.execute(text("SELECT 1"))
        health_status["postgres"] = "ok"
    except Exception as e:
        health_status["postgres"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
        
    # Check Neo4j
    try:
        neo4j_client = get_neo4j_client()
        neo4j_client.driver.verify_connectivity()
        health_status["neo4j"] = "ok"
        neo4j_client.close()
    except Exception as e:
        health_status["neo4j"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
        
    # If both failed, return 503 instead of 200
    if health_status["status"] == "degraded" and health_status["postgres"] != "ok" and health_status["neo4j"] != "ok":
        return JSONResponse(status_code=503, content=health_status)
        
    return health_status
