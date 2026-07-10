from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.db import get_db
from app.core.security import get_password_hash
from app.models.models import Lab, User
from app.routers.deps import get_current_user

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

PREDEFINED_ROLES = ["Lab Admin", "Lab Owner", "Receptionist", "Technician", "Doctor"]

# ── Guards ────────────────────────────────────────────────────────────────────
def require_software_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "Software Admin":
        raise HTTPException(status_code=403, detail="Software Admin access required")
    return current_user

def require_lab_admin_or_above(current_user: User = Depends(get_current_user)):
    allowed = {"Software Admin", "Lab Admin", "Lab Owner"}
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Lab Admin or above required")
    return current_user

# ── Schemas ───────────────────────────────────────────────────────────────────
class CreateLabRequest(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    owner_name: str
    owner_email: EmailStr
    owner_phone: Optional[str] = None

class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str  # One of PREDEFINED_ROLES

class StaffResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LabSummary(BaseModel):
    id: int
    name: str
    slug: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime
    staff_count: int = 0
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────────────────────
def _slug_from_name(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

def _unique_slug(db: Session, base: str) -> str:
    slug = base
    i = 1
    while db.exec(select(Lab).where(Lab.slug == slug)).first():
        slug = f"{base}-{i}"
        i += 1
    return slug

# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/roles")
def get_predefined_roles():
    """Return the predefined staff roles."""
    return {"roles": PREDEFINED_ROLES}

@router.post("/labs", status_code=201)
def create_lab(
    payload: CreateLabRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    """Create a new lab and its first Lab Owner account."""
    slug = _unique_slug(db, _slug_from_name(payload.name))

    # Create lab
    lab = Lab(
        name=payload.name,
        slug=slug,
        address=payload.address,
        phone=payload.phone,
        email=payload.email,
        is_active=True,
    )
    db.add(lab)
    db.flush()  # get lab.id

    # Create Lab Owner user (temp password = owner email prefix + "@Lab1")
    temp_password = payload.owner_email.split("@")[0] + "@Lab1"
    owner = User(
        lab_id=lab.id,
        email=payload.owner_email,
        hashed_password=get_password_hash(temp_password),
        phone=payload.owner_phone,
        name=payload.owner_name,
        role="Lab Owner",
        is_active=True,
    )
    db.add(owner)
    db.commit()
    db.refresh(lab)

    return {
        "message": "Lab created successfully",
        "lab_id": lab.id,
        "lab_slug": lab.slug,
        "owner_email": payload.owner_email,
        "temp_password": temp_password,
    }

@router.get("/labs", response_model=List[LabSummary])
def list_labs(
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    """List all labs with staff count and owner info."""
    labs = db.exec(select(Lab)).all()
    result = []
    for lab in labs:
        staff = db.exec(select(User).where(User.lab_id == lab.id)).all()
        owner = next((u for u in staff if u.role == "Lab Owner"), None)
        result.append(LabSummary(
            id=lab.id,
            name=lab.name,
            slug=lab.slug,
            phone=lab.phone,
            email=lab.email,
            address=lab.address,
            is_active=lab.is_active,
            created_at=lab.created_at,
            staff_count=len(staff),
            owner_name=owner.name if owner else None,
            owner_email=owner.email if owner else None,
        ))
    return result

@router.get("/labs/{lab_id}/staff", response_model=List[StaffResponse])
def list_lab_staff(
    lab_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_admin_or_above)
):
    """List all staff in a lab. Software Admin sees any lab; Lab Owner sees only their own."""
    if current_user.role != "Software Admin" and current_user.lab_id != lab_id:
        raise HTTPException(status_code=403, detail="Access denied")
    staff = db.exec(select(User).where(User.lab_id == lab_id)).all()
    return staff

@router.post("/labs/{lab_id}/staff", response_model=StaffResponse, status_code=201)
def add_staff(
    lab_id: int,
    payload: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_admin_or_above)
):
    """Add a staff member to a lab."""
    if current_user.role != "Software Admin" and current_user.lab_id != lab_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if payload.role not in PREDEFINED_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {PREDEFINED_ROLES}")

    # Check duplicate email in this lab
    existing = db.exec(
        select(User).where(User.email == payload.email, User.lab_id == lab_id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists in this lab")

    # Temp password: first name + "@Staff1"
    temp_password = payload.name.split()[0] + "@Staff1"
    user = User(
        lab_id=lab_id,
        email=payload.email,
        hashed_password=get_password_hash(temp_password),
        phone=payload.phone,
        name=payload.name,
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/labs/{lab_id}/staff/{user_id}")
def update_staff(
    lab_id: int,
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_admin_or_above)
):
    """Update or deactivate a staff member."""
    if current_user.role != "Software Admin" and current_user.lab_id != lab_id:
        raise HTTPException(status_code=403, detail="Access denied")
    user = db.exec(select(User).where(User.id == user_id, User.lab_id == lab_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if "is_active" in payload:
        user.is_active = payload["is_active"]
    if "role" in payload and payload["role"] in PREDEFINED_ROLES:
        user.role = payload["role"]
    if "name" in payload:
        user.name = payload["name"]
    if "phone" in payload:
        user.phone = payload["phone"]
    db.add(user)
    db.commit()
    return {"message": "Staff updated"}
