from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import TaskAssignment, ShiftAssignment, Employee, Skill, EmployeeSkill, AuditLog, User
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/assignments", tags=["Task Assignments"])

class CreateTaskAssignmentRequest(BaseModel):
    shift_assignment_id: int
    task_name: str
    start_time: str
    end_time: str
    is_backup: bool = False
    notes: Optional[str] = None

@router.post("/")
def create_task_assignment(
    req: CreateTaskAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    shift = db.query(ShiftAssignment).filter(ShiftAssignment.id == req.shift_assignment_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    employee = shift.employee
    # Validate employee skill
    has_skill = False
    req_task_lower = req.task_name.lower().replace(" ", "_")
    for es in employee.skills:
        skill_code = es.skill.code.lower() if es.skill else ""
        skill_name = es.skill.name.lower() if es.skill else ""
        if req_task_lower in (skill_code, skill_name) or req.task_name.lower() in skill_name:
            has_skill = True
            break

    warning_msg = None
    if not has_skill:
        warning_msg = f"Warning: {employee.full_name} does not have registered skill for '{req.task_name}'."

    task = TaskAssignment(
        shift_assignment_id=shift.id,
        task_name=req.task_name,
        start_time=req.start_time,
        end_time=req.end_time,
        is_backup=req.is_backup,
        notes=req.notes
    )
    db.add(task)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="ASSIGN_TASK",
        entity_type="TaskAssignment",
        entity_id=shift.id,
        old_value=None,
        new_value=f"Assigned {req.task_name} ({req.start_time}-{req.end_time}) to {employee.full_name}",
        reason="Manager task assignment"
    )
    db.add(audit)
    db.commit()
    db.refresh(task)

    return {
        "id": task.id,
        "task_name": task.task_name,
        "start_time": task.start_time,
        "end_time": task.end_time,
        "is_backup": task.is_backup,
        "skill_warning": warning_msg,
        "message": f"Task assigned to {employee.full_name} successfully"
    }

@router.delete("/{task_id}")
def delete_task_assignment(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    task = db.query(TaskAssignment).filter(TaskAssignment.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    db.delete(task)
    db.commit()
    return {"message": "Task assignment removed"}
