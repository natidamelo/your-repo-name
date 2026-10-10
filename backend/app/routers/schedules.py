from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import (
    SchedulePeriod, ScheduleDay, ShiftAssignment, TaskAssignment, ScheduleConflict, AuditLog, Employee, User
)
from app.schemas import (
    SchedulePeriodDetail, ShiftUpdateRequest, ShiftAssignmentSchema, ValidationResult
)
from app.core.dependencies import get_current_user, require_role
from app.engine.validator import validate_schedule_period

router = APIRouter(prefix="/schedules", tags=["Schedules"])

def serialize_period(period: SchedulePeriod) -> dict:
    days_data = []
    for day in sorted(period.days, key=lambda d: d.date):
        shifts_data = []
        for s in day.shifts:
            emp_name = s.employee.first_name if s.employee else "Staff"
            
            # Extract assigned tasks list (preserve all, including backup duplicates)
            task_names = []
            if s.tasks:
                for t in s.tasks:
                    if t.task_name:
                        task_names.append(t.task_name)
            if not task_names:
                if s.primary_task:
                    for pt in s.primary_task.split(","):
                        pt_c = pt.strip()
                        if pt_c and pt_c not in task_names:
                            task_names.append(pt_c)
                if s.secondary_task:
                    for st in s.secondary_task.split(","):
                        st_c = st.strip()
                        if st_c and st_c not in task_names:
                            task_names.append(st_c)

            emp_skills = []
            if s.employee and s.employee.skills:
                for es in s.employee.skills:
                    if es.skill and es.skill.name and es.skill.name not in emp_skills:
                        emp_skills.append(es.skill.name)

            shifts_data.append({
                "id": s.id,
                "employee_id": s.employee_id,
                "employee_name": emp_name,
                "employee_position": s.employee.position if s.employee else None,
                "shift_type": s.shift_type,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "lunch_start": s.lunch_start,
                "lunch_end": s.lunch_end,
                "primary_task": s.primary_task,
                "secondary_task": s.secondary_task,
                "assigned_tasks": task_names,
                "skills": emp_skills,
                "notes": s.notes,
                "tasks": [
                    {
                        "id": t.id,
                        "task_name": t.task_name,
                        "start_time": t.start_time,
                        "end_time": t.end_time,
                        "is_backup": t.is_backup,
                        "notes": t.notes
                    } for t in s.tasks
                ]
            })
        days_data.append({
            "id": day.id,
            "date": day.date,
            "day_of_week": day.day_of_week,
            "is_weekend": day.is_weekend,
            "shifts": shifts_data
        })

    conflicts_data = [
        {
            "id": c.id,
            "date": c.date,
            "employee_id": c.employee_id,
            "employee_name": c.employee_name,
            "severity": c.severity,
            "error_type": c.error_type,
            "message": c.message,
            "suggestion": c.suggestion
        } for c in period.conflicts
    ]

    return {
        "id": period.id,
        "name": period.name,
        "start_date": period.start_date,
        "end_date": period.end_date,
        "duration_weeks": period.duration_weeks,
        "status": period.status,
        "generated_by": period.generated_by,
        "created_at": period.created_at,
        "updated_at": period.updated_at,
        "days": days_data,
        "conflicts": conflicts_data
    }

@router.get("/")
def list_schedules(db: Session = Depends(get_db)):
    periods = db.query(SchedulePeriod).order_by(SchedulePeriod.start_date.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "duration_weeks": p.duration_weeks,
            "status": p.status,
            "generated_by": p.generated_by,
            "created_at": p.created_at
        } for p in periods
    ]

@router.get("/{id}", response_model=SchedulePeriodDetail)
def get_schedule(id: int, db: Session = Depends(get_db)):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return serialize_period(period)

@router.put("/shifts/{shift_id}")
def update_shift(
    shift_id: int,
    update_in: ShiftUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    shift = db.query(ShiftAssignment).filter(ShiftAssignment.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    old_summary = f"{shift.shift_type} ({shift.start_time or ''}-{shift.end_time or ''})"
    
    # Apply changes
    shift.shift_type = update_in.shift_type
    shift.start_time = update_in.start_time
    shift.end_time = update_in.end_time
    shift.lunch_start = update_in.lunch_start
    shift.lunch_end = update_in.lunch_end
    if update_in.notes is not None:
        shift.notes = update_in.notes

    if update_in.task_times is not None and len(update_in.task_times) > 0:
        # New path: frontend sends full task_times list (supports duplicates + is_backup)
        # Derive assigned_tasks (unique names for primary/secondary fields)
        seen_names: list = []
        for tt in update_in.task_times:
            if tt.task_name not in seen_names:
                seen_names.append(tt.task_name)
        shift.primary_task = seen_names[0] if len(seen_names) > 0 else None
        shift.secondary_task = seen_names[1] if len(seen_names) > 1 else None

        # Replace ALL TaskAssignment records using task_times directly
        db.query(TaskAssignment).filter(TaskAssignment.shift_assignment_id == shift.id).delete()
        for tt in update_in.task_times:
            db.add(TaskAssignment(
                shift_assignment_id=shift.id,
                task_name=tt.task_name,
                start_time=tt.start_time,
                end_time=tt.end_time,
                is_backup=tt.is_backup
            ))

    elif update_in.assigned_tasks is not None:
        # Fallback path: just task names without times
        clean_tasks = [t.strip() for t in update_in.assigned_tasks if t and t.strip()]
        shift.primary_task = clean_tasks[0] if len(clean_tasks) > 0 else None
        shift.secondary_task = clean_tasks[1] if len(clean_tasks) > 1 else None

        db.query(TaskAssignment).filter(TaskAssignment.shift_assignment_id == shift.id).delete()
        for t_name in clean_tasks:
            db.add(TaskAssignment(
                shift_assignment_id=shift.id,
                task_name=t_name,
                start_time=shift.start_time or "08:00",
                end_time=shift.end_time or "17:00",
                is_backup=False
            ))

    else:
        if update_in.primary_task is not None:
            shift.primary_task = update_in.primary_task
        if update_in.secondary_task is not None:
            shift.secondary_task = update_in.secondary_task

    new_summary = f"{shift.shift_type} ({shift.start_time or ''}-{shift.end_time or ''})"

    emp_name = shift.employee.full_name if shift.employee else f"Employee #{shift.employee_id}"

    # Log to AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="UPDATE_SHIFT",
        entity_type="ShiftAssignment",
        entity_id=shift.id,
        old_value=f"{emp_name} was {old_summary}",
        new_value=f"{emp_name} changed to {new_summary}",
        reason=update_in.reason or "Manager manual adjustment"
    )
    db.add(audit)
    db.flush()

    # Re-validate parent schedule period
    period = shift.schedule_day.schedule_period
    validation = validate_schedule_period(period, db=db)

    # Replace stored conflicts
    db.query(ScheduleConflict).filter(ScheduleConflict.schedule_period_id == period.id).delete()
    for c in validation["conflicts"]:
        sc = ScheduleConflict(
            schedule_period_id=period.id,
            date=c.get("date"),
            employee_name=c.get("employee_name"),
            severity=c.get("severity", "critical"),
            error_type=c.get("error_type", "VALIDATION_ERROR"),
            message=c.get("message", ""),
            suggestion=c.get("suggestion", "")
        )
        db.add(sc)

    db.commit()
    return {"message": "Shift updated successfully", "validation": validation}

@router.post("/{id}/publish")
def publish_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Run validation check
    validation = validate_schedule_period(period, db=db)
    if validation["critical_errors"] > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Cannot publish schedule: {validation['critical_errors']} critical conflicts found.",
                "conflicts": validation["conflicts"]
            }
        )

    period.status = "published"
    
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="PUBLISH_SCHEDULE",
        entity_type="SchedulePeriod",
        entity_id=period.id,
        old_value="draft",
        new_value="published",
        reason="Manager published verified schedule"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Schedule '{period.name}' published successfully"}

@router.delete("/{id}")
def delete_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")
    name = period.name
    db.delete(period)
    db.commit()
    return {"message": f"Schedule '{name}' deleted successfully"}


@router.patch("/{id}")
def update_schedule_meta(
    id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Rename a schedule or change its status (draft/published)."""
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if "name" in data and data["name"]:
        period.name = data["name"]
    if "status" in data and data["status"] in ("draft", "published"):
        period.status = data["status"]
    db.commit()
    return {"message": "Schedule updated", "id": period.id, "name": period.name, "status": period.status}


@router.post("/create-manual")
def create_manual_schedule(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Create a blank manual schedule without AI generation."""
    from app.models import SchedulePeriod as SP, ScheduleDay as SD, ShiftAssignment as SA
    import datetime

    start_str = data.get("start_date")
    duration_weeks = int(data.get("duration_weeks", 2))
    schedule_name = data.get("name", f"Manual Schedule")

    try:
        start_dt = datetime.date.fromisoformat(start_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid start_date format (YYYY-MM-DD required)")

    end_dt = start_dt + datetime.timedelta(weeks=duration_weeks) - datetime.timedelta(days=1)

    period = SP(
        name=schedule_name,
        start_date=start_str,
        end_date=str(end_dt),
        duration_weeks=duration_weeks,
        status="draft",
        generated_by=current_user.username
    )
    db.add(period)
    db.flush()

    # Create days
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    for i in range(duration_weeks * 7):
        day_dt = start_dt + datetime.timedelta(days=i)
        day = SD(
            schedule_period_id=period.id,
            date=str(day_dt),
            day_of_week=day_dt.weekday(),
            is_weekend=(day_dt.weekday() >= 5)
        )
        db.add(day)
        db.flush()
        # Add blank OFF shifts for each employee
        for emp in employees:
            shift = SA(
                schedule_day_id=day.id,
                employee_id=emp.id,
                shift_type="OFF",
                primary_task="Call Center"
            )
            db.add(shift)

    db.commit()
    db.refresh(period)
    return {"message": f"Manual schedule '{schedule_name}' created", "id": period.id}
