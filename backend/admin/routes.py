from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Dict
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Admin"])


# Mock dependencies
def get_current_user():
    # In reality this would decode JWT and return user
    return {"user_id": "u-1", "role": "admin", "org_id": "org-1"}


def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required"
        )
    return user


@router.get("/users")
@limiter.limit("30/minute")
def list_users(request: Request, admin_user: dict = Depends(require_admin)):
    return {
        "users": [
            {"id": "u-1", "email": "admin@example.com", "role": "admin"},
            {"id": "u-2", "email": "dev@example.com", "role": "developer"},
        ]
    }


@router.get("/audit-logs")
@limiter.limit("30/minute")
def get_audit_logs(request: Request, admin_user: dict = Depends(require_admin)):
    return {
        "logs": [
            {"timestamp": "2026-07-26T10:00:00Z", "action": "LOGIN", "user_id": "u-1"},
            {
                "timestamp": "2026-07-26T10:05:00Z",
                "action": "TRIGGER_ANALYSIS",
                "user_id": "u-2",
            },
        ]
    }


@router.get("/system-analytics")
@limiter.limit("30/minute")
def get_system_analytics(request: Request, admin_user: dict = Depends(require_admin)):
    return {"total_jobs": 142, "active_users": 15, "avg_processing_time_sec": 124.5}


# Organization settings routes
@router.get("/org/members")
@limiter.limit("30/minute")
def get_org_members(request: Request, user: dict = Depends(get_current_user)):
    # Assuming user can see their own org members
    return {
        "org_id": user.get("org_id"),
        "members": [{"id": "u-1", "role": "owner"}, {"id": "u-2", "role": "member"}],
    }
