from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from app.core.db import get_db
from app.models.models import User
from app.schemas.schemas import AppointmentCreate, AppointmentResponse
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import (
    get_appointments_in_lab,
    create_appointment_in_lab,
    update_appointment_status,
    create_audit_log
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

read_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
write_roles = RoleChecker(["Lab Admin", "Receptionist", "Doctor"])

@router.get("/", response_model=List[AppointmentResponse])
def read_appointments(
    date: str = None,  # Optional filter by date (YYYY-MM-DD)
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    return get_appointments_in_lab(db, lab_id=current_user.lab_id, date_str=date)

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def schedule_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    appt = create_appointment_in_lab(db, appt_in=appt_in, lab_id=current_user.lab_id)
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="SCHEDULE_APPOINTMENT", 
        details=f"Scheduled appointment for Patient ID {appt.patient_id} on {appt.appointment_date}. Queue #: {appt.queue_number}"
    )
    return appt

@router.put("/{appt_id}/status", response_model=AppointmentResponse)
def update_status(
    appt_id: int,
    status: str,  # "Scheduled", "In-Progress", "Completed", "Cancelled"
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    if status not in ["Scheduled", "In-Progress", "Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid appointment status")
        
    appt = update_appointment_status(db, appt_id=appt_id, lab_id=current_user.lab_id, status=status)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found in this laboratory")
        
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="UPDATE_APPOINTMENT_STATUS", 
        details=f"Updated status of appointment ID {appt_id} to {status}"
    )
    return appt
