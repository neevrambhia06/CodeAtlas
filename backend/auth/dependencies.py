from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth_handler import decode_jwt
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

from database.connection import SessionLocal
from database.models import AuditLog


def log_audit_event(user_id: str, action: str, details: dict = None):
    try:
        db = SessionLocal()
        new_log = AuditLog(user_id=user_id, action=action, details=details or {})
        db.add(new_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
    finally:
        db.close()
    logger.info(f"AUDIT_LOG - User: {user_id}, Action: {action}, Details: {details}")


class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        request: Request,
        credentials: HTTPAuthorizationCredentials = Security(security),
    ):
        token = credentials.credentials
        payload = decode_jwt(token)
        if not payload:
            log_audit_event(
                "Anonymous", "permission-denied", {"reason": "Invalid or expired token"}
            )
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_role = payload.get("role")
        user_id = payload.get("user_id")

        if user_role not in self.allowed_roles:
            log_audit_event(
                user_id,
                "permission-denied",
                {"reason": "Insufficient role", "required": self.allowed_roles},
            )
            raise HTTPException(status_code=403, detail="Operation not permitted")

        request.state.user = payload
        return payload
