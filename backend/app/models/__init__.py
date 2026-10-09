import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="staff", nullable=False)  # 'admin', 'manager', 'staff'
    is_active = Column(Boolean, default=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("Employee", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=True, default="")
    position = Column(String(100), default="Call Center Agent")
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="employee", uselist=False)
    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    working_hours = relationship("WorkingHours", back_populates="employee", cascade="all, delete-orphan")
    lunch_break = relationship("LunchBreak", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    special_rules = relationship("SpecialRule", back_populates="employee", cascade="all, delete-orphan")
    shift_assignments = relationship("ShiftAssignment", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. CALL_CENTER, TELEGRAM
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    employee_skills = relationship("EmployeeSkill", back_populates="skill")


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(String(20), default="primary")  # primary, secondary, junior

    employee = relationship("Employee", back_populates="skills")
    skill = relationship("Skill", back_populates="employee_skills")


class WorkingHours(Base):
    __tablename__ = "working_hours"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(10), nullable=False, default="08:00")
    end_time = Column(String(10), nullable=False, default="17:00")
    is_work_day = Column(Boolean, default=True)

    employee = relationship("Employee", back_populates="working_hours")


class LunchBreak(Base):
    __tablename__ = "lunch_breaks"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(String(10), nullable=False, default="12:00")
    end_time = Column(String(10), nullable=False, default="13:00")
    duration_minutes = Column(Integer, default=60)

    employee = relationship("Employee", back_populates="lunch_break")


class SpecialRule(Base):
    __tablename__ = "special_rules"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    rule_type = Column(String(100), nullable=False)
    # rule_type values:
    # 'SUNDAY_NEVER_WORK' (Yordi, Obsa)
    # 'SUNDAY_ALTERNATING' (Hebron, Beti)
    # 'SATURDAY_ROTATION' (Hebron, Beti)
    # 'SUNDAY_MONDAY_OFF' (Hebron, Beti: if works Sunday -> off Monday)
    # 'NEVER_BOTH_OFF_WITH' (Hebron & Beti)
    # 'YEAB_COVERS_BETI' (Yeab)
    # 'TELEGRAM_BACKUP' (Biruk, Tirsit, Rediet)
    # 'CALL_CENTER_LUNCH_COVER' (Feruza, Yordi, Hermela)
    config_json = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="special_rules")


class SchedulePeriod(Base):
    __tablename__ = "schedule_periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)    # YYYY-MM-DD
    duration_weeks = Column(Integer, default=2)
    status = Column(String(20), default="draft")     # 'draft', 'published', 'archived'
    generated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    days = relationship("ScheduleDay", back_populates="schedule_period", cascade="all, delete-orphan")
    conflicts = relationship("ScheduleConflict", back_populates="schedule_period", cascade="all, delete-orphan")


class ScheduleDay(Base):
    __tablename__ = "schedule_days"

    id = Column(Integer, primary_key=True, index=True)
    schedule_period_id = Column(Integer, ForeignKey("schedule_periods.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(10), nullable=False)        # YYYY-MM-DD
    day_of_week = Column(Integer, nullable=False)    # 0=Monday, 6=Sunday
    is_weekend = Column(Boolean, default=False)

    schedule_period = relationship("SchedulePeriod", back_populates="days")
    shifts = relationship("ShiftAssignment", back_populates="schedule_day", cascade="all, delete-orphan")


class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"

    id = Column(Integer, primary_key=True, index=True)
    schedule_day_id = Column(Integer, ForeignKey("schedule_days.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    shift_type = Column(String(20), default="WORK")  # 'WORK', 'OFF', 'AM_HALF', 'PM_HALF', 'SUNDAY_DUTY'
    start_time = Column(String(10), nullable=True)   # e.g. "08:00"
    end_time = Column(String(10), nullable=True)     # e.g. "17:00"
    lunch_start = Column(String(10), nullable=True)  # e.g. "12:00"
    lunch_end = Column(String(10), nullable=True)    # e.g. "13:00"
    primary_task = Column(String(50), nullable=True)
    secondary_task = Column(String(50), nullable=True)
    notes = Column(String(255), nullable=True)

    schedule_day = relationship("ScheduleDay", back_populates="shifts")
    employee = relationship("Employee", back_populates="shift_assignments")
    tasks = relationship("TaskAssignment", back_populates="shift_assignment", cascade="all, delete-orphan")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    shift_assignment_id = Column(Integer, ForeignKey("shift_assignments.id", ondelete="CASCADE"), nullable=False)
    task_name = Column(String(50), nullable=False)   # Call Center, Telegram, GDS, 2839 phone, etc.
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    is_backup = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)

    shift_assignment = relationship("ShiftAssignment", back_populates="tasks")


class ScheduleConflict(Base):
    __tablename__ = "schedule_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    schedule_period_id = Column(Integer, ForeignKey("schedule_periods.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(10), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    employee_name = Column(String(100), nullable=True)
    severity = Column(String(20), default="critical") # 'critical', 'warning'
    error_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    schedule_period = relationship("SchedulePeriod", back_populates="conflicts")


class CoverageRequirement(Base):
    __tablename__ = "coverage_requirements"

    id = Column(Integer, primary_key=True, index=True)
    slot_index = Column(Integer, unique=True, nullable=False)  # 0 to 5
    slot_name = Column(String(50), nullable=False)             # "8:00–9:00", "9:00–12:00", etc.
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    target_staff = Column(Integer, default=2)                  # Green threshold
    min_staff = Column(Integer, default=1)                     # Yellow threshold (below is Red)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)


class SystemConstraint(Base):
    __tablename__ = "system_constraints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    category = Column(String(50), default="GENERAL", nullable=False) # LEAD_ROTATION, SUNDAY_SQUAD, EARLY_MORNING, DAYS_OFF, TASK_ROTATION, GENERAL
    description = Column(Text, nullable=False)
    staff_names = Column(String(255), nullable=True, default="")
    rule_key = Column(String(50), nullable=True, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)
    config_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    schedule_day_id = Column(Integer, ForeignKey("schedule_days.id", ondelete="SET NULL"), nullable=True)
    shift_assignment_id = Column(Integer, ForeignKey("shift_assignments.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(20), default="PRESENT", nullable=False) # PRESENT, ABSENT, LATE, HALF_DAY, EXCUSED
    check_in_time = Column(String(10), nullable=True)   # e.g. "08:15"
    check_out_time = Column(String(10), nullable=True)  # e.g. "17:00"
    late_minutes = Column(Integer, default=0, nullable=False)
    admin_remark = Column(Text, nullable=True)          # Admin remark explaining absence / tardiness

    # Absence coverage & next week make-up shift fields
    needs_next_week_cover = Column(Boolean, default=False, nullable=False) # Admin assigns: must cover next week
    cover_status = Column(String(20), default="NONE", nullable=False)      # NONE, PENDING, SCHEDULED, COMPLETED, WAIVED
    cover_notes = Column(Text, nullable=True)                              # e.g. "Cover next Saturday shift or make up 8 hrs"
    covered_by_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True) # Who covered today
    target_cover_date = Column(String(10), nullable=True)                  # Scheduled make-up date YYYY-MM-DD

    recorded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_date_attendance"),
    )

    employee = relationship("Employee", foreign_keys=[employee_id])
    covered_by = relationship("Employee", foreign_keys=[covered_by_employee_id])
    shift_assignment = relationship("ShiftAssignment")
    recorded_by = relationship("User", foreign_keys=[recorded_by_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name = Column(String(100), default="System")
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    date_time = Column(DateTime, default=datetime.datetime.utcnow)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(String(255), nullable=True)

    user = relationship("User", back_populates="audit_logs")
