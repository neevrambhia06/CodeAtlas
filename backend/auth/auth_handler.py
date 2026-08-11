import time
import jwt
from typing import Dict
import os

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set. Refusing to start.")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def sign_jwt(user_id: str, role: str) -> Dict[str, str]:
    payload = {
        "user_id": user_id,
        "role": role,
        "expires": time.time() + 3600,  # 1 hour
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"access_token": token}


def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return None
