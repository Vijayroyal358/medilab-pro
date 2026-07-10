from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.core.db import get_db
from app.models.models import User, ReferralDoctor, Test, Patient
from app.schemas.schemas import ReferralDoctorCreate, ReferralDoctorResponse, ReferralDoctorUpdate
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import (
    get_referral_doctors,
    get_referral_doctor,
    create_referral_doctor,
    update_referral_doctor,
    delete_referral_doctor,
    create_audit_log
)

router = APIRouter(prefix="/referrals", tags=["referrals"])

staff_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
admin_roles = RoleChecker(["Lab Admin"])

@router.get("/", response_model=List[ReferralDoctorResponse])
def read_referrals(
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    return get_referral_doctors(db, lab_id=current_user.lab_id)

@router.get("/{doctor_id}", response_model=ReferralDoctorResponse)
def read_referral_by_id(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    doc = get_referral_doctor(db, doctor_id=doctor_id, lab_id=current_user.lab_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return doc

@router.post("/", response_model=ReferralDoctorResponse, status_code=status.HTTP_201_CREATED)
def register_referral_doctor(
    doc_in: ReferralDoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_roles)
):
    doc = create_referral_doctor(db, doc_in=doc_in, lab_id=current_user.lab_id)
    create_audit_log(
        db,
        lab_id=current_user.lab_id,
        user_id=current_user.id,
        action="CREATE_REFERRAL_DOCTOR",
        details=f"Registered referral doctor {doc.name} (commission: {doc.commission_percentage}%)"
    )
    return doc

@router.put("/{doctor_id}", response_model=ReferralDoctorResponse)
def modify_referral_doctor(
    doctor_id: int,
    doc_up: ReferralDoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_roles)
):
    doc = get_referral_doctor(db, doctor_id=doctor_id, lab_id=current_user.lab_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    updated = update_referral_doctor(db, db_doc=doc, doc_up=doc_up)
    create_audit_log(
        db,
        lab_id=current_user.lab_id,
        user_id=current_user.id,
        action="UPDATE_REFERRAL_DOCTOR",
        details=f"Updated referral doctor {updated.name}"
    )
    return updated

@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_referral_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_roles)
):
    doc = get_referral_doctor(db, doctor_id=doctor_id, lab_id=current_user.lab_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    name = doc.name
    delete_referral_doctor(db, db_doc=doc)
    create_audit_log(
        db,
        lab_id=current_user.lab_id,
        user_id=current_user.id,
        action="DELETE_REFERRAL_DOCTOR",
        details=f"Deleted referral doctor {name}"
    )
    return None

@router.get("/{doctor_id}/business")
def get_doctor_referred_business(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    doc = get_referral_doctor(db, doctor_id=doctor_id, lab_id=current_user.lab_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
        
    # Get all tests linked to this doctor
    tests = db.exec(
        select(Test)
        .where(Test.lab_id == current_user.lab_id, Test.referral_doctor_id == doctor_id)
    ).all()
    
    total_net = 0.0
    total_commission = 0.0
    cases_list = []
    
    for t in tests:
        pat = db.get(Patient, t.patient_id)
        discount_val = t.discount
        if t.discount_type == "percentage":
            discount_val = (t.price * t.discount / 100.0)
        net = t.price - discount_val + t.tax
        comm = (t.price - discount_val) * doc.commission_percentage / 100.0
        
        total_net += net
        total_commission += comm
        
        cases_list.append({
            "invoice_number": t.invoice_number,
            "patient_name": pat.name if pat else f"Patient #{t.patient_id}",
            "test_name": t.test_name,
            "net_amount": net,
            "commission": comm,
            "date": t.created_at.strftime("%Y-%m-%d")
        })
        
    return {
        "doctor_name": doc.name,
        "commission_percentage": doc.commission_percentage,
        "cases_referred": len(tests),
        "total_business": total_net,
        "total_commission": total_commission,
        "cases": cases_list
    }
