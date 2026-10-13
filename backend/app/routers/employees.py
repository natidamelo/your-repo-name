from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Employee, Skill, EmployeeSkill, WorkingHours, LunchBreak, SpecialRule, User, SystemConstraint, AuditLog
from app.schemas import (
    EmployeeDetailResponse, EmployeeCreate, EmployeeUpdate, EmployeeSkillResponse
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/employees", tags=["Employees"])

def sync_constraints_staff_list(db: Session, employee_name: str, action: str, old_name: str = None):
    """
    Keep system constraints staff_names aligned when employees are added, renamed, or deleted.
    """
    try:
        constraints = db.query(SystemConstraint).all()
        for c in constraints:
            if not c.staff_names:
                continue
            names = [n.strip() for n in c.staff_names.split(',') if n.strip()]
            modified = False
            
            if action == "rename" and old_name:
                new_names = []
                for n in names:
                    if n.lower() == old_name.lower():
                        new_names.append(employee_name)
                        modified = True
                    else:
                        new_names.append(n)
                names = new_names
            elif action == "delete":
                new_names = [n for n in names if n.lower() != employee_name.lower()]
                if len(new_names) != len(names):
                    names = new_names
                    modified = True
            
            if modified:
                c.staff_names = ", ".join(names)
        db.flush()
    except Exception as e:
        print(f"Notice: sync_constraints_staff_list: {e}")

def build_employee_response(emp: Employee) -> dict:
    skills_data = []
    for es in emp.skills:
        skills_data.append({
            "id": es.id,
            "skill_id": es.skill_id,
            "skill_code": es.skill.code if es.skill else "",
            "skill_name": es.skill.name if es.skill else "",
            "proficiency_level": es.proficiency_level
        })
    
    return {
        "id": emp.id,
        "first_name": emp.first_name,
        "last_name": emp.last_name or "",
        "full_name": emp.full_name,
        "position": emp.position,
        "email": emp.email,
        "phone": emp.phone,
        "is_active": emp.is_active,
        "notes": emp.notes,
        "created_at": emp.created_at,
        "skills": skills_data,
        "working_hours": emp.working_hours,
        "lunch_break": emp.lunch_break,
        "special_rules": emp.special_rules
    }

@router.get("/", response_model=List[EmployeeDetailResponse])
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.id).all()
    return [build_employee_response(e) for e in employees]

@router.get("/{id}", response_model=EmployeeDetailResponse)
def get_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return build_employee_response(emp)

@router.post("/", response_model=EmployeeDetailResponse)
def create_employee(
    emp_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    emp = Employee(
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        position=emp_in.position,
        email=emp_in.email,
        phone=emp_in.phone,
        is_active=emp_in.is_active,
        notes=emp_in.notes
    )
    db.add(emp)
    db.flush()

    # Add default lunch
    lunch = LunchBreak(
        employee_id=emp.id,
        start_time=emp_in.lunch_start or "12:00",
        end_time=emp_in.lunch_end or "13:00",
        duration_minutes=60
    )
    db.add(lunch)

    # Add default working hours (Mon-Sat 8:00 - 17:00, Sun off)
    for dow in range(7):
        is_work = (dow < 6)
        wh = WorkingHours(
            employee_id=emp.id,
            day_of_week=dow,
            start_time="08:00",
            end_time="17:00",
            is_work_day=is_work
        )
        db.add(wh)

    # Add skills
    if emp_in.skill_ids:
        for s_id in emp_in.skill_ids:
            es = EmployeeSkill(employee_id=emp.id, skill_id=s_id, proficiency_level="primary")
            db.add(es)

    # Add special rules
    if emp_in.special_rules:
        for r in emp_in.special_rules:
            sr = SpecialRule(employee_id=emp.id, rule_type=r)
            db.add(sr)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="CREATE_EMPLOYEE",
        entity_type="Employee",
        entity_id=emp.id,
        new_value=f"Created employee profile for {emp.full_name} ({emp.position})",
        reason="Admin/Manager employee addition"
    )
    db.add(audit)

    db.commit()
    db.refresh(emp)
    return build_employee_response(emp)

@router.put("/{id}", response_model=EmployeeDetailResponse)
def update_employee(
    id: int,
    emp_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    old_first_name = emp.first_name
    old_full_name = emp.full_name

    if emp_in.first_name is not None:
        emp.first_name = emp_in.first_name
    if emp_in.last_name is not None:
        emp.last_name = emp_in.last_name
    if emp_in.position is not None:
        emp.position = emp_in.position
    if emp_in.email is not None:
        emp.email = emp_in.email
    if emp_in.phone is not None:
        emp.phone = emp_in.phone
    if emp_in.is_active is not None:
        emp.is_active = emp_in.is_active
    if emp_in.notes is not None:
        emp.notes = emp_in.notes

    if emp_in.lunch_start or emp_in.lunch_end:
        if not emp.lunch_break:
            emp.lunch_break = LunchBreak(employee_id=emp.id)
            db.add(emp.lunch_break)
        if emp_in.lunch_start:
            emp.lunch_break.start_time = emp_in.lunch_start
        if emp_in.lunch_end:
            emp.lunch_break.end_time = emp_in.lunch_end

    if emp_in.skill_ids is not None:
        # replace skills
        db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.id).delete()
        for s_id in emp_in.skill_ids:
            es = EmployeeSkill(employee_id=emp.id, skill_id=s_id, proficiency_level="primary")
            db.add(es)

    if emp_in.special_rules is not None:
        # replace special rules
        db.query(SpecialRule).filter(SpecialRule.employee_id == emp.id).delete()
        for r in emp_in.special_rules:
            sr = SpecialRule(employee_id=emp.id, rule_type=r)
            db.add(sr)

    # Sync constraint staff lists if first name changed
    if emp_in.first_name is not None and emp_in.first_name != old_first_name:
        sync_constraints_staff_list(db, emp.first_name, action="rename", old_name=old_first_name)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="UPDATE_EMPLOYEE",
        entity_type="Employee",
        entity_id=emp.id,
        old_value=old_full_name,
        new_value=f"Updated profile for {emp.full_name} (active: {emp.is_active})",
        reason="Admin/Manager employee update"
    )
    db.add(audit)

    db.commit()
    db.refresh(emp)
    return build_employee_response(emp)

@router.delete("/{id}")
def delete_employee(
    id: int,
    permanent: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_name = emp.full_name
    first_name = emp.first_name

    if permanent:
        # Check linked records and safely detach or delete
        if emp.user:
            emp.user.employee_id = None
        
        from app.models import AttendanceRecord
        db.query(AttendanceRecord).filter(AttendanceRecord.covered_by_employee_id == id).update(
            {"covered_by_employee_id": None}
        )

        db.delete(emp)
        sync_constraints_staff_list(db, first_name, action="delete")

        audit = AuditLog(
            user_id=current_user.id,
            user_name=current_user.username,
            action="DELETE_EMPLOYEE_PERMANENT",
            entity_type="Employee",
            entity_id=id,
            old_value=emp_name,
            new_value=f"Permanently deleted employee profile {emp_name}",
            reason="Admin permanent deletion"
        )
        db.add(audit)
        db.commit()
        return {"message": f"Employee {emp_name} permanently deleted", "id": id, "status": "deleted"}
    else:
        emp.is_active = False
        audit = AuditLog(
            user_id=current_user.id,
            user_name=current_user.username,
            action="DEACTIVATE_EMPLOYEE",
            entity_type="Employee",
            entity_id=id,
            old_value=emp_name,
            new_value=f"Deactivated employee profile {emp_name}",
            reason="Admin employee deactivation"
        )
        db.add(audit)
        db.commit()
        return {"message": f"Employee {emp_name} deactivated", "id": id, "status": "deactivated"}
