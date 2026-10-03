from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "staff"
    employee_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    employee_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- SKILL SCHEMAS ---
class SkillBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True

class EmployeeSkillResponse(BaseModel):
    id: int
    skill_id: int
    skill_code: str
    skill_name: str
    proficiency_level: str

# --- WORKING HOURS & LUNCH ---
class WorkingHoursBase(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_work_day: bool

class WorkingHoursResponse(WorkingHoursBase):
    id: int

    class Config:
        from_attributes = True

class LunchBreakBase(BaseModel):
    start_time: str
    end_time: str
    duration_minutes: int = 60

class LunchBreakResponse(LunchBreakBase):
    id: int

    class Config:
        from_attributes = True

class SpecialRuleBase(BaseModel):
    rule_type: str
    config_json: Optional[str] = None

class SpecialRuleResponse(SpecialRuleBase):
    id: int

    class Config:
        from_attributes = True

# --- EMPLOYEE SCHEMAS ---
class EmployeeBase(BaseModel):
    first_name: str
    last_name: Optional[str] = ""
    position: Optional[str] = "Call Center Agent"
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    skill_ids: Optional[List[int]] = []
    lunch_start: Optional[str] = "12:00"
    lunch_end: Optional[str] = "13:00"

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    skill_ids: Optional[List[int]] = None
    lunch_start: Optional[str] = None
    lunch_end: Optional[str] = None

class EmployeeDetailResponse(EmployeeBase):
    id: int
    full_name: str
    skills: List[EmployeeSkillResponse] = []
    working_hours: List[WorkingHoursResponse] = []
    lunch_break: Optional[LunchBreakResponse] = None
    special_rules: List[SpecialRuleResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- SCHEDULE & ASSIGNMENTS ---
class TaskAssignmentSchema(BaseModel):
    id: Optional[int] = None
    task_name: str
    start_time: str
    end_time: str
    is_backup: bool = False
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ShiftAssignmentSchema(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    shift_type: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    lunch_start: Optional[str] = None
    lunch_end: Optional[str] = None
    primary_task: Optional[str] = None
    secondary_task: Optional[str] = None
    assigned_tasks: List[str] = []
    notes: Optional[str] = None
    tasks: List[TaskAssignmentSchema] = []
    skills: Optional[List[str]] = []
    employee_position: Optional[str] = None

    class Config:
        from_attributes = True

class TaskTimeEntry(BaseModel):
    """Per-task time window sent from the frontend shift editor."""
    task_name: str
    start_time: str
    end_time: str
    is_backup: bool = False

class ShiftUpdateRequest(BaseModel):
    shift_type: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    lunch_start: Optional[str] = None
    lunch_end: Optional[str] = None
    primary_task: Optional[str] = None
    secondary_task: Optional[str] = None
    assigned_tasks: Optional[List[str]] = None
    task_times: Optional[List[TaskTimeEntry]] = None   # per-task from/to times (allows duplicates with is_backup)
    notes: Optional[str] = None
    reason: Optional[str] = "Manager manual adjustment"

class ScheduleDaySchema(BaseModel):
    id: int
    date: str
    day_of_week: int
    is_weekend: bool
    shifts: List[ShiftAssignmentSchema] = []

    class Config:
        from_attributes = True

class ConflictSchema(BaseModel):
    id: Optional[int] = None
    date: Optional[str] = None
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    severity: str
    error_type: str
    message: str
    suggestion: Optional[str] = None

    class Config:
        from_attributes = True

class SchedulePeriodDetail(BaseModel):
    id: int
    name: str
    start_date: str
    end_date: str
    duration_weeks: int
    status: str
    generated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    days: List[ScheduleDaySchema] = []
    conflicts: List[ConflictSchema] = []

    class Config:
        from_attributes = True

class GenerateScheduleRequest(BaseModel):
    start_date: str  # YYYY-MM-DD
    duration_weeks: int = 2
    schedule_type: Optional[str] = "Standard"
    preview_only: bool = False

class ValidationResult(BaseModel):
    is_valid: bool
    critical_errors: int
    warnings: int
    conflicts: List[ConflictSchema]
    checklist: Dict[str, bool]

# --- COVERAGE SCHEMAS ---
class TimeSlotCoverage(BaseModel):
    slot_index: int
    slot_name: str
    start_time: str
    end_time: str
    staff_count: int
    status: str  # GREEN, YELLOW, RED
    staff_names: List[str] = []

class ChannelCoverage(BaseModel):
    channel: str
    available_staff_count: int
    target_count: int
    status: str  # GREEN, YELLOW, RED
    staff_names: List[str] = []

class DayCoverageSummary(BaseModel):
    date: str
    day_of_week: int
    is_sunday: bool
    is_saturday: bool
    time_slots: List[TimeSlotCoverage] = []
    channels: List[ChannelCoverage] = []

# --- SETTINGS SCHEMAS ---
class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    key: str
    value: str

# --- AUDIT LOG SCHEMA ---
class AuditLogResponse(BaseModel):
    id: int
    user_name: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    date_time: datetime
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True
