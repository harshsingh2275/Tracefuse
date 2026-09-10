"""
Authentication & Session Management for TraceFuse API.
Provides JWT-based session token creation, cookie management,
and a reusable FastAPI dependency for route protection.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import jwt
from fastapi import Request, HTTPException, status

JWT_SECRET = os.getenv("JWT_SECRET", "tracefuse-super-secret-jwt-key-for-investigator-session-auth-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12
COOKIE_NAME = "tracefuse_jwt"


def create_access_token(user_id: str = "usr_analyst_01", role: str = "analyst") -> str:
    """Generate a signed HS256 JWT valid for 12 hours."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_session_token(request: Request) -> Dict[str, Any]:
    """
    Reusable FastAPI dependency that verifies the JWT session token.
    Extracts from HttpOnly cookie first, with Authorization: Bearer fallback for curl/scripts.
    Raises HTTPException 401 if missing, expired, or invalid.
    """
    token: Optional[str] = request.cookies.get(COOKIE_NAME)

    if not token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
