from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.date_time.desc()).limit(200).all()
    return logs
