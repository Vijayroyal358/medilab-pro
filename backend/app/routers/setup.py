from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Optional
from pydantic import BaseModel

from app.core.db import get_db
from app.models.models import Lab, User
from app.routers.deps import get_current_user

router = APIRouter(prefix="/setup", tags=["setup"])

class LabUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    google_review_url: Optional[str] = None
    logo_path: Optional[str] = None

class LabResponse(BaseModel):
    id: int
    name: str
    slug: str
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    google_review_url: Optional[str] = None
    logo_path: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/lab", response_model=LabResponse)
def read_lab_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.exec(select(Lab).where(Lab.id == current_user.lab_id)).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab

@router.put("/lab", response_model=LabResponse)
def update_lab_setup(
    lab_in: LabUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.exec(select(Lab).where(Lab.id == current_user.lab_id)).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Update lab fields
    update_data = lab_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lab, key, value)
    
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab
