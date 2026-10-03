from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment, get_week_index_from_anchor
from app.engine.coverage import calculate_day_coverage, REQUIRED_SLOTS

def validate_schedule_period(period) -> Dict[str, Any]:
    """
    Validates all schedule days, shifts, assignments, and period constraints.
    Returns:
    {
        "is_valid": bool,
        "critical_errors": int,
        "warnings": int,
        "conflicts": [
            {
                "date": str,
                "employee_name": str,
                "severity": "critical" | "warning",
                "error_type": str,
                "message": str,
                "suggestion": str
            }
        ],
        "checklist": {
            "staff_count_configured": bool,
            "sunday_staffing_valid": bool,
            "saturday_rotation_valid": bool,
            "days_off_valid": bool,
            "lunch_coverage_valid": bool,
            "call_center_coverage_valid": bool
        }
    }
    """
    conflicts = []
    
    # Sort days chronologically
    days = sorted(period.days, key=lambda d: d.date)
    
    # Checklist booleans
    checklist = {
        "staff_count_configured": True,
        "sunday_staffing_valid": True,
        "saturday_rotation_valid": True,
        "days_off_valid": True,
        "lunch_coverage_valid": True,
        "call_center_coverage_valid": True
    }
    
    # Pre-map shifts: day_date -> {emp_name: shift}
    day_shift_map = {}
    emp_weekly_off_count = {} # (week_idx, emp_name) -> int
    
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        w_idx = get_week_index_from_anchor(d_obj)
        day_shift_map[day.date] = {}
        
        for s in day.shifts:
            emp_name = s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff")
            day_shift_map[day.date][emp_name] = s
            
            # Count off days
            key = (w_idx, emp_name)
            if key not in emp_weekly_off_count:
                emp_weekly_off_count[key] = 0
            if s.shift_type == "OFF":
                emp_weekly_off_count[key] += 1

    # --- 1. SUNDAY RULES ---
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:  # Sunday
            working_shifts = [s for s in day.shifts if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF")]
            count = len(working_shifts)
            
            # Exactly 4 staff on Sunday
            if count != 4:
                checklist["sunday_staffing_valid"] = False
                if count > 4:
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Multiple",
                        "severity": "critical",
                        "error_type": "SUNDAY_OVERSTAFFED",
                        "message": f"Sunday {day.date} has {count} employees scheduled. Maximum allowed is 4.",
                        "suggestion": "Adjust shifts so exactly 4 qualified employees work on Sunday."
                    })
                else:
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Multiple",
                        "severity": "critical",
                        "error_type": "SUNDAY_UNDERSTAFFED",
                        "message": f"Sunday {day.date} has only {count} employees scheduled. Exactly 4 are required.",
                        "suggestion": "Assign additional staff to Sunday duty to meet the required 4-person squad."
                    })
                    
            # Check Yordi & Obsa Sunday rule
            for s in working_shifts:
                emp_name = s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff")
                if emp_name in ("Yordi", "Obsa"):
                    checklist["sunday_staffing_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": emp_name,
                        "severity": "critical",
                        "error_type": "SUNDAY_OFF_RESTRICTION",
                        "message": f"{emp_name} is scheduled on Sunday {day.date}, but is strictly restricted to Sunday OFF.",
                        "suggestion": f"Change {emp_name}'s shift to OFF on Sunday."
                    })

            # Check Hebron and Beti Sunday alternation
            hebron_shift = day_shift_map[day.date].get("Hebron")
            beti_shift = day_shift_map[day.date].get("Beti")
            hebron_works = hebron_shift and hebron_shift.shift_type in ("WORK", "SUNDAY_DUTY")
            beti_works = beti_shift and beti_shift.shift_type in ("WORK", "SUNDAY_DUTY")
            
            if not hebron_works and not beti_works:
                checklist["sunday_staffing_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Hebron & Beti",
                    "severity": "critical",
                    "error_type": "HEBRON_BETI_BOTH_OFF",
                    "message": f"Hebron and Beti are both OFF on Sunday {day.date}. They must alternate Sunday duty.",
                    "suggestion": "Assign either Hebron or Beti to Sunday duty according to their rotation."
                })
            elif hebron_works and beti_works:
                checklist["sunday_staffing_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Hebron & Beti",
                    "severity": "critical",
                    "error_type": "HEBRON_BETI_BOTH_SUNDAY",
                    "message": f"Both Hebron and Beti are scheduled on Sunday {day.date}. They must alternate Sunday duty.",
                    "suggestion": "Only one of Hebron or Beti can work on Sunday."
                })
            else:
                expected = get_sunday_duty_assignment(d_obj)
                if expected["working"] == "Beti" and not beti_works:
                    checklist["sunday_staffing_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Beti",
                        "severity": "critical",
                        "error_type": "SUNDAY_ROTATION_MISMATCH",
                        "message": f"Week schedule dictates Beti should work Sunday {day.date}, but Beti is OFF.",
                        "suggestion": "Assign Beti to Sunday duty and set Hebron to OFF."
                    })
                elif expected["working"] == "Hebron" and not hebron_works:
                    checklist["sunday_staffing_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Hebron",
                        "severity": "critical",
                        "error_type": "SUNDAY_ROTATION_MISMATCH",
                        "message": f"Week schedule dictates Hebron should work Sunday {day.date}, but Hebron is OFF.",
                        "suggestion": "Assign Hebron to Sunday duty and set Beti to OFF."
                    })

            # Check Sunday Worker -> Monday OFF rule
            next_monday = d_obj + timedelta(days=1)
            next_monday_str = next_monday.strftime("%Y-%m-%d")
            if next_monday_str in day_shift_map:
                if hebron_works:
                    mon_hebron = day_shift_map[next_monday_str].get("Hebron")
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
                    mon_beti = day_shift_map[next_monday_str].get("Beti")
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

    # --- 2. HEBRON & BETI NEVER BOTH OFF (ANY DAY) ---
    for day in days:
        hebron_shift = day_shift_map[day.date].get("Hebron")
        beti_shift = day_shift_map[day.date].get("Beti")
        if hebron_shift and beti_shift:
            if hebron_shift.shift_type == "OFF" and beti_shift.shift_type == "OFF":
                checklist["days_off_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Hebron & Beti",
                    "severity": "critical",
                    "error_type": "HEBRON_BETI_MUTUAL_OFF",
                    "message": f"Hebron and Beti are both OFF on {day.date}. They can NEVER both be OFF on the same day.",
                    "suggestion": "Assign one of them to work on this day."
                })

    # --- 3. SATURDAY HALF-DAY ROTATION ---
    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 5:  # Saturday
            expected_sat = get_saturday_rotation(d_obj)
            hebron_shift = day_shift_map[day.date].get("Hebron")
            beti_shift = day_shift_map[day.date].get("Beti")
            
            # Check Hebron shift
            exp_h = expected_sat["Hebron"]["shift_type"]
            if not hebron_shift or hebron_shift.shift_type != exp_h:
                checklist["saturday_rotation_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Hebron",
                    "severity": "critical",
                    "error_type": "SATURDAY_ROTATION_VIOLATION",
                    "message": f"Saturday {day.date} is Week {expected_sat['week_type']}: Hebron must work {exp_h} ({expected_sat['Hebron']['start_time']}–{expected_sat['Hebron']['end_time']}).",
                    "suggestion": f"Change Hebron to {exp_h}."
                })
                
            # Check Beti shift
            exp_b = expected_sat["Beti"]["shift_type"]
            if not beti_shift or beti_shift.shift_type != exp_b:
                checklist["saturday_rotation_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "Beti",
                    "severity": "critical",
                    "error_type": "SATURDAY_ROTATION_VIOLATION",
                    "message": f"Saturday {day.date} is Week {expected_sat['week_type']}: Beti must work {exp_b} ({expected_sat['Beti']['start_time']}–{expected_sat['Beti']['end_time']}).",
                    "suggestion": f"Change Beti to {exp_b}."
                })

    # --- 4. CALL CENTER COVERAGE & LUNCH BREAK RESPECT ---
    for day in days:
        cov = calculate_day_coverage(day.shifts)
        for slot in cov["time_slots"]:
            if slot["status"] == "RED":
                checklist["call_center_coverage_valid"] = False
                conflicts.append({
                    "date": day.date,
                    "employee_name": "All Staff",
                    "severity": "critical",
                    "error_type": "CALL_CENTER_COVERAGE_GAP",
                    "message": f"Coverage problem on {day.date} during {slot['slot_name']}: 0 staff available for Call Center.",
                    "suggestion": f"Schedule at least 1-2 qualified staff members during {slot['slot_name']}."
                })
            elif slot["status"] == "YELLOW":
                conflicts.append({
                    "date": day.date,
                    "employee_name": "All Staff",
                    "severity": "warning",
                    "error_type": "CALL_CENTER_LIMITED_COVERAGE",
                    "message": f"Limited coverage on {day.date} during {slot['slot_name']}: only 1 staff available ({', '.join(slot['staff_names'])}).",
                    "suggestion": "Consider scheduling an additional qualified agent for redundancy."
                })

        # Check Yeab covers Beti during lunch and when Beti is OFF (Monday through Saturday)
        if d_obj.weekday() < 6:
            beti_s = day_shift_map[day.date].get("Beti")
            yeab_s = day_shift_map[day.date].get("Yeab")
            if beti_s and yeab_s:
                if beti_s.shift_type == "OFF":
                    if yeab_s.shift_type == "OFF":
                        checklist["call_center_coverage_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": "Yeab",
                            "severity": "critical",
                            "error_type": "BETI_COVERAGE_ABSENT",
                            "message": f"Beti is OFF on {day.date}, but Yeab is also OFF. Yeab must cover Call Center when Beti is OFF.",
                            "suggestion": "Schedule Yeab to work on this day to cover Beti's responsibilities."
                        })
                elif beti_s.shift_type in ("WORK", "AM_HALF", "PM_HALF"):
                    # Beti lunch is 14:00-15:00. Check Yeab is working and not on lunch at 14:00-15:00
                    if yeab_s.shift_type in ("WORK", "AM_HALF", "PM_HALF"):
                        if yeab_s.lunch_start == "14:00":
                            checklist["lunch_coverage_valid"] = False
                            conflicts.append({
                                "date": day.date,
                                "employee_name": "Yeab",
                                "severity": "critical",
                                "error_type": "BETI_LUNCH_COVERAGE_VIOLATION",
                                "message": f"Yeab has lunch at 14:00–15:00 on {day.date}, which conflicts with covering Beti's lunch.",
                                "suggestion": "Set Yeab's lunch to 13:00–14:00."
                            })

    # --- 5. TWO DAYS OFF PER WEEK ---
    for (w_idx, emp_name), off_days in emp_weekly_off_count.items():
        if off_days != 2:
            # We treat < 2 as warning or error depending on whether full week is in period
            checklist["days_off_valid"] = False
            conflicts.append({
                "date": f"Week {w_idx + 1}",
                "employee_name": emp_name,
                "severity": "critical" if off_days < 2 else "warning",
                "error_type": "DAYS_OFF_VIOLATION",
                "message": f"{emp_name} has {off_days} days OFF in Week {w_idx + 1}. Exactly 2 days OFF are required.",
                "suggestion": f"Adjust shifts so {emp_name} has exactly 2 days off during the week."
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
