from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import (
    AttendanceRecord, Employee, ScheduleDay, ShiftAssignment, SchedulePeriod, User, AuditLog
)
from app.schemas import (
    AttendanceRecordCreate, AttendanceRecordUpdate, AttendanceRecordResponse,
    DayAttendanceResponse, DayStaffAttendanceItem, PendingCoverItem,
    ResolveCoverRequest, AttendanceSummaryStats
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/attendance", tags=["Attendance & Coverage"])

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def find_schedule_day_for_date(db: Session, date_str: str, schedule_id: Optional[int] = None) -> Optional[ScheduleDay]:
    """
    Finds the ScheduleDay for a given date.
    If schedule_id is provided, looks for the day in that specific schedule.
    Otherwise, picks the day from the published schedule covering that date,
    prioritizing official 'Guzo Go' schedules.
    """
    base_query = (
        db.query(ScheduleDay)
        .join(SchedulePeriod, ScheduleDay.schedule_period_id == SchedulePeriod.id)
        .filter(ScheduleDay.date == date_str)
    )
    if schedule_id:
        day = base_query.filter(ScheduleDay.schedule_period_id == schedule_id).first()
        if day:
            return day

    # 1. Prioritize published schedules containing 'Guzo Go'
    day = (
        base_query.filter(SchedulePeriod.status == "published", SchedulePeriod.name.like("%Guzo Go%"))
        .order_by(SchedulePeriod.id.desc())
        .first()
    )
    if day:
        return day

    # 2. Prioritize latest published schedule
    day = (
        base_query.filter(SchedulePeriod.status == "published")
        .order_by(SchedulePeriod.id.desc())
        .first()
    )
    if not day:
        # Fallback to latest schedule regardless of status
        day = base_query.order_by(SchedulePeriod.id.desc()).first()
    return day

@router.get("/day/{date_str}", response_model=DayAttendanceResponse)
def get_day_attendance(
    date_str: str,
    schedule_id: Optional[int] = Query(None, description="Optional specific schedule period ID"),
    db: Session = Depends(get_db)
):
    """
    Returns the attendance sheet for a specific date, merged with the scheduled shift assignments.
    """
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    day_of_week = dt.weekday()
    day_name = DAY_NAMES[day_of_week]

    # 1. Find ScheduleDay for this date (from active/published schedule)
    schedule_day = find_schedule_day_for_date(db, date_str, schedule_id)
    active_sched_id = schedule_day.schedule_period_id if schedule_day else None
    active_sched_name = schedule_day.schedule_period.name if (schedule_day and schedule_day.schedule_period) else None
    shifts_by_emp: dict = {}
    if schedule_day and schedule_day.shifts:
        for s in schedule_day.shifts:
            shifts_by_emp[s.employee_id] = s

    # 2. Fetch staff members (from current schedule shifts if present, else active employees)
    if schedule_day and schedule_day.shifts:
        sched_emp_ids = set(s.employee_id for s in schedule_day.shifts)
        employees = db.query(Employee).filter(Employee.id.in_(sched_emp_ids)).order_by(Employee.id).all()
    else:
        employees = db.query(Employee).filter(Employee.is_active == True).order_by(Employee.id).all()
    emp_map = {e.id: e for e in employees}

    # 3. Find existing attendance records for this date
    att_records = db.query(AttendanceRecord).filter(AttendanceRecord.date == date_str).all()
    att_by_emp = {a.employee_id: a for a in att_records}

    # 4. Build combined list
    items: List[DayStaffAttendanceItem] = []
    scheduled_count = 0
    present_count = 0
    absent_count = 0
    late_count = 0
    excused_count = 0
    pending_cover_count = 0

    for emp in employees:
        shift = shifts_by_emp.get(emp.id)
        att = att_by_emp.get(emp.id)

        # Determine scheduled status
        if shift:
            is_work = shift.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF")
            shift_type = shift.shift_type
            s_start = shift.start_time
            s_end = shift.end_time
            p_task = shift.primary_task
            s_task = shift.secondary_task
        else:
            # Fallback to working hours table if no roster shift generated yet
            is_work = (day_of_week < 6)
            shift_type = "WORK" if is_work else "OFF"
            s_start = "08:00" if is_work else None
            s_end = "17:00" if is_work else None
            p_task = "Call Center" if is_work else None
            s_task = None

        if is_work:
            scheduled_count += 1

        # Attendance info
        att_id = att.id if att else None
        att_status = att.status if att else None
        c_in = att.check_in_time if att else None
        c_out = att.check_out_time if att else None
        late_m = att.late_minutes if att else 0
        remark = att.admin_remark if att else None
        needs_cover = att.needs_next_week_cover if att else False
        cov_status = att.cover_status if att else "NONE"
        cov_notes = att.cover_notes if att else None
        cov_emp_id = att.covered_by_employee_id if att else None
        cov_name = att.covered_by.full_name if (att and att.covered_by) else None
        target_date = att.target_cover_date if att else None

        if att_status == "PRESENT":
            present_count += 1
        elif att_status == "ABSENT":
            absent_count += 1
        elif att_status == "LATE":
            late_count += 1
        elif att_status in ("HALF_DAY", "EXCUSED"):
            excused_count += 1

        if needs_cover and cov_status in ("PENDING", "SCHEDULED"):
            pending_cover_count += 1

        items.append(DayStaffAttendanceItem(
            employee_id=emp.id,
            employee_name=emp.full_name,
            position=emp.position or "Agent",
            is_scheduled_work=is_work,
            shift_type=shift_type,
            scheduled_start=s_start,
            scheduled_end=s_end,
            primary_task=p_task,
            secondary_task=s_task,
            attendance_id=att_id,
            status=att_status,
            check_in_time=c_in,
            check_out_time=c_out,
            late_minutes=late_m,
            admin_remark=remark,
            needs_next_week_cover=needs_cover,
            cover_status=cov_status,
            cover_notes=cov_notes,
            covered_by_employee_id=cov_emp_id,
            covered_by_name=cov_name,
            target_cover_date=target_date
        ))

    return DayAttendanceResponse(
        date=date_str,
        day_of_week=day_of_week,
        day_name=day_name,
        total_staff=len(employees),
        scheduled_count=scheduled_count,
        present_count=present_count,
        absent_count=absent_count,
        late_count=late_count,
        excused_count=excused_count,
        pending_cover_count=pending_cover_count,
        schedule_id=active_sched_id,
        schedule_name=active_sched_name,
        records=items
    )

@router.post("/record", response_model=AttendanceRecordResponse)
def create_or_update_attendance(
    payload: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Creates or updates an attendance record for an employee on a specific date.
    Admin can mark absent, add remark, and designate if they must cover next week.
    """
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == payload.employee_id,
        AttendanceRecord.date == payload.date
    ).first()

    old_status = rec.status if rec else "None"

    # Default cover status based on needs_next_week_cover
    cov_status = payload.cover_status
    if payload.needs_next_week_cover and cov_status in ("NONE", None):
        cov_status = "PENDING"
    elif not payload.needs_next_week_cover and cov_status == "PENDING":
        cov_status = "NONE"

    if not rec:
        rec = AttendanceRecord(
            employee_id=payload.employee_id,
            date=payload.date,
            status=payload.status,
            check_in_time=payload.check_in_time,
            check_out_time=payload.check_out_time,
            late_minutes=payload.late_minutes,
            admin_remark=payload.admin_remark,
            needs_next_week_cover=payload.needs_next_week_cover,
            cover_status=cov_status,
            cover_notes=payload.cover_notes,
            covered_by_employee_id=payload.covered_by_employee_id,
            target_cover_date=payload.target_cover_date,
            recorded_by_user_id=current_user.id
        )
        db.add(rec)
    else:
        rec.status = payload.status
        rec.check_in_time = payload.check_in_time
        rec.check_out_time = payload.check_out_time
        rec.late_minutes = payload.late_minutes
        rec.admin_remark = payload.admin_remark
        rec.needs_next_week_cover = payload.needs_next_week_cover
        rec.cover_status = cov_status
        rec.cover_notes = payload.cover_notes
        rec.covered_by_employee_id = payload.covered_by_employee_id
        rec.target_cover_date = payload.target_cover_date
        rec.recorded_by_user_id = current_user.id
        rec.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(rec)

    # Log to audit log
    cover_desc = f", Needs Next Week Cover: {rec.needs_next_week_cover}" if rec.needs_next_week_cover else ""
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="UPDATE_ATTENDANCE",
        entity_type="AttendanceRecord",
        entity_id=rec.id,
        old_value=f"{emp.full_name} on {payload.date} was {old_status}",
        new_value=f"{emp.full_name} on {payload.date} is now {rec.status}{cover_desc} (Remark: {rec.admin_remark or 'None'})",
        reason=payload.admin_remark or "Admin recorded attendance"
    )
    db.add(audit)
    db.commit()

    covered_name = rec.covered_by.full_name if rec.covered_by else None
    return AttendanceRecordResponse(
        id=rec.id,
        employee_id=rec.employee_id,
        date=rec.date,
        status=rec.status,
        check_in_time=rec.check_in_time,
        check_out_time=rec.check_out_time,
        late_minutes=rec.late_minutes,
        admin_remark=rec.admin_remark,
        needs_next_week_cover=rec.needs_next_week_cover,
        cover_status=rec.cover_status,
        cover_notes=rec.cover_notes,
        covered_by_employee_id=rec.covered_by_employee_id,
        target_cover_date=rec.target_cover_date,
        employee_name=emp.full_name,
        covered_by_name=covered_name,
        recorded_by_name=current_user.username,
        created_at=rec.created_at,
        updated_at=rec.updated_at
    )

@router.post("/bulk-mark-present")
def bulk_mark_present_for_date(
    date_str: str = Query(..., description="Date YYYY-MM-DD to mark present"),
    schedule_id: Optional[int] = Query(None, description="Optional specific schedule period ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Convenience action: Marks all scheduled employees as PRESENT on the given date
    (skips anyone already explicitly marked ABSENT, LATE, or EXCUSED).
    """
    # Find scheduled day
    schedule_day = find_schedule_day_for_date(db, date_str, schedule_id)
    working_emp_ids = set()
    if schedule_day and schedule_day.shifts:
        for s in schedule_day.shifts:
            if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF"):
                working_emp_ids.add(s.employee_id)
    else:
        # Fallback to weekday employees
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        if dt.weekday() < 6:
            all_emps = db.query(Employee).filter(Employee.is_active == True).all()
            working_emp_ids = set(e.id for e in all_emps)

    marked_count = 0
    for emp_id in working_emp_ids:
        rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == emp_id,
            AttendanceRecord.date == date_str
        ).first()

        # Only set if not already recorded or status was unset
        if not rec:
            rec = AttendanceRecord(
                employee_id=emp_id,
                date=date_str,
                status="PRESENT",
                check_in_time="08:00",
                check_out_time="17:00",
                recorded_by_user_id=current_user.id
            )
            db.add(rec)
            marked_count += 1

    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="BULK_MARK_PRESENT",
        entity_type="AttendanceRecord",
        new_value=f"Marked {marked_count} scheduled staff as PRESENT on {date_str}",
        reason="Admin bulk check-in"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully marked {marked_count} staff as PRESENT", "date": date_str}

@router.get("/pending-cover", response_model=List[PendingCoverItem])
def get_pending_coverage_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Returns all employees who were marked absent and designated by admin as needing
    to cover a shift in next week's schedule.
    """
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.needs_next_week_cover == True,
        AttendanceRecord.cover_status.in_(["PENDING", "SCHEDULED"])
    ).order_by(AttendanceRecord.date.desc()).all()

    items = []
    for r in records:
        emp = r.employee
        # Check shift type from that day
        s_type = "WORK"
        if r.shift_assignment:
            s_type = r.shift_assignment.shift_type

        items.append(PendingCoverItem(
            attendance_id=r.id,
            employee_id=r.employee_id,
            employee_name=emp.full_name if emp else f"Agent #{r.employee_id}",
            position=emp.position if emp else "Agent",
            absence_date=r.date,
            shift_type=s_type,
            admin_remark=r.admin_remark,
            cover_status=r.cover_status,
            cover_notes=r.cover_notes,
            target_cover_date=r.target_cover_date
        ))

    return items

@router.put("/resolve-cover/{attendance_id}")
def resolve_coverage_status(
    attendance_id: int,
    payload: ResolveCoverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Allows the admin to resolve or assign a make-up shift (e.g. SCHEDULED, COMPLETED, WAIVED).
    """
    rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == attendance_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    old_status = rec.cover_status
    rec.cover_status = payload.cover_status
    if payload.cover_notes is not None:
        rec.cover_notes = payload.cover_notes
    if payload.target_cover_date is not None:
        rec.target_cover_date = payload.target_cover_date
    rec.updated_at = datetime.datetime.utcnow()

    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="RESOLVE_COVERAGE",
        entity_type="AttendanceRecord",
        entity_id=rec.id,
        old_value=f"Cover status: {old_status}",
        new_value=f"Cover status: {rec.cover_status} (Notes: {rec.cover_notes or 'None'}, Target: {rec.target_cover_date or 'None'})",
        reason="Admin updated coverage status"
    )
    db.add(audit)
    db.commit()

    return {"message": "Coverage status updated successfully", "id": attendance_id, "cover_status": rec.cover_status}

@router.get("/summary", response_model=AttendanceSummaryStats)
def get_attendance_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Returns aggregated attendance statistics across an optional date range and employee.
    """
    query = db.query(AttendanceRecord)
    if start_date:
        query = query.filter(AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.date <= end_date)
    if employee_id:
        query = query.filter(AttendanceRecord.employee_id == employee_id)

    records = query.all()
    total = len(records)
    present = sum(1 for r in records if r.status == "PRESENT")
    absent = sum(1 for r in records if r.status == "ABSENT")
    late = sum(1 for r in records if r.status == "LATE")
    excused = sum(1 for r in records if r.status in ("HALF_DAY", "EXCUSED"))
    late_mins = sum(r.late_minutes for r in records)
    pending_cover = sum(1 for r in records if r.needs_next_week_cover and r.cover_status in ("PENDING", "SCHEDULED"))

    rate = (present / total * 100.0) if total > 0 else 100.0

    return AttendanceSummaryStats(
        total_records=total,
        total_present=present,
        total_absent=absent,
        total_late=late,
        total_excused=excused,
        total_late_minutes=late_mins,
        total_pending_cover=pending_cover,
        attendance_rate_percent=round(rate, 1)
    )
