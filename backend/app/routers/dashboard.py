from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional
from app.database import get_db
from app.models import Employee, ScheduleDay, ShiftAssignment, SchedulePeriod, ScheduleConflict
from app.engine.coverage import calculate_day_coverage
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    target_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Determine reference date (defaults to first schedule date if today has no schedule, or 2026-09-28)
    if target_date:
        ref_dt = datetime.strptime(target_date, "%Y-%m-%d").date()
    else:
        # Check if there is a schedule day for today's date
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        day_match = db.query(ScheduleDay).filter(ScheduleDay.date == today_str).first()
        if day_match:
            ref_dt = datetime.strptime(today_str, "%Y-%m-%d").date()
        else:
            # Fall back to first day of latest schedule, or 2026-09-28
            first_day = db.query(ScheduleDay).order_by(ScheduleDay.date.asc()).first()
            if first_day:
                ref_dt = datetime.strptime(first_day.date, "%Y-%m-%d").date()
            else:
                ref_dt = date(2026, 9, 28)

    ref_date_str = ref_dt.strftime("%Y-%m-%d")

    # Fetch total active staff
    total_staff = db.query(Employee).filter(Employee.is_active == True).count()

    # Find schedule day
    schedule_day = db.query(ScheduleDay).filter(ScheduleDay.date == ref_date_str).first()

    working_staff = []
    off_staff = []
    coverage_info = {"time_slots": [], "channels": []}

    if schedule_day:
        coverage_info = calculate_day_coverage(schedule_day.shifts)
        for s in schedule_day.shifts:
            emp_name = s.employee.first_name if s.employee else "Staff"
            pos = s.employee.position if s.employee else "Agent"

            # Compute assigned tasks list
            task_names = []
            if s.tasks:
                for t in s.tasks:
                    if t.task_name and t.task_name not in task_names:
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

            item = {
                "id": s.id,
                "employee_id": s.employee_id,
                "name": emp_name,
                "position": pos,
                "shift_type": s.shift_type,
                "hours": f"{s.start_time} - {s.end_time}" if s.start_time else "—",
                "lunch": f"{s.lunch_start} - {s.lunch_end}" if s.lunch_start else "—",
                "primary_task": s.primary_task,
                "secondary_task": s.secondary_task,
                "assigned_tasks": task_names
            }
            if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF"):
                working_staff.append(item)
            else:
                off_staff.append(item)
    else:
        # If no DB schedule yet for this day, list all as off or pending
        all_emps = db.query(Employee).filter(Employee.is_active == True).all()
        off_staff = [{"id": e.id, "name": e.first_name, "position": e.position, "shift_type": "OFF"} for e in all_emps]

    # Find next upcoming Saturday
    days_to_sat = (5 - ref_dt.weekday()) % 7
    upcoming_sat_dt = ref_dt + timedelta(days=days_to_sat)
    sat_rot = get_saturday_rotation(upcoming_sat_dt)

    # Find next upcoming Sunday
    days_to_sun = (6 - ref_dt.weekday()) % 7
    upcoming_sun_dt = ref_dt + timedelta(days=days_to_sun)
    sun_duty = get_sunday_duty_assignment(upcoming_sun_dt)

    # Check if there is an existing Sunday in DB to pull the 4 exact staff
    sun_date_str = upcoming_sun_dt.strftime("%Y-%m-%d")
    sun_day = db.query(ScheduleDay).filter(ScheduleDay.date == sun_date_str).first()
    sunday_staff_names = []
    if sun_day:
        for s in sun_day.shifts:
            if s.shift_type in ("WORK", "SUNDAY_DUTY"):
                sunday_staff_names.append(s.employee.first_name if s.employee else "Staff")
    if not sunday_staff_names:
        sunday_staff_names = [sun_duty["working"], "Shalom", "Biruk", "Luam"]

    # Count coverage issues on this day
    red_slots = sum(1 for slot in coverage_info.get("time_slots", []) if slot.get("status") == "RED")
    yellow_slots = sum(1 for slot in coverage_info.get("time_slots", []) if slot.get("status") == "YELLOW")

    # Critical schedule conflicts across latest period
    latest_period = db.query(SchedulePeriod).order_by(SchedulePeriod.created_at.desc()).first()
    conflicts_count = len(latest_period.conflicts) if latest_period else 0

    return {
        "reference_date": ref_date_str,
        "day_of_week": ref_dt.strftime("%A"),
        "total_staff": total_staff,
        "working_today_count": len(working_staff),
        "off_today_count": len(off_staff),
        "working_staff": working_staff,
        "off_staff": off_staff,
        "red_slots_count": red_slots,
        "yellow_slots_count": yellow_slots,
        "conflicts_count": conflicts_count,
        "time_slot_coverage": coverage_info.get("time_slots", []),
        "channel_coverage": coverage_info.get("channels", []),
        "upcoming_saturday": {
            "date": upcoming_sat_dt.strftime("%Y-%m-%d"),
            "formatted_date": upcoming_sat_dt.strftime("%B %d, %Y"),
            "week_type": sat_rot["week_type"],
            "hebron": sat_rot["Hebron"],
            "beti": sat_rot["Beti"]
        },
        "upcoming_sunday": {
            "date": upcoming_sun_dt.strftime("%Y-%m-%d"),
            "formatted_date": upcoming_sun_dt.strftime("%B %d, %Y"),
            "duty_lead": sun_duty["working"],
            "off_lead": sun_duty["off"],
            "squad_staff": sunday_staff_names,
            "total_squad": len(sunday_staff_names)
        }
    }
