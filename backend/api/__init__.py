from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.get("/status")
@limiter.limit("120/minute")
def status(request: Request):
    return {"api": "running"}
