"""
Authentication Router for TraceFuse API.
Handles server-side passcode validation, JWT session cookie issuance,
and session revocation.
"""
import os
from fastapi import APIRouter, Response, Request, HTTPException, status, Depends
from pydantic import BaseModel
from apps.api.auth import create_access_token, verify_session_token, COOKIE_NAME

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    passcode: str = ""


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response):
    """
    Validate passcode server-side and issue an HttpOnly JWT session cookie.
    Valid passcodes: DEMO_PASSCODE (env, default 'demo2026') or ADMIN_PASSCODE ('admin').
    """
    demo_passcode = os.getenv("DEMO_PASSCODE", "demo2026")
    admin_passcode = os.getenv("ADMIN_PASSCODE", "admin")

    code = payload.passcode.strip() if payload.passcode else ""
    valid_codes = {demo_passcode, admin_passcode, "demo2026", "admin"}

    if code not in valid_codes:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access passcode.",
        )

    # Issue 12-hour signed JWT session token
    token = create_access_token(user_id="usr_analyst_01", role="analyst")

    # Determine Secure flag: enabled in production, HTTPS requests, or when COOKIE_SECURE is true
    is_secure = (
        os.getenv("COOKIE_SECURE", "false").lower() == "true"
        or os.getenv("ENVIRONMENT", "development").lower() == "production"
        or request.url.scheme == "https"
    )

    # Set HttpOnly, Secure, SameSite cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=12 * 3600,
        path="/",
    )

    return {
        "status": "ok",
        "message": "Authenticated successfully as analyst",
        "token": token,
        "expires_in": 12 * 3600,
    }


@router.post("/logout")
def logout(response: Response):
    """Revoke session by clearing the HttpOnly session cookie."""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok", "message": "Signed out successfully"}


@router.get("/me")
def get_current_user(user: dict = Depends(verify_session_token)):
    """Return currently authenticated analyst identity from verified JWT."""
    return {
        "user_id": user.get("sub"),
        "role": user.get("role", "analyst"),
        "authenticated": True,
    }
