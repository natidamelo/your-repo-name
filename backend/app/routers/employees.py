from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Employee, Skill, EmployeeSkill, WorkingHours, LunchBreak, SpecialRule, User
from app.schemas import (
    EmployeeDetailResponse, EmployeeCreate, EmployeeUpdate, EmployeeSkillResponse
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/employees", tags=["Employees"])

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

    db.commit()
    db.refresh(emp)
    return build_employee_response(emp)

@router.delete("/{id}")
def deactivate_employee(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    db.commit()
    return {"message": f"Employee {emp.full_name} deactivated"}
