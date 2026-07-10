from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from typing import List

from app.core.db import get_db
from app.models.models import User, Expense
from app.schemas.schemas import ExpenseCreate, ExpenseResponse
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import get_expenses_in_lab, create_expense_in_lab, create_audit_log

router = APIRouter(prefix="/expenses", tags=["expenses"])

staff_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
admin_roles = RoleChecker(["Lab Admin"])

@router.get("/", response_model=List[ExpenseResponse])
def read_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    return get_expenses_in_lab(db, lab_id=current_user.lab_id)

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def record_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_roles)
):
    exp = create_expense_in_lab(db, exp_in=exp_in, lab_id=current_user.lab_id)
    create_audit_log(
        db,
        lab_id=current_user.lab_id,
        user_id=current_user.id,
        action="RECORD_EXPENSE",
        details=f"Recorded expense of ${exp.amount} for: {exp.description} (Category: {exp.category})"
    )
    return exp
