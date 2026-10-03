from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models import Employee, ScheduleDay, ShiftAssignment, SchedulePeriod, ScheduleConflict
from app.engine.coverage import calculate_day_coverage
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    target_date: Optional[str] = None,
    schedule_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # 1. Determine active schedule period
    period = None
    if schedule_id:
        period = db.query(SchedulePeriod).filter(SchedulePeriod.id == schedule_id).first()

    if not period:
        # Default to Guzo Go Schedule 05 Oct - 11 Oct or the latest schedule period
        period = (
            db.query(SchedulePeriod)
            .filter(SchedulePeriod.name.like("%Guzo Go%"))
            .order_by(SchedulePeriod.id.desc())
            .first()
        )
        if not period:
            period = db.query(SchedulePeriod).order_by(SchedulePeriod.id.desc()).first()

    all_schedules = [
        {
            "id": p.id,
            "name": p.name,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "status": p.status
        }
        for p in db.query(SchedulePeriod).order_by(SchedulePeriod.id.desc()).all()
    ]

    # 2. Extract and sort period days
    period_days = sorted(period.days, key=lambda d: d.date) if (period and period.days) else []
    period_date_strs = [d.date for d in period_days]

    # 3. Determine reference date
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if target_date:
        ref_date_str = target_date
        try:
            ref_dt = datetime.strptime(target_date, "%Y-%m-%d").date()
        except Exception:
            ref_dt = datetime.utcnow().date()
            ref_date_str = ref_dt.strftime("%Y-%m-%d")
    elif today_str in period_date_strs:
        ref_date_str = today_str
        ref_dt = datetime.strptime(today_str, "%Y-%m-%d").date()
    elif period_date_strs:
        # Use first day of active schedule (e.g. 2026-10-05)
        ref_date_str = period_date_strs[0]
        ref_dt = datetime.strptime(ref_date_str, "%Y-%m-%d").date()
    else:
        ref_dt = date(2026, 10, 5)
        ref_date_str = ref_dt.strftime("%Y-%m-%d")

    # 4. Total active staff
    total_staff = db.query(Employee).filter(Employee.is_active == True).count()

    # 5. Find target day's shifts
    schedule_day = next((d for d in period_days if d.date == ref_date_str), None)
    if not schedule_day:
        schedule_day = db.query(ScheduleDay).filter(ScheduleDay.date == ref_date_str).first()

    working_staff = []
    off_staff = []
    coverage_info = {"time_slots": [], "channels": []}

    if schedule_day and schedule_day.shifts:
        coverage_info = calculate_day_coverage(schedule_day.shifts)
        for s in schedule_day.shifts:
            emp_name = s.employee.first_name if s.employee else "Staff"
            pos = s.employee.position if s.employee else "Agent"

            # Compute assigned tasks list and detailed task schedule
            task_names = []
            task_details = []
            if s.tasks:
                for t in s.tasks:
                    if t.task_name:
                        task_details.append({
                            "task_name": t.task_name,
                            "start_time": t.start_time,
                            "end_time": t.end_time,
                            "is_backup": bool(t.is_backup)
                        })
                        if t.task_name not in task_names:
                            task_names.append(t.task_name)

            if not task_names:
                if s.primary_task:
                    for pt in s.primary_task.split(","):
                        pt_c = pt.strip()
                        if pt_c and pt_c not in task_names:
                            task_names.append(pt_c)
                            task_details.append({
                                "task_name": pt_c,
                                "start_time": s.start_time,
                                "end_time": s.end_time,
                                "is_backup": False
                            })
                if s.secondary_task:
                    for st in s.secondary_task.split(","):
                        st_c = st.strip()
                        if st_c and st_c not in task_names:
                            task_names.append(st_c)
                            task_details.append({
                                "task_name": st_c,
                                "start_time": s.start_time,
                                "end_time": s.end_time,
                                "is_backup": True
                            })

            item = {
                "id": s.id,
                "employee_id": s.employee_id,
                "name": emp_name,
                "position": pos,
                "shift_type": s.shift_type,
                "hours": f"{s.start_time} - {s.end_time}" if s.start_time else "—",
                "lunch": f"{s.lunch_start} - {s.lunch_end}" if s.lunch_start else "—",
                "notes": s.notes or "",
                "primary_task": s.primary_task,
                "secondary_task": s.secondary_task,
                "assigned_tasks": task_names,
                "task_details": task_details
            }
            if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF"):
                working_staff.append(item)
            else:
                off_staff.append(item)
    else:
        # Fallback if no shifts found
        all_emps = db.query(Employee).filter(Employee.is_active == True).all()
        off_staff = [{"id": e.id, "name": e.first_name, "position": e.position, "shift_type": "OFF"} for e in all_emps]

    # 6. Real Saturday Data from DB
    sat_day = next((d for d in period_days if datetime.strptime(d.date, "%Y-%m-%d").weekday() == 5), None)
    if not sat_day:
        sat_day = (
            db.query(ScheduleDay)
            .filter(ScheduleDay.is_weekend == True, ScheduleDay.day_of_week == 5)
            .order_by(ScheduleDay.date.desc())
            .first()
        )

    sat_am_staff = []
    sat_pm_staff = []
    sat_full_staff = []
    sat_off_staff = []
    sat_date_str = ""
    sat_formatted_date = ""

    if sat_day and sat_day.shifts:
        sat_date_str = sat_day.date
        sat_dt = datetime.strptime(sat_day.date, "%Y-%m-%d").date()
        sat_formatted_date = sat_dt.strftime("%B %d, %Y")
        for s in sat_day.shifts:
            name = s.employee.first_name if s.employee else "Staff"
            hours = f"{s.start_time}–{s.end_time}" if s.start_time else ""
            info = {"name": name, "hours": hours, "notes": s.notes or ""}
            if s.shift_type == "AM_HALF":
                sat_am_staff.append(info)
            elif s.shift_type == "PM_HALF":
                sat_pm_staff.append(info)
            elif s.shift_type == "WORK":
                sat_full_staff.append(info)
            else:
                sat_off_staff.append(info)
    else:
        # Theoretical fallback
        upcoming_sat_dt = ref_dt + timedelta(days=((5 - ref_dt.weekday()) % 7))
        sat_rot = get_saturday_rotation(upcoming_sat_dt)
        sat_date_str = upcoming_sat_dt.strftime("%Y-%m-%d")
        sat_formatted_date = upcoming_sat_dt.strftime("%B %d, %Y")
        sat_am_staff = [{"name": "Bethel", "hours": "09:00–13:00", "notes": "M-LHD"}]
        sat_pm_staff = [{"name": "Hebron", "hours": "14:00–18:00", "notes": "A-LHD"}]

    # Week type estimation
    sat_dt_obj = datetime.strptime(sat_date_str, "%Y-%m-%d").date() if sat_date_str else ref_dt
    sat_week_type = "B" if any(x["name"] in ("Bethel", "BETHEL") for x in sat_am_staff) else "A"

    # 7. Real Sunday Squad Data from DB
    sun_day = next((d for d in period_days if datetime.strptime(d.date, "%Y-%m-%d").weekday() == 6), None)
    if not sun_day:
        sun_day = (
            db.query(ScheduleDay)
            .filter(ScheduleDay.is_weekend == True, ScheduleDay.day_of_week == 6)
            .order_by(ScheduleDay.date.desc())
            .first()
        )

    sun_squad_items = []
    sun_off_items = []
    sun_date_str = ""
    sun_formatted_date = ""

    if sun_day and sun_day.shifts:
        sun_date_str = sun_day.date
        sun_dt = datetime.strptime(sun_day.date, "%Y-%m-%d").date()
        sun_formatted_date = sun_dt.strftime("%B %d, %Y")
        for s in sun_day.shifts:
            name = s.employee.first_name if s.employee else "Staff"
            hours = f"{s.start_time}–{s.end_time}" if s.start_time else ""
            tasks = [t.task_name for t in s.tasks] if s.tasks else ([s.primary_task] if s.primary_task else [])
            info = {
                "name": name,
                "hours": hours,
                "tasks": tasks,
                "notes": s.notes or "",
                "position": s.employee.position if s.employee else "Agent"
            }
            if s.shift_type in ("SUNDAY_DUTY", "WORK"):
                sun_squad_items.append(info)
            else:
                sun_off_items.append(info)
    else:
        upcoming_sun_dt = ref_dt + timedelta(days=((6 - ref_dt.weekday()) % 7))
        sun_date_str = upcoming_sun_dt.strftime("%Y-%m-%d")
        sun_formatted_date = upcoming_sun_dt.strftime("%B %d, %Y")
        sun_squad_items = [
            {"name": "Yabsera N", "hours": "09:00–18:00", "tasks": ["Call Center", "Email", "QUE", "2839 phone"]},
            {"name": "Biruk", "hours": "08:00–17:00", "tasks": ["Call Center", "Telegram", "ELMS", "Follow up"]},
            {"name": "Tirsit", "hours": "08:00–17:00", "tasks": ["Call Center", "Follow up", "Email"]},
            {"name": "FERUZA", "hours": "09:00–18:00", "tasks": ["Call Center", "Telegram", "ELMS", "QUE"]},
            {"name": "BETHEL", "hours": "09:00–18:00", "tasks": ["Call Center", "2839 phone"]}
        ]

    # 8. Slot & Quality stats
    red_slots = sum(1 for slot in coverage_info.get("time_slots", []) if slot.get("status") == "RED")
    yellow_slots = sum(1 for slot in coverage_info.get("time_slots", []) if slot.get("status") == "YELLOW")
    conflicts_count = len(period.conflicts) if (period and period.conflicts) else 0

    # Schedule days list for day selector
    schedule_days_formatted = []
    for d in period_days:
        try:
            d_obj = datetime.strptime(d.date, "%Y-%m-%d")
            schedule_days_formatted.append({
                "date": d.date,
                "day_name": d_obj.strftime("%a"),
                "day_num": d_obj.day,
                "weekday_full": d_obj.strftime("%A"),
                "is_weekend": d_obj.weekday() >= 5,
                "is_sunday": d_obj.weekday() == 6,
                "is_saturday": d_obj.weekday() == 5,
            })
        except Exception:
            pass

    return {
        "schedule_id": period.id if period else 3,
        "schedule_name": period.name if period else "Guzo Go Schedule 05 Oct - 11 Oct",
        "schedule_start": period.start_date if period else "2026-10-05",
        "schedule_end": period.end_date if period else "2026-10-11",
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
        "schedule_days": schedule_days_formatted,
        "all_schedules": all_schedules,
        "upcoming_saturday": {
            "date": sat_date_str,
            "formatted_date": sat_formatted_date,
            "week_type": sat_week_type,
            "am_staff": sat_am_staff,
            "pm_staff": sat_pm_staff,
            "full_staff": sat_full_staff,
            "off_staff": sat_off_staff,
            "hebron": {"shift": "PM Half (14:00–18:00)" if any(x["name"] in ("Hebron", "HEBRON") for x in sat_pm_staff) else "Morning Half"},
            "beti": {"shift": "AM Half (09:00–13:00)" if any(x["name"] in ("Bethel", "BETHEL") for x in sat_am_staff) else "PM Half"}
        },
        "upcoming_sunday": {
            "date": sun_date_str,
            "formatted_date": sun_formatted_date,
            "duty_lead": sun_squad_items[0]["name"] if sun_squad_items else "Yabsera N",
            "squad_staff": [s["name"] for s in sun_squad_items],
            "squad_details": sun_squad_items,
            "off_staff": [s["name"] for s in sun_off_items],
            "total_squad": len(sun_squad_items)
        }
    }
