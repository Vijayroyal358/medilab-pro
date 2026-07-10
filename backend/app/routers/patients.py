from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from app.core.db import get_db
from app.models.models import User, Patient
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import (
    get_patients_in_lab,
    get_patient,
    get_patient_by_email_in_lab,
    get_patient_by_phone_in_lab,
    create_patient_in_lab,
    update_patient_in_lab,
    delete_patient_in_lab,
    create_audit_log
)

router = APIRouter(prefix="/patients", tags=["patients"])

# Access control: Admins, Receptionists, Doctors, and Technicians can view patients.
# Only Admins, Receptionists, and Doctors can create/edit/delete.
read_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
write_roles = RoleChecker(["Lab Admin", "Receptionist", "Doctor"])

@router.get("/", response_model=List[PatientResponse])
def read_patients(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    return get_patients_in_lab(db, lab_id=current_user.lab_id, query=search)

@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    patient = get_patient(db, patient_id=patient_id, lab_id=current_user.lab_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found in this laboratory"
        )
    return patient

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    # Enforce unique email per lab
    existing_email = get_patient_by_email_in_lab(db, email=patient_in.email, lab_id=current_user.lab_id)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this email is already registered in this laboratory"
        )
        
    # Enforce unique phone per lab
    existing_phone = get_patient_by_phone_in_lab(db, phone=patient_in.phone, lab_id=current_user.lab_id)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this phone number is already registered in this laboratory"
        )
        
    patient = create_patient_in_lab(db, patient_in=patient_in, lab_id=current_user.lab_id)
    
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="CREATE_PATIENT", 
        details=f"Registered patient {patient.name} (ID: {patient.patient_id})"
    )
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    patient = get_patient(db, patient_id=patient_id, lab_id=current_user.lab_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found in this laboratory"
        )
        
    # If email is updating, check uniqueness
    if patient_update.email and patient_update.email != patient.email:
        existing = get_patient_by_email_in_lab(db, email=patient_update.email, lab_id=current_user.lab_id)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered in this lab")
            
    # If phone is updating, check uniqueness
    if patient_update.phone and patient_update.phone != patient.phone:
        existing = get_patient_by_phone_in_lab(db, phone=patient_update.phone, lab_id=current_user.lab_id)
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered in this lab")
            
    updated = update_patient_in_lab(db, db_patient=patient, patient_update=patient_update)
    
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="UPDATE_PATIENT", 
        details=f"Updated details for patient {updated.name} (ID: {updated.patient_id})"
    )
    return updated

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    patient = get_patient(db, patient_id=patient_id, lab_id=current_user.lab_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found in this laboratory"
        )
    
    name = patient.name
    pid = patient.patient_id
    delete_patient_in_lab(db, db_patient=patient)
    
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="DELETE_PATIENT", 
        details=f"Deleted patient {name} (ID: {pid})"
    )
    return None
