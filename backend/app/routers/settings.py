from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import SystemSetting, User
from app.schemas import SettingResponse, SettingUpdate
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = [
    {"key": "sunday_staff_count", "value": "5", "description": "Mandatory number of staff members on duty on Sunday"},
    {"key": "required_call_center_target", "value": "2", "description": "Target number of call center agents per slot for GREEN coverage"},
    {"key": "saturday_rotation_anchor_date", "value": "2026-10-05", "description": "Reference date for Week A Saturday half-day rotation"},
    {"key": "weekly_days_off_count", "value": "2", "description": "Mandatory number of days off per 7-day week for regular staff"},
    {"key": "operating_start_hour", "value": "08:00", "description": "Call center morning opening time"},
    {"key": "operating_end_hour", "value": "18:00", "description": "Call center evening closing time"}
]

@router.get("/", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    if not settings_records:
        for s in DEFAULT_SETTINGS:
            rec = SystemSetting(key=s["key"], value=s["value"], description=s["description"])
            db.add(rec)
        db.commit()
        settings_records = db.query(SystemSetting).all()
    return settings_records

@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    update_in: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=update_in.value)
        db.add(setting)
    else:
        setting.value = update_in.value
    db.commit()
    db.refresh(setting)
    return setting
