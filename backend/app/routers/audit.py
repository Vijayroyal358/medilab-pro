from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List, Any

from app.core.db import get_db
from app.models.models import User, AuditLog
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import get_audit_logs_in_lab

router = APIRouter(prefix="/audit", tags=["audit"])

admin_roles = RoleChecker(["Lab Admin"])

@router.get("/")
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_roles)
):
    # Fetch logs with joined user names
    from sqlmodel import select
    stmt = (
        select(AuditLog, User.name)
        .join(User, AuditLog.user_id == User.id, isouter=True)
        .where(AuditLog.lab_id == current_user.lab_id)
        .order_by(AuditLog.created_at.desc())
    )
    results = db.exec(stmt).all()
    
    logs_out = []
    for log, u_name in results:
        logs_out.append({
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "user_name": u_name or "System",
            "created_at": log.created_at
        })
    return logs_out
