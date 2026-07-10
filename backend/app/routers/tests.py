from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from app.core.db import get_db
from app.models.models import User
from app.schemas.schemas import TestCreate, TestResponse, TestUpdate
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import (
    get_tests_in_lab,
    create_test_in_lab,
    update_test_payment_status,
    create_audit_log
)

router = APIRouter(prefix="/tests", tags=["tests"])

# Roles: Admins, Receptionists, Doctors, Technicians can view tests
# Admins, Receptionists can register tests and update payments
read_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
write_roles = RoleChecker(["Lab Admin", "Receptionist"])

@router.get("/", response_model=List[TestResponse])
def read_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    return get_tests_in_lab(db, lab_id=current_user.lab_id)

@router.post("/", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def register_test(
    test_in: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    test = create_test_in_lab(db, test_in=test_in, lab_id=current_user.lab_id)
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="REGISTER_TEST", 
        details=f"Registered test '{test.test_name}' for Patient ID {test.patient_id}. Invoice: {test.invoice_number}"
    )
    return test

@router.put("/{test_id}/payment", response_model=TestResponse)
def update_payment(
    test_id: int,
    payment_status: str,  # "Pending", "Paid", "Canceled"
    db: Session = Depends(get_db),
    current_user: User = Depends(write_roles)
):
    if payment_status not in ["Pending", "Paid", "Canceled"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'Pending', 'Paid', or 'Canceled'")
        
    test = update_test_payment_status(db, test_id=test_id, lab_id=current_user.lab_id, status=payment_status)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found in this laboratory")
        
    create_audit_log(
        db, 
        lab_id=current_user.lab_id, 
        user_id=current_user.id, 
        action="UPDATE_PAYMENT", 
        details=f"Updated payment status of Invoice {test.invoice_number} to {payment_status}"
    )
    return test
