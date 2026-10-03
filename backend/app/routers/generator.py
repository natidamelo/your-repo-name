from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import (
    SchedulePeriod, ScheduleDay, ShiftAssignment, ScheduleConflict, Employee, AuditLog, User
)
from app.schemas import GenerateScheduleRequest, ValidationResult, ConflictSchema
from app.core.dependencies import get_current_user, require_role
from app.engine.generator import generate_schedule_data
from app.engine.validator import validate_schedule_period

router = APIRouter(prefix="/schedules", tags=["Schedule Generator"])

@router.post("/generate")
def generate_schedule(
    request: GenerateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    # Fetch all employees from DB to map IDs
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    emp_map = {e.first_name: e.id for e in employees}

    # Run constraint generator
    ephemeral_period, validation = generate_schedule_data(
        start_date_str=request.start_date,
        duration_weeks=request.duration_weeks,
        employee_db_map=emp_map
    )

    # Format ephemeral preview data
    preview_days = []
    for d in ephemeral_period.days:
        preview_days.append({
            "date": d.date,
            "day_of_week": d.day_of_week,
            "shifts": [
                {
                    "employee_id": s.employee_id,
                    "employee_name": s.employee_name,
                    "shift_type": s.shift_type,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "lunch_start": s.lunch_start,
                    "lunch_end": s.lunch_end,
                    "primary_task": s.primary_task,
                    "secondary_task": s.secondary_task,
                    "notes": s.notes
                } for s in d.shifts
            ]
        })

    # If preview_only is True, return data immediately without database mutation
    if request.preview_only:
        return {
            "preview_mode": True,
            "start_date": ephemeral_period.start_date,
            "end_date": ephemeral_period.end_date,
            "duration_weeks": request.duration_weeks,
            "validation": validation,
            "days": preview_days
        }

    # Otherwise, commit as Draft in DB
    name = f"Schedule {ephemeral_period.start_date} - {ephemeral_period.end_date}"
    period = SchedulePeriod(
        name=name,
        start_date=ephemeral_period.start_date,
        end_date=ephemeral_period.end_date,
        duration_weeks=request.duration_weeks,
        status="draft",
        generated_by=current_user.username
    )
    db.add(period)
    db.flush()

    for d in ephemeral_period.days:
        s_day = ScheduleDay(
            schedule_period_id=period.id,
            date=d.date,
            day_of_week=d.day_of_week,
            is_weekend=(d.day_of_week in (5, 6))
        )
        db.add(s_day)
        db.flush()

        for s in d.shifts:
            emp_id = s.employee_id
            if not emp_id or emp_id == 0:
                emp = next((e for e in employees if e.first_name == s.employee_name), None)
                emp_id = emp.id if emp else None

            if emp_id:
                assignment = ShiftAssignment(
                    schedule_day_id=s_day.id,
                    employee_id=emp_id,
                    shift_type=s.shift_type,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    lunch_start=s.lunch_start,
                    lunch_end=s.lunch_end,
                    primary_task=s.primary_task,
                    secondary_task=s.secondary_task,
                    notes=s.notes
                )
                db.add(assignment)

    # Store any initial conflicts/warnings
    for c in validation["conflicts"]:
        sc = ScheduleConflict(
            schedule_period_id=period.id,
            date=c.get("date"),
            employee_name=c.get("employee_name"),
            severity=c.get("severity", "warning"),
            error_type=c.get("error_type", "CONSTRAINT"),
            message=c.get("message", ""),
            suggestion=c.get("suggestion", "")
        )
        db.add(sc)

    # Log to Audit
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="GENERATE_SCHEDULE",
        entity_type="SchedulePeriod",
        entity_id=period.id,
        old_value=None,
        new_value=f"Generated {request.duration_weeks}-week schedule: {name}",
        reason="Automated schedule generation"
    )
    db.add(audit)

    db.commit()
    db.refresh(period)

    return {
        "id": period.id,
        "name": period.name,
        "start_date": period.start_date,
        "end_date": period.end_date,
        "status": period.status,
        "validation": validation,
        "message": f"Successfully generated and saved draft schedule for {period.name}"
    }

@router.get("/{id}/validate", response_model=ValidationResult)
def validate_existing_schedule(
    id: int,
    db: Session = Depends(get_db)
):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    validation = validate_schedule_period(period)
    return validation
