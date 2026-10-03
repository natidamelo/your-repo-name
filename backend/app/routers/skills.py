from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Skill
from app.schemas import SkillResponse, SkillBase
from app.core.dependencies import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("/", response_model=List[SkillResponse])
def get_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()

@router.post("/", response_model=SkillResponse)
def create_skill(
    skill_in: SkillBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    existing = db.query(Skill).filter(Skill.code == skill_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill code already exists")
    skill = Skill(
        code=skill_in.code,
        name=skill_in.name,
        description=skill_in.description
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.put("/{id}", response_model=SkillResponse)
def update_skill(
    id: int,
    skill_in: SkillBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    skill = db.query(Skill).filter(Skill.id == id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.code = skill_in.code
    skill.name = skill_in.name
    skill.description = skill_in.description
    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/{id}")
def delete_skill(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    skill = db.query(Skill).filter(Skill.id == id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": f"Skill '{skill.name}' deleted"}
