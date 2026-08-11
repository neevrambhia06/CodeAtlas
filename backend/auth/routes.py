from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from .auth_handler import sign_jwt
from .dependencies import log_audit_event
import uuid
from passlib.context import CryptContext
from database.connection import get_db
from database.models import User
from sqlalchemy.orm import Session
import hashlib
import base64
import time
import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from fastapi.responses import RedirectResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Google OAuth Setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID', 'dummy_client_id'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET', 'dummy_secret'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Simple in-memory rate limiter for emails to supplement IP rate limiting
email_login_attempts = {}


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "Developer"


def get_password_hash(password: str) -> str:
    sha256_hash = base64.b64encode(
        hashlib.sha256(password.encode("utf-8")).digest()
    ).decode("utf-8")
    return pwd_context.hash(sha256_hash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    sha256_hash = base64.b64encode(
        hashlib.sha256(plain_password.encode("utf-8")).digest()
    ).decode("utf-8")
    return pwd_context.verify(sha256_hash, hashed_password)


@router.post("/register")
@limiter.limit("10/minute")
def register(request: Request, user: UserRegisterSchema, db: Session = Depends(get_db)):
    normalized_email = user.email.strip().lower()

    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)

    new_user = User(
        user_id=user_id,
        email=normalized_email,
        name=user.name,
        password=hashed_password,
        role=user.role,
    )
    db.add(new_user)
    db.commit()

    log_audit_event(user_id, "register", {"email": normalized_email})
    return {"message": "User created successfully"}


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, user: UserLoginSchema, db: Session = Depends(get_db)):
    normalized_email = user.email.strip().lower()

    # Custom rate limiting per email (max 5 attempts per 5 minutes)
    now = time.time()
    attempts = [
        t for t in email_login_attempts.get(normalized_email, []) if now - t < 300
    ]
    if len(attempts) >= 5:
        raise HTTPException(
            status_code=429, detail="Too many login attempts for this email"
        )
    attempts.append(now)
    email_login_attempts[normalized_email] = attempts

    db_user = db.query(User).filter(User.email == normalized_email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        log_audit_event(
            "Anonymous",
            "permission-denied",
            {"email": normalized_email, "alert": "Failed login attempt"},
        )
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    # Clear attempts on success
    if normalized_email in email_login_attempts:
        del email_login_attempts[normalized_email]

    token_data = sign_jwt(db_user.user_id, db_user.role)
    log_audit_event(db_user.user_id, "login", {"email": normalized_email})

    return {
        "access_token": token_data["access_token"],
        "token_type": "bearer",
        "role": db_user.role,
        "name": db_user.name or "",
        "email": db_user.email or "",
    }


@router.get("/google/login")
async def google_login(request: Request):
    # redirect_uri must match the callback route
    # Using the request URL to dynamically generate callback
    redirect_uri = request.url_for('google_callback')
    # If the app is behind proxy or we want to hardcode for local:
    if os.getenv("ENV") == "production":
        # Force https in production if needed, but request.url_for should handle it with proper proxy headers
        pass
    return await oauth.google.authorize_redirect(request, str(redirect_uri))


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authorization failed: {str(e)}")
    
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")
        
    if not user_info.get("email_verified"):
        raise HTTPException(status_code=400, detail="Unverified email")
        
    normalized_email = user_info['email'].strip().lower()
    
    db_user = db.query(User).filter(User.email == normalized_email).first()
    if not db_user:
        # Create new user
        user_id = str(uuid.uuid4())
        # The password needs to be set to a dummy value that can't be cracked
        db_user = User(
            user_id=user_id,
            email=normalized_email,
            name=user_info.get('name', ''),
            password='OAUTH_NO_PASSWORD',
            role='Developer',
            auth_provider='google'
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        log_audit_event(user_id, "register", {"email": normalized_email, "provider": "google"})
    else:
        # Link existing account if not already google
        if getattr(db_user, 'auth_provider', 'email') == 'email':
            db_user.auth_provider = 'google'
            db.commit()

    token_data = sign_jwt(db_user.user_id, db_user.role)
    log_audit_event(db_user.user_id, "login", {"email": normalized_email, "provider": "google"})
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # We redirect the user back to the frontend dashboard.
    # To pass the token and user details to frontend without cookies, we pass them as URL hash parameters.
    # The frontend will parse them on the dashboard and store them.
    hash_params = (
        f"#access_token={token_data['access_token']}"
        f"&role={db_user.role}"
        f"&name={db_user.name or ''}"
        f"&email={db_user.email or ''}"
    )
    return RedirectResponse(url=f"{frontend_url}/dashboard{hash_params}")
