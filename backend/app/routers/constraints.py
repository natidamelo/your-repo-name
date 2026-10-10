from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import SystemConstraint, User, AuditLog
from app.schemas import (
    SystemConstraintCreate, SystemConstraintUpdate, SystemConstraintResponse
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/constraints", tags=["System Constraints"])

DEFAULT_CONSTRAINTS = [
    {
        "rule_key": "hebron_beti_leads",
        "title": "Hebron & Beti",
        "category": "LEAD_ROTATION",
        "staff_names": "Hebron, Beti",
        "description": "Rotation leads with 1.5 days off (Saturday AM/PM alternation).",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "sunday_lead_alternation",
        "title": "Sunday Alternation",
        "category": "SUNDAY_SQUAD",
        "staff_names": "Hebron, Beti",
        "description": "Bi-weekly lead rotation (worker gets Monday OFF).",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "sunday_squad_5",
        "title": "Sunday Squad",
        "category": "SUNDAY_SQUAD",
        "staff_names": "Yabsera N, Biruk, Tirsit, Feruza, Hermela, Shalom, Rediet, Luam",
        "description": "Exactly 5 staff on duty; 2–3 get Monday recovery OFF.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "feruza_days_off",
        "title": "Feruza",
        "category": "DAYS_OFF",
        "staff_names": "Feruza, Beti",
        "description": "1.5 days off, tied to Beti Saturday/Sunday schedule.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "early_morning_0800",
        "title": "Early Morning (08:00)",
        "category": "EARLY_MORNING",
        "staff_names": "Hebron, Shalom, Rediet, Tirsit",
        "description": "Hebron Mon–Fri always; Shalom, Rediet, Tirsit always.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "yordi_obsa_sunday_off",
        "title": "Yordi & Obsa",
        "category": "DAYS_OFF",
        "staff_names": "Yordi, Obsa",
        "description": "Work Monday–Saturday; strictly Sunday DAY OFF.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "standard_two_days_off",
        "title": "Rest of Staff",
        "category": "DAYS_OFF",
        "staff_names": "",
        "description": "Standard 2 full days off per week.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "gds_tasks_policy",
        "title": "GDS Tasks",
        "category": "TASK_ROTATION",
        "staff_names": "Hebron, Beti, Feruza, Biruk, Tirsit, Rediet, Hermela, Shalom, Yabsera N, Yeab",
        "description": "Telegram/ELMS/Q/E reserved for GDS staff; Yabsera N excluded from Telegram.",
        "is_active": True,
        "is_system": True
    },
    {
        "rule_key": "rotational_tasks_2839",
        "title": "2839 & Follow-up",
        "category": "TASK_ROTATION",
        "staff_names": "Luam, Obsa, Yordi, Beti, Shalom, Yabsera N",
        "description": "Rotated with Luam, Obsa, Yordi, Beti, Shalom, Yabsera N.",
        "is_active": True,
        "is_system": True
    }
]

def ensure_default_constraints(db: Session):
    existing = db.query(SystemConstraint).first()
    if not existing:
        for c in DEFAULT_CONSTRAINTS:
            rec = SystemConstraint(
                rule_key=c.get("rule_key"),
                title=c["title"],
                category=c["category"],
                staff_names=c.get("staff_names", ""),
                description=c["description"],
                is_active=c.get("is_active", True),
                is_system=c.get("is_system", True)
            )
            db.add(rec)
        db.commit()

def revalidate_draft_schedules(db: Session):
    try:
        from app.models import SchedulePeriod, ScheduleConflict
        from app.engine.validator import validate_schedule_period
        draft_periods = db.query(SchedulePeriod).filter(SchedulePeriod.status == "draft").all()
        for period in draft_periods:
            val = validate_schedule_period(period, db=db)
            db.query(ScheduleConflict).filter(ScheduleConflict.schedule_period_id == period.id).delete()
            for c in val.get("conflicts", []):
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
    except Exception as e:
        print(f"Notice: revalidate_draft_schedules: {e}")

@router.get("/", response_model=List[SystemConstraintResponse])
def get_constraints(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    ensure_default_constraints(db)
    query = db.query(SystemConstraint)
    if active_only:
        query = query.filter(SystemConstraint.is_active == True)
    return query.order_by(SystemConstraint.id).all()

@router.get("/{id}", response_model=SystemConstraintResponse)
def get_constraint(id: int, db: Session = Depends(get_db)):
    constraint = db.query(SystemConstraint).filter(SystemConstraint.id == id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint rule not found")
    return constraint

@router.post("/", response_model=SystemConstraintResponse)
def create_constraint(
    payload: SystemConstraintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    constraint = SystemConstraint(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        staff_names=payload.staff_names or "",
        rule_key=payload.rule_key,
        is_active=payload.is_active,
        is_system=False,
        config_json=payload.config_json
    )
    db.add(constraint)
    db.commit()
    db.refresh(constraint)

    # Log to audit
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="CREATE_CONSTRAINT",
        entity_type="SystemConstraint",
        entity_id=constraint.id,
        new_value=f"Created constraint: {constraint.title} ({constraint.category})",
        reason="Manager custom constraint definition"
    )
    db.add(audit)
    db.commit()

    # Automatically re-validate draft schedules with updated constraint rules
    revalidate_draft_schedules(db)

    return constraint

@router.put("/{id}", response_model=SystemConstraintResponse)
def update_constraint(
    id: int,
    payload: SystemConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    constraint = db.query(SystemConstraint).filter(SystemConstraint.id == id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint rule not found")

    old_summary = f"{constraint.title} [Active: {constraint.is_active}] - {constraint.description}"

    if payload.title is not None:
        constraint.title = payload.title
    if payload.category is not None:
        constraint.category = payload.category
    if payload.description is not None:
        constraint.description = payload.description
    if payload.staff_names is not None:
        constraint.staff_names = payload.staff_names
    if payload.is_active is not None:
        constraint.is_active = payload.is_active
    if payload.config_json is not None:
        constraint.config_json = payload.config_json

    constraint.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(constraint)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="UPDATE_CONSTRAINT",
        entity_type="SystemConstraint",
        entity_id=constraint.id,
        old_value=old_summary,
        new_value=f"{constraint.title} [Active: {constraint.is_active}] - {constraint.description}",
        reason="Manager constraint adjustment"
    )
    db.add(audit)
    db.commit()

    # Automatically re-validate draft schedules with updated constraint rules
    revalidate_draft_schedules(db)

    return constraint

@router.patch("/{id}/toggle", response_model=SystemConstraintResponse)
def toggle_constraint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    constraint = db.query(SystemConstraint).filter(SystemConstraint.id == id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint rule not found")

    constraint.is_active = not constraint.is_active
    constraint.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(constraint)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="TOGGLE_CONSTRAINT",
        entity_type="SystemConstraint",
        entity_id=constraint.id,
        old_value=f"Active: {not constraint.is_active}",
        new_value=f"Active: {constraint.is_active}",
        reason="Manager toggle constraint state"
    )
    db.add(audit)
    db.commit()

    # Automatically re-validate draft schedules with updated constraint rules
    revalidate_draft_schedules(db)

    return constraint

@router.delete("/{id}")
def delete_constraint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    constraint = db.query(SystemConstraint).filter(SystemConstraint.id == id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint rule not found")

    # If it's a system default constraint, instead of hard deleting, we allow deactivating it
    # or if hard deleting, user can restore via reset
    db.delete(constraint)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="DELETE_CONSTRAINT",
        entity_type="SystemConstraint",
        entity_id=id,
        old_value=f"Deleted constraint: {constraint.title}",
        reason="Manager deleted constraint"
    )
    db.add(audit)
    db.commit()

    # Automatically re-validate draft schedules with updated constraint rules
    revalidate_draft_schedules(db)

    return {"message": "Constraint deleted successfully", "id": id}

@router.post("/reset", response_model=List[SystemConstraintResponse])
def reset_constraints_to_defaults(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    # Clear existing and restore default constraints
    db.query(SystemConstraint).delete()
    for c in DEFAULT_CONSTRAINTS:
        rec = SystemConstraint(
            rule_key=c.get("rule_key"),
            title=c["title"],
            category=c["category"],
            staff_names=c.get("staff_names", ""),
            description=c["description"],
            is_active=c.get("is_active", True),
            is_system=True
        )
        db.add(rec)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="RESET_CONSTRAINTS",
        entity_type="SystemConstraint",
        new_value="Restored all 9 system operational constraints to factory defaults",
        reason="Admin factory reset"
    )
    db.add(audit)
    db.commit()

    # Automatically re-validate draft schedules with updated constraint rules
    revalidate_draft_schedules(db)

    return db.query(SystemConstraint).order_by(SystemConstraint.id).all()
