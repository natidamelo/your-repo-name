from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment, get_week_index_from_anchor
from app.engine.coverage import calculate_day_coverage, REQUIRED_SLOTS

# GDS-capable staff pool (as defined by system specifications)
GDS_CAPABLE_STAFF = {
    "Hebron", "Beti", "Feruza", "Biruk", "Tirsit", "Rediet", "Hermela", "Shalom", "Yabsera N", "Yeab"
}

# Non-GDS or excluded from Telegram rotation
EXCLUDED_FROM_TELEGRAM = {"Yabsera N", "Yeab"}

# Staff with 1.5 days off per week (1 full day off + 1 half day)
ONE_AND_HALF_OFF_STAFF = {"Hebron", "Beti", "Feruza"}

# Staff who work Mon–Sat and are strictly Sunday OFF
MON_SAT_WORKERS = {"Yordi", "Yordanos", "Obsa", "Obsan"}

# Staff who MUST ALWAYS be early morning (08:00 start) when working
ALWAYS_EARLY_MORNING = {"Shalom", "Rediet", "Tirsit"}

def validate_schedule_period(period) -> Dict[str, Any]:
    """
    Validates all schedule days, shifts, assignments, and period constraints
    adhering strictly to call center operational rules.
    """
    conflicts = []
    days = sorted(period.days, key=lambda d: d.date)
    
    checklist = {
        "staff_count_configured": True,
        "sunday_staffing_valid": True,
        "saturday_rotation_valid": True,
        "days_off_valid": True,
        "early_morning_valid": True,
        "gds_capability_valid": True,
        "call_center_coverage_valid": True
    }
    
    # Pre-map shifts: day_date -> {emp_name: shift}
    day_shift_map: Dict[str, Dict[str, Any]] = {}
    emp_weekly_full_offs: Dict[Tuple[int, str], int] = {}
    emp_weekly_half_shifts: Dict[Tuple[int, str], int] = {}

    def normalize_name(raw_name: str) -> str:
        r = raw_name.strip()
        r_lower = r.lower()
        if 'beti' in r_lower or 'bethel' in r_lower: return 'Beti'
        if 'hebron' in r_lower: return 'Hebron'
        if 'feruza' in r_lower: return 'Feruza'
        if 'yordi' in r_lower or 'yordanos' in r_lower: return 'Yordi'
        if 'obsa' in r_lower or 'obsan' in r_lower: return 'Obsa'
        if 'shalom' in r_lower: return 'Shalom'
        if 'rediet' in r_lower: return 'Rediet'
        if 'tirsit' in r_lower: return 'Tirsit'
        if 'biruk' in r_lower: return 'Biruk'
        if 'hermela' in r_lower: return 'Hermela'
        if 'luam' in r_lower or 'luwam' in r_lower: return 'Luam'
        if 'yabsera' in r_lower or 'yeab' in r_lower: return 'Yabsera N'
        return r

    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        w_idx = get_week_index_from_anchor(d_obj)
        day_shift_map[day.date] = {}
        
        for s in day.shifts:
            raw_emp = s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff")
            emp_name = normalize_name(raw_emp)
            day_shift_map[day.date][emp_name] = s
            
            key = (w_idx, emp_name)
            if key not in emp_weekly_full_offs:
                emp_weekly_full_offs[key] = 0
                emp_weekly_half_shifts[key] = 0

            if s.shift_type == "OFF":
                emp_weekly_full_offs[key] += 1
            elif s.shift_type in ("AM_HALF", "PM_HALF"):
                emp_weekly_half_shifts[key] += 1

    # --- 1. SUNDAY RULES ---
    # Rule: Sunday needs exactly 5 staff.
    # Rule: Hebron & Beti alternate on bi-weekly basis. One works, other is off.
    # Rule: Sunday duty worker gets Monday OFF.
    # Rule: 2 or 3 out of the 5 Sunday workers must be OFF on Monday.
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:  # Sunday
            working_shifts = [
                s for s in day.shifts 
                if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF")
            ]
            count = len(working_shifts)
            
            # Exactly 5 staff on Sunday
            if count != 5:
                checklist["sunday_staffing_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Sunday Squad",
                    "severity": "critical" if abs(count - 5) >= 2 else "warning",
                    "error_type": "SUNDAY_STAFF_COUNT",
                    "message": f"Sunday {day.date} has {count} staff scheduled. Exactly 5 staff are required by operational rules.",
                    "suggestion": "Adjust Sunday shifts so exactly 5 qualified staff are on duty."
                })
                    
            # Check Yordi & Obsa Sunday OFF rule
            for s in working_shifts:
                raw_emp = s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff")
                emp_norm = normalize_name(raw_emp)
                if emp_norm in ("Yordi", "Obsa"):
                    checklist["sunday_staffing_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": raw_emp,
                        "severity": "critical",
                        "error_type": "SUNDAY_OFF_RESTRICTION",
                        "message": f"{raw_emp} is scheduled on Sunday {day.date}, but Yordi and Obsa are strictly restricted to Sunday OFF.",
                        "suggestion": f"Change {raw_emp}'s shift to OFF on Sunday."
                    })

            # Check Hebron and Beti Sunday Bi-Weekly Alternation
            hebron_shift = day_shift_map[day.date].get("Hebron")
            beti_shift = day_shift_map[day.date].get("Beti")
            hebron_works = hebron_shift and hebron_shift.shift_type in ("WORK", "SUNDAY_DUTY")
            beti_works = beti_shift and beti_shift.shift_type in ("WORK", "SUNDAY_DUTY")
            
            if hebron_works and beti_works:
                checklist["sunday_staffing_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Hebron & Beti",
                    "severity": "critical",
                    "error_type": "HEBRON_BETI_BOTH_SUNDAY",
                    "message": f"Both Hebron and Beti are scheduled on Sunday {day.date}. They must alternate Sunday duty on a bi-weekly basis.",
                    "suggestion": "Only one of Hebron or Beti can work on Sunday."
                })

            # Check Sunday Worker -> Monday OFF rule (especially for duty leads and squad)
            next_monday = d_obj + timedelta(days=1)
            next_monday_str = next_monday.strftime("%Y-%m-%d")
            if next_monday_str in day_shift_map:
                mon_shifts = day_shift_map[next_monday_str]
                sunday_worker_names = [
                    normalize_name(s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff"))
                    for s in working_shifts
                ]

                # Lead Monday off rule
                if hebron_works:
                    mon_hebron = mon_shifts.get("Hebron")
                    if mon_hebron and mon_hebron.shift_type != "OFF":
                        checklist["days_off_valid"] = False
                        conflicts.append({
                            "date": next_monday_str,
                            "employee_name": "Hebron",
                            "severity": "critical",
                            "error_type": "SUNDAY_MONDAY_OFF_VIOLATION",
                            "message": f"Hebron worked Sunday {day.date} and must be OFF on Monday {next_monday_str}.",
                            "suggestion": "Change Hebron's Monday shift to OFF."
                        })
                if beti_works:
                    mon_beti = mon_shifts.get("Beti")
                    if mon_beti and mon_beti.shift_type != "OFF":
                        checklist["days_off_valid"] = False
                        conflicts.append({
                            "date": next_monday_str,
                            "employee_name": "Beti",
                            "severity": "critical",
                            "error_type": "SUNDAY_MONDAY_OFF_VIOLATION",
                            "message": f"Beti worked Sunday {day.date} and must be OFF on Monday {next_monday_str}.",
                            "suggestion": "Change Beti's Monday shift to OFF."
                        })

                # Check that 2 or 3 of the 5 Sunday workers have Monday off
                sunday_workers_off_monday = sum(
                    1 for name in sunday_worker_names 
                    if mon_shifts.get(name) and mon_shifts[name].shift_type == "OFF"
                )
                if sunday_workers_off_monday < 2:
                    conflicts.append({
                        "date": next_monday_str,
                        "employee_name": "Sunday Squad",
                        "severity": "warning",
                        "error_type": "SUNDAY_TO_MONDAY_OFF_BALANCE",
                        "message": f"Only {sunday_workers_off_monday} Sunday duty staff have Monday OFF on {next_monday_str}. Rule target is 2 to 3 staff.",
                        "suggestion": "Schedule 2 to 3 of the Sunday duty staff for Monday Day OFF."
                    })

    # --- 2. SATURDAY HALF-DAY ROTATION & FERUZA TIE ---
    # Rule: On Saturday whenever Beti is morning then Hebron is afternoon and vice versa (weekly).
    # Rule: Whenever Hebron is dayoff / PM on Saturday, Feruza is at work tied to Beti.
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 5:  # Saturday
            hebron_shift = day_shift_map[day.date].get("Hebron")
            beti_shift = day_shift_map[day.date].get("Beti")
            feruza_shift = day_shift_map[day.date].get("Feruza")

            if hebron_shift and beti_shift:
                h_type = hebron_shift.shift_type
                b_type = beti_shift.shift_type

                # Both cannot be on the same half
                if h_type in ("AM_HALF", "PM_HALF") and b_type in ("AM_HALF", "PM_HALF") and h_type == b_type:
                    checklist["saturday_rotation_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Hebron & Beti",
                        "severity": "critical",
                        "error_type": "SATURDAY_SAME_HALF_CONFLICT",
                        "message": f"On Saturday {day.date}, both Hebron and Beti are assigned to {h_type}. One must be morning and the other afternoon.",
                        "suggestion": "Assign one to AM Half (Morning) and the other to PM Half (Afternoon)."
                    })

            # Feruza tied to Beti schedule on Saturday
            if feruza_shift and beti_shift:
                if feruza_shift.shift_type == "OFF" and beti_shift.shift_type != "OFF":
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Feruza",
                        "severity": "warning",
                        "error_type": "FERUZA_SATURDAY_SCHEDULE_TIE",
                        "message": f"Feruza is OFF on Saturday {day.date}, but she is tied to Beti's Saturday schedule.",
                        "suggestion": "Align Feruza's Saturday coverage with Beti."
                    })

    # --- 3. EARLY MORNING RULE (08:00–17:00) ---
    # Rule: Hebron is early morning from Monday to Friday always.
    # Rule: Shalom, Rediet, Tirsit are always early morning whenever they are on work.
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        weekday = d_obj.weekday()

        # Hebron Monday–Friday
        if weekday < 5:
            h_shift = day_shift_map[day.date].get("Hebron")
            if h_shift and h_shift.shift_type in ("WORK", "AM_HALF"):
                if h_shift.start_time and h_shift.start_time != "08:00":
                    checklist["early_morning_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Hebron",
                        "severity": "critical",
                        "error_type": "EARLY_MORNING_RULE_VIOLATION",
                        "message": f"Hebron is scheduled starting at {h_shift.start_time} on {day.date}. Hebron MUST ALWAYS be Early Morning (08:00) Monday–Friday.",
                        "suggestion": "Set Hebron's start time to 08:00."
                    })

        # Shalom, Rediet, Tirsit whenever on work
        for name in ALWAYS_EARLY_MORNING:
            s_shift = day_shift_map[day.date].get(name)
            if s_shift and s_shift.shift_type in ("WORK", "SUNDAY_DUTY"):
                if s_shift.start_time and s_shift.start_time != "08:00":
                    checklist["early_morning_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": name,
                        "severity": "critical",
                        "error_type": "EARLY_MORNING_RULE_VIOLATION",
                        "message": f"{name} is scheduled starting at {s_shift.start_time} on {day.date}. {name} MUST ALWAYS be Early Morning (08:00) when working.",
                        "suggestion": f"Change {name}'s start time to 08:00 (E-M shift)."
                    })

    # --- 4. YORDI & OBSA WORK MON-SAT, DAY OFF SUNDAY ---
    # Rule: Yordi and obsa are always work from monday - saturday and day off sunday.
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        weekday = d_obj.weekday()
        if weekday < 6: # Mon - Sat
            for name in ("Yordi", "Obsa"):
                shift = day_shift_map[day.date].get(name)
                if shift and shift.shift_type == "OFF":
                    conflicts.append({
                        "date": day.date,
                        "employee_name": name,
                        "severity": "warning",
                        "error_type": "MON_SAT_WORK_RULE",
                        "message": f"{name} is OFF on {day.date}. Rule specifies Yordi and Obsa work Monday through Saturday.",
                        "suggestion": f"Schedule {name} to work on {day.date}."
                    })

    # --- 5. GDS-CAPABLE CHANNELS & MUTUAL BACKUP ---
    # Rule: Telegram/ELMS/Q/E are only to be handled by GDS capable staff.
    # Rule: Yabsera N is excluded from Telegram rotation.
    for day in days:
        for shift in day.shifts:
            raw_emp = shift.employee.first_name if (hasattr(shift, "employee") and shift.employee) else getattr(shift, "employee_name", "Staff")
            emp_norm = normalize_name(raw_emp)

            # Check tasks
            tasks = []
            if shift.tasks:
                tasks.extend([t.task_name for t in shift.tasks])
            if shift.primary_task:
                tasks.append(shift.primary_task)
            if shift.secondary_task:
                tasks.append(shift.secondary_task)

            for t_name in tasks:
                t_lower = t_name.lower()
                is_gds_task = any(k in t_lower for k in ("telegram", "elms", "que", "email"))
                
                # Check GDS capability
                if is_gds_task and emp_norm not in GDS_CAPABLE_STAFF:
                    checklist["gds_capability_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": raw_emp,
                        "severity": "critical",
                        "error_type": "NON_GDS_STAFF_ON_GDS_CHANNEL",
                        "message": f"{raw_emp} is assigned to '{t_name}' on {day.date}, but Telegram/ELMS/Q/E can only be handled by GDS-capable staff.",
                        "suggestion": "Reassign this task to a qualified GDS-capable agent."
                    })

                # Check Yabsera N Telegram exclusion
                if "telegram" in t_lower and emp_norm in EXCLUDED_FROM_TELEGRAM:
                    conflicts.append({
                        "date": day.date,
                        "employee_name": raw_emp,
                        "severity": "critical",
                        "error_type": "EXCLUDED_FROM_TELEGRAM_RULE",
                        "message": f"{raw_emp} is assigned to Telegram on {day.date}, but Yabsera N is excluded from Telegram rotation.",
                        "suggestion": "Assign Call Center or other channel to Yabsera N instead of Telegram."
                    })

    # --- 6. DAYS OFF COMPLIANCE ---
    # Rule: Hebron & Beti have 1.5 days off (1 full day + 1 half day).
    # Rule: Feruza has 1.5 days off (1 full day + 1 half day).
    # Rule: The rest of agents have 2 days off per week.
    for (w_idx, emp_name), full_offs in emp_weekly_full_offs.items():
        half_shifts = emp_weekly_half_shifts.get((w_idx, emp_name), 0)

        if emp_name in ONE_AND_HALF_OFF_STAFF:
            # 1.5 days off = 1 full off + 1 half day (or 2 full offs if no half day scheduled)
            if full_offs == 1 and half_shifts >= 1:
                # Valid 1.5 days off
                pass
            elif full_offs == 2:
                # Also acceptable (2 full days off)
                pass
            elif full_offs < 1:
                checklist["days_off_valid"] = False
                conflicts.append({
                    "date": f"Week {w_idx + 1}",
                    "employee_name": emp_name,
                    "severity": "critical",
                    "error_type": "DAYS_OFF_VIOLATION",
                    "message": f"{emp_name} has {full_offs} full days off in Week {w_idx + 1}. Minimum 1.5 days off required.",
                    "suggestion": f"Schedule at least 1 full day off and 1 Saturday half-day for {emp_name}."
                })
        elif emp_name in ("Yordi", "Obsa"):
            # Yordi and Obsa have Sunday off (1 day off)
            if full_offs < 1:
                checklist["days_off_valid"] = False
                conflicts.append({
                    "date": f"Week {w_idx + 1}",
                    "employee_name": emp_name,
                    "severity": "critical",
                    "error_type": "DAYS_OFF_VIOLATION",
                    "message": f"{emp_name} has 0 days off in Week {w_idx + 1}. Sunday Day OFF is mandatory.",
                    "suggestion": f"Set {emp_name} to Day OFF on Sunday."
                })
        else:
            # All other regular agents require exactly 2 days off per week
            if full_offs != 2:
                conflicts.append({
                    "date": f"Week {w_idx + 1}",
                    "employee_name": emp_name,
                    "severity": "critical" if full_offs < 2 else "warning",
                    "error_type": "DAYS_OFF_VIOLATION",
                    "message": f"{emp_name} has {full_offs} days OFF in Week {w_idx + 1}. Exactly 2 days OFF are required by standard policy.",
                    "suggestion": f"Adjust shifts so {emp_name} has exactly 2 days off during the week."
                })

    # --- 7. CALL CENTER COVERAGE ---
    for day in days:
        cov = calculate_day_coverage(day.shifts)
        for slot in cov["time_slots"]:
            if slot["status"] == "RED":
                checklist["call_center_coverage_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Call Center Team",
                    "severity": "critical",
                    "error_type": "CALL_CENTER_COVERAGE_GAP",
                    "message": f"Critical gap on {day.date} during {slot['slot_name']}: 0 staff available for Call Center.",
                    "suggestion": f"Schedule at least 1-2 qualified agents during {slot['slot_name']}."
                })

    critical_count = sum(1 for c in conflicts if c["severity"] == "critical")
    warning_count = sum(1 for c in conflicts if c["severity"] == "warning")
    
    return {
        "is_valid": (critical_count == 0),
        "critical_errors": critical_count,
        "warnings": warning_count,
        "conflicts": conflicts,
        "checklist": checklist
    }
