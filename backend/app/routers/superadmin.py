from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.db import get_db
from app.core.security import get_password_hash
from app.models.models import Lab, User, Test, Report
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
    subscription_plan: str
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
        email=payload.email.lower(),
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

@router.patch("/labs/{lab_id}")
def update_lab(
    lab_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    """Update lab fields like is_active or subscription_plan."""
    lab = db.exec(select(Lab).where(Lab.id == lab_id)).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    if "is_active" in payload:
        lab.is_active = payload["is_active"]
    if "subscription_plan" in payload and payload["subscription_plan"] in ["Trial", "Basic", "Professional", "Enterprise"]:
        lab.subscription_plan = payload["subscription_plan"]
    db.add(lab)
    db.commit()
    return {"message": "Lab updated"}

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
            subscription_plan=lab.subscription_plan,
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
        email=payload.email.lower(),
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

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    total_labs = db.exec(select(Lab)).all()
    total_staff = db.exec(select(User).where(User.role != "Patient", User.role != "Software Admin")).all()
    total_tests = db.exec(select(Test)).all()
    tests_processed = db.exec(select(Report)).all() # Mocked as number of reports
    active_services = sum(1 for lab in total_labs if lab.is_active)
    
    return {
        "total_laboratories": len(total_labs),
        "total_staff": len(total_staff),
        "total_tests": len(total_tests),
        "tests_processed": len(tests_processed),
        "active_services": active_services
    }

@router.get("/recent-staff")
def get_recent_staff(
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    # Get latest 5 staff across all labs
    staff = db.exec(select(User).where(User.role != "Patient", User.role != "Software Admin").order_by(User.created_at.desc()).limit(5)).all()
    
    result = []
    for s in staff:
        lab = db.exec(select(Lab).where(Lab.id == s.lab_id)).first()
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "role": s.role,
            "lab_name": lab.name if lab else "Unknown",
            "is_active": s.is_active,
            "created_at": s.created_at
        })
    return result

@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    # Synthesize activity from latest labs and staff
    labs = db.exec(select(Lab).order_by(Lab.created_at.desc()).limit(5)).all()
    staff = db.exec(select(User).where(User.role != "Patient", User.role != "Software Admin").order_by(User.created_at.desc()).limit(5)).all()
    
    activities = []
    for lab in labs:
        activities.append({
            "type": "lab_created",
            "title": "New laboratory registered",
            "description": lab.name,
            "timestamp": lab.created_at
        })
    for s in staff:
        lab = db.exec(select(Lab).where(Lab.id == s.lab_id)).first()
        activities.append({
            "type": "staff_added",
            "title": "Staff added",
            "description": f"{s.name} joined {lab.name if lab else 'Unknown'}",
            "timestamp": s.created_at
        })
    
    # Sort descending by timestamp and return top 5
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:5]

@router.delete("/labs/{lab_id}")
def delete_lab(
    lab_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_software_admin)
):
    """Completely delete a lab and all associated data."""
    lab = db.get(Lab, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Cascade delete associated records manually in order to satisfy FK constraints
    db.exec("DELETE FROM report WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM appointment WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM test WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM patient WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM referral_doctor WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM expense WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM audit_log WHERE lab_id = :lab_id", {"lab_id": lab_id})
    db.exec("DELETE FROM \"user\" WHERE lab_id = :lab_id", {"lab_id": lab_id})
    
    db.delete(lab)
    db.commit()
    return {"message": "Laboratory and all associated data deleted successfully"}

@router.delete("/labs/{lab_id}/staff/{user_id}")
def delete_staff(
    lab_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_admin_or_above)
):
    """Delete a staff member from a lab."""
    if current_user.role != "Software Admin" and current_user.lab_id != lab_id:
        raise HTTPException(status_code=403, detail="Access denied")
    user = db.exec(select(User).where(User.id == user_id, User.lab_id == lab_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    # Null out nullable user references in other tables
    db.exec("UPDATE report SET technician_id = NULL WHERE technician_id = :user_id", {"user_id": user_id})
    db.exec("UPDATE report SET doctor_id = NULL WHERE doctor_id = :user_id", {"user_id": user_id})
    db.exec("UPDATE audit_log SET user_id = NULL WHERE user_id = :user_id", {"user_id": user_id})
    
    db.delete(user)
    db.commit()
    return {"message": "Staff member deleted successfully"}

