from datetime import timedelta, datetime
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from jose import jwt, JWTError

from app.core.config import settings
from app.routers.deps import get_db, get_current_user
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.models import User, Lab, AuditLog, StaffOTP
from app.schemas.schemas import (
    UserLogin, TokenResponse, TokenRefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    GoogleLoginRequest, OTPSendRequest, OTPVerifyRequest
)
from app.crud.crud import get_lab_by_slug, create_audit_log

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/verify-slug")
def verify_slug(slug: str, db: Session = Depends(get_db)):
    print(f"VERIFY SLUG CALLED WITH SLUG: '{slug}'")
    all_labs = db.exec(select(Lab)).all()
    print("ALL LABS IN DB ACCORDING TO SESSION:", [(l.id, l.slug) for l in all_labs])
    lab = get_lab_by_slug(db, slug)
    if not lab:
        raise HTTPException(
            status_code=404,
            detail="Laboratory tenant not found"
        )
    return {"status": "ok", "lab_name": lab.name, "lab_slug": lab.slug}

@router.post("/login", response_model=TokenResponse)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db)
):
    # Look up user by email globally — lab is derived from user record
    user = db.exec(select(User).where(User.email == user_in.email.lower())).first()

    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")

    lab = db.get(Lab, user.lab_id) if user.lab_id else None

    access_token = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    refresh_token = create_refresh_token(subject=user.id, role=user.role, lab_id=user.lab_id)

    if user.role != "Software Admin":
        create_audit_log(db, lab_id=user.lab_id, user_id=user.id, action="LOGIN", details=f"User {user.name} logged in successfully")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user.role,
        name=user.name,
        lab_id=user.lab_id or 0,
        lab_name=lab.name if lab else "MediLabs Platform",
    )

@router.post("/login-oauth2")
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Swagger-friendly OAuth2 login (falls back to default lab or searches first match)
    user = db.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )
    
    lab = db.get(Lab, user.lab_id)
    access_token = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_in: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    payload = decode_token(refresh_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.exec(select(User).where(User.id == int(user_id))).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    lab = db.get(Lab, user.lab_id)
    new_access = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    new_refresh = create_refresh_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "lab_id": user.lab_id,
        "lab_name": lab.name if lab else "Unknown Lab"
    }

@router.post("/forgot-password")
def forgot_password(
    forgot_in: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    lab = get_lab_by_slug(db, forgot_in.lab_slug)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab slug not found")
        
    user = db.exec(select(User).where(User.email == forgot_in.email, User.lab_id == lab.id)).first()
    if not user:
        # Prevent user enumeration by returning success regardless
        return {"message": "If email exists in our records, a reset link will be sent."}
    
    # In production, send a secure token via email
    # For Phase 1, return a mock token in details for demonstration
    mock_reset_token = jwt.encode(
        {"sub": str(user.id), "type": "reset", "exp": datetime.utcnow() + timedelta(minutes=15)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # We will log it so we can see it in testing
    create_audit_log(
        db, 
        lab_id=lab.id, 
        user_id=user.id, 
        action="FORGOT_PASSWORD_REQUEST", 
        details=f"Password reset requested. Demo Token: {mock_reset_token}"
    )
    
    return {
        "message": "Password reset link generated.",
        "demo_token": mock_reset_token # Exposing this ONLY for Phase 1 testing/demo in the frontend
    }

@router.post("/reset-password")
def reset_password(
    reset_in: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(reset_in.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Expired or invalid token")
        
    user = db.exec(select(User).where(User.id == int(user_id))).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(reset_in.new_password)
    db.add(user)
    db.commit()
    
    create_audit_log(
        db, 
        lab_id=user.lab_id, 
        user_id=user.id, 
        action="PASSWORD_RESET_SUCCESS", 
        details="Password reset successfully"
    )
    return {"message": "Password updated successfully."}


# ─── Google OAuth Login ──────────────────────────────────────────────────────
@router.post("/google", response_model=TokenResponse)
def google_login(
    payload: GoogleLoginRequest,
    lab_slug: str,
    db: Session = Depends(get_db)
):
    """
    Verifies a Google ID token from the frontend Sign-in button.
    Checks that the verified email belongs to an active staff member in the given lab.
    Returns JWT tokens — same as email/password login.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured on this server. Please set GOOGLE_CLIENT_ID."
        )

    # Verify token with Google (free — uses google-auth library, no external API charges)
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
        id_info = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in Google token")

    # Resolve lab tenant
    lab = get_lab_by_slug(db, lab_slug)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory tenant not found")

    # Find staff user in this lab by Google email
    user = db.exec(
        select(User).where(User.email == email, User.lab_id == lab.id, User.is_active == True)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active staff account found for this Google email in this laboratory."
        )

    # Issue JWT
    access_token = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    refresh_token = create_refresh_token(subject=user.id, role=user.role, lab_id=user.lab_id)

    create_audit_log(
        db, lab_id=user.lab_id, user_id=user.id,
        action="LOGIN_GOOGLE",
        details=f"User {user.name} logged in via Google OAuth"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "lab_id": user.lab_id,
        "lab_name": lab.name
    }


# ─── Change Own Password ─────────────────────────────────────────────────────
@router.patch("/me/password")
def change_own_password(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow any authenticated user to change their own password."""
    old_password = payload.get("old_password", "")
    new_password = payload.get("new_password", "")

    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Both old and new password are required")

    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    from app.core.security import get_password_hash
    current_user.hashed_password = get_password_hash(new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully"}
# ─── Mobile OTP — Send ──────────────────────────────────────────────────────
@router.post("/otp/send")
def otp_send(
    payload: OTPSendRequest,
    lab_slug: str,
    db: Session = Depends(get_db)
):
    """
    Sends an OTP to a staff member's phone number.
    In dev mode: logs the OTP to the backend console (no SMS cost).
    In production: replace the print() with an SMS gateway call.
    """
    lab = get_lab_by_slug(db, lab_slug)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory tenant not found")

    # Verify this phone belongs to an active staff member in this lab
    user = db.exec(
        select(User).where(User.phone == payload.phone, User.lab_id == lab.id, User.is_active == True)
    ).first()

    if not user:
        # Prevent phone enumeration — always return success message
        return {"message": "OTP sent if number is registered."}

    # Generate 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Store in DB (overwrite any existing OTP for this phone)
    existing = db.exec(select(StaffOTP).where(StaffOTP.phone == payload.phone)).first()
    if existing:
        existing.otp = otp_code
        existing.expires_at = expires_at
        db.add(existing)
    else:
        db.add(StaffOTP(phone=payload.phone, otp=otp_code, expires_at=expires_at))
    db.commit()

    # DEV MODE: Print OTP to backend console
    # PRODUCTION: Replace this with your SMS gateway (e.g., Twilio, MSG91, Fast2SMS)
    print(f"\n{'='*50}")
    print(f"  📱 OTP FOR {payload.phone}: {otp_code}")
    print(f"  Valid for 5 minutes. Lab: {lab.name}")
    print(f"{'='*50}\n")

    return {"message": "OTP sent if number is registered."}


# ─── Mobile OTP — Verify ────────────────────────────────────────────────────
@router.post("/otp/verify", response_model=TokenResponse)
def otp_verify(
    payload: OTPVerifyRequest,
    lab_slug: str,
    db: Session = Depends(get_db)
):
    """
    Verifies the OTP and issues JWT tokens for the matching staff member.
    """
    lab = get_lab_by_slug(db, lab_slug)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory tenant not found")

    # Fetch stored OTP
    stored = db.exec(
        select(StaffOTP).where(StaffOTP.phone == payload.phone)
    ).first()

    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested for this number")

    if datetime.utcnow() > stored.expires_at:
        db.delete(stored)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if stored.otp != payload.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    # OTP valid — find the staff user
    user = db.exec(
        select(User).where(User.phone == payload.phone, User.lab_id == lab.id, User.is_active == True)
    ).first()

    if not user:
        raise HTTPException(status_code=403, detail="Staff account not found")

    # Clean up used OTP
    db.delete(stored)
    db.commit()

    # Issue JWT
    access_token = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    refresh_token = create_refresh_token(subject=user.id, role=user.role, lab_id=user.lab_id)

    create_audit_log(
        db, lab_id=user.lab_id, user_id=user.id,
        action="LOGIN_OTP",
        details=f"User {user.name} logged in via Mobile OTP"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "lab_id": user.lab_id,
        "lab_name": lab.name
    }

