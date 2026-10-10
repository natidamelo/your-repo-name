from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple, Optional, Set
import re
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment, get_week_index_from_anchor
from app.engine.coverage import calculate_day_coverage, REQUIRED_SLOTS

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

def parse_staff_set(staff_str: Optional[str]) -> Set[str]:
    if not staff_str:
        return set()
    res = set()
    for s in staff_str.split(','):
        cleaned = s.strip()
        if cleaned:
            res.add(normalize_name(cleaned))
    return res

def parse_days_off_target(desc: str) -> Optional[float]:
    """
    Parses how many days off are targeted from description.
    e.g. '1.5 days off' -> 1.5
         '0 full days off' / 'no day off' -> 0.0
         '1 full day off' / '1 day off' -> 1.0
         '2 days off' -> 2.0
    """
    d_low = desc.lower()
    if '1.5' in d_low or '1 and a half' in d_low or 'one and a half' in d_low:
        return 1.5
    if '0 day' in d_low or '0 full' in d_low or 'no day off' in d_low or 'zero day' in d_low:
        return 0.0
    if '1 day' in d_low or '1 full' in d_low or 'one day' in d_low or 'sunday off' in d_low or 'sunday day off' in d_low:
        return 1.0
    if '2 day' in d_low or '2 full' in d_low or 'two day' in d_low:
        return 2.0
    
    m = re.search(r'(\d+(\.\d+)?)\s*(?:full\s*)?day', d_low)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None

def load_system_constraints(db: Any = None) -> List[Any]:
    """
    Loads all SystemConstraint records from DB if available.
    """
    if db is not None:
        try:
            from app.models import SystemConstraint
            return db.query(SystemConstraint).all()
        except Exception as e:
            print(f"Notice: loading constraints via query: {e}")
    try:
        from app.database import SessionLocal
        from app.models import SystemConstraint
        with SessionLocal() as session:
            return session.query(SystemConstraint).all()
    except Exception as e:
        print(f"Notice: loading constraints via SessionLocal: {e}")
    return []

def validate_schedule_period(period, db: Any = None) -> Dict[str, Any]:
    """
    Validates all schedule days, shifts, assignments, and period constraints
    adhering strictly to active operational rules configured in System Constraints.
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
    
    # ── Load and categorize active system constraints ──
    all_constraints = load_system_constraints(db)
    
    if all_constraints:
        active_constraints = [c for c in all_constraints if getattr(c, 'is_active', True)]
    else:
        # Fallback to default in-memory rules if DB is uninitialized
        from app.routers.constraints import DEFAULT_CONSTRAINTS
        class MockConstraint:
            def __init__(self, d):
                self.rule_key = d.get('rule_key')
                self.title = d.get('title')
                self.category = d.get('category')
                self.staff_names = d.get('staff_names', '')
                self.description = d.get('description', '')
                self.is_active = d.get('is_active', True)
        active_constraints = [MockConstraint(d) for d in DEFAULT_CONSTRAINTS if d.get('is_active', True)]

    active_by_key: Dict[str, Any] = {}
    active_by_cat: Dict[str, List[Any]] = {}
    for c in active_constraints:
        rk = getattr(c, 'rule_key', None)
        if rk:
            active_by_key[rk] = c
        cat = getattr(c, 'category', 'GENERAL')
        active_by_cat.setdefault(cat, []).append(c)

    # Pre-map shifts: day_date -> {emp_name: shift}
    day_shift_map: Dict[str, Dict[str, Any]] = {}
    emp_weekly_full_offs: Dict[Tuple[int, str], int] = {}
    emp_weekly_half_shifts: Dict[Tuple[int, str], int] = {}

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

    # ── 1. SUNDAY RULES (SUNDAY_SQUAD Category) ──
    c_squad_5 = active_by_key.get('sunday_squad_5') or next(
        (c for c in active_by_cat.get('SUNDAY_SQUAD', []) if '5' in c.description or 'squad' in c.title.lower() or 'count' in c.description.lower()), 
        None
    )
    c_sun_off = active_by_key.get('yordi_obsa_sunday_off') or next(
        (c for c in active_constraints if ('mon-sat' in c.description.lower() or 'monday-saturday' in c.description.lower() or 'monday–saturday' in c.description.lower() or 'strictly sunday' in c.description.lower()) and c.category in ('DAYS_OFF', 'SUNDAY_SQUAD')), 
        None
    )
    c_sun_lead = active_by_key.get('sunday_lead_alternation') or next(
        (c for c in active_by_cat.get('SUNDAY_SQUAD', []) if 'alternat' in c.description.lower() or 'lead' in c.title.lower()), 
        None
    )

    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:  # Sunday
            working_shifts = [
                s for s in day.shifts 
                if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF")
            ]
            count = len(working_shifts)
            
            # Rule: Sunday staff count (Enforce only if Sunday squad constraint is active)
            if c_squad_5 is not None:
                target_count = 5
                m = re.search(r'(\d+)\s*staff', c_squad_5.description.lower())
                if m:
                    try: target_count = int(m.group(1))
                    except ValueError: pass

                if count != target_count:
                    checklist["sunday_staffing_valid"] = False
                    conflicts.append({
                        "date": day.date,
                        "employee_name": "Sunday Squad",
                        "severity": "critical" if abs(count - target_count) >= 2 else "warning",
                        "error_type": "SUNDAY_STAFF_COUNT",
                        "message": f"Sunday {day.date} has {count} staff scheduled. Exactly {target_count} staff are required by rule '{c_squad_5.title}'.",
                        "suggestion": f"Adjust Sunday shifts so exactly {target_count} qualified staff are on duty."
                    })
                    
            # Rule: Restricted Sunday OFF staff (Enforce only if constraint is active)
            if c_sun_off is not None:
                sunday_off_staff = parse_staff_set(c_sun_off.staff_names)
                for s in working_shifts:
                    raw_emp = s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff")
                    emp_norm = normalize_name(raw_emp)
                    if emp_norm in sunday_off_staff:
                        checklist["sunday_staffing_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": raw_emp,
                            "severity": "critical",
                            "error_type": "SUNDAY_OFF_RESTRICTION",
                            "message": f"{raw_emp} is scheduled on Sunday {day.date}, but rule '{c_sun_off.title}' requires Sunday OFF.",
                            "suggestion": f"Change {raw_emp}'s shift to OFF on Sunday."
                        })

            # Rule: Sunday Lead Alternation (Enforce only if constraint is active)
            if c_sun_lead is not None:
                lead_names = list(parse_staff_set(c_sun_lead.staff_names))
                if len(lead_names) >= 2:
                    lead_a, lead_b = lead_names[0], lead_names[1]
                    shift_a = day_shift_map[day.date].get(lead_a)
                    shift_b = day_shift_map[day.date].get(lead_b)
                    works_a = shift_a and shift_a.shift_type in ("WORK", "SUNDAY_DUTY")
                    works_b = shift_b and shift_b.shift_type in ("WORK", "SUNDAY_DUTY")
                    
                    if works_a and works_b:
                        checklist["sunday_staffing_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": f"{lead_a} & {lead_b}",
                            "severity": "critical",
                            "error_type": "HEBRON_BETI_BOTH_SUNDAY",
                            "message": f"Both {lead_a} and {lead_b} are scheduled on Sunday {day.date}. They must alternate Sunday duty on a bi-weekly basis.",
                            "suggestion": f"Only one of {lead_a} or {lead_b} can work on Sunday."
                        })

                    # Sunday Worker -> Monday OFF rule for the lead
                    next_monday = d_obj + timedelta(days=1)
                    next_monday_str = next_monday.strftime("%Y-%m-%d")
                    if next_monday_str in day_shift_map:
                        mon_shifts = day_shift_map[next_monday_str]
                        if works_a:
                            mon_a = mon_shifts.get(lead_a)
                            if mon_a and mon_a.shift_type != "OFF":
                                checklist["days_off_valid"] = False
                                conflicts.append({
                                    "date": next_monday_str,
                                    "employee_name": lead_a,
                                    "severity": "critical",
                                    "error_type": "SUNDAY_MONDAY_OFF_VIOLATION",
                                    "message": f"{lead_a} worked Sunday {day.date} and must be OFF on Monday {next_monday_str}.",
                                    "suggestion": f"Change {lead_a}'s Monday shift to OFF."
                                })
                        if works_b:
                            mon_b = mon_shifts.get(lead_b)
                            if mon_b and mon_b.shift_type != "OFF":
                                checklist["days_off_valid"] = False
                                conflicts.append({
                                    "date": next_monday_str,
                                    "employee_name": lead_b,
                                    "severity": "critical",
                                    "error_type": "SUNDAY_MONDAY_OFF_VIOLATION",
                                    "message": f"{lead_b} worked Sunday {day.date} and must be OFF on Monday {next_monday_str}.",
                                    "suggestion": f"Change {lead_b}'s Monday shift to OFF."
                                })

            # Check 2 or 3 Sunday workers have Monday off if squad constraint is active
            if c_squad_5 is not None:
                next_monday = d_obj + timedelta(days=1)
                next_monday_str = next_monday.strftime("%Y-%m-%d")
                if next_monday_str in day_shift_map:
                    mon_shifts = day_shift_map[next_monday_str]
                    sunday_worker_names = [
                        normalize_name(s.employee.first_name if (hasattr(s, "employee") and s.employee) else getattr(s, "employee_name", "Staff"))
                        for s in working_shifts
                    ]
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
                            "message": f"Only {sunday_workers_off_monday} Sunday duty staff have Monday OFF on {next_monday_str}. Target is 2 to 3 staff.",
                            "suggestion": "Schedule 2 to 3 of the Sunday duty staff for Monday Day OFF."
                        })

    # ── 2. SATURDAY HALF-DAY ROTATION & FERUZA TIE ──
    c_lead_rot = active_by_key.get('hebron_beti_leads') or next(
        (c for c in active_by_cat.get('LEAD_ROTATION', []) if 'saturday' in c.description.lower() or 'lead' in c.title.lower() or 'alternat' in c.description.lower()), 
        None
    )
    c_feruza = active_by_key.get('feruza_days_off') or next(
        (c for c in active_constraints if 'feruza' in c.title.lower() and 'beti' in c.description.lower()), 
        None
    )

    for day in days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 5:  # Saturday
            # Lead rotation check
            if c_lead_rot is not None:
                leads = list(parse_staff_set(c_lead_rot.staff_names))
                if len(leads) >= 2:
                    lead_1, lead_2 = leads[0], leads[1]
                    s1 = day_shift_map[day.date].get(lead_1)
                    s2 = day_shift_map[day.date].get(lead_2)
                    if s1 and s2:
                        t1, t2 = s1.shift_type, s2.shift_type
                        if t1 in ("AM_HALF", "PM_HALF") and t2 in ("AM_HALF", "PM_HALF") and t1 == t2:
                            checklist["saturday_rotation_valid"] = False
                            conflicts.append({
                                "date": day.date,
                                "employee_name": f"{lead_1} & {lead_2}",
                                "severity": "critical",
                                "error_type": "SATURDAY_SAME_HALF_CONFLICT",
                                "message": f"On Saturday {day.date}, both {lead_1} and {lead_2} are assigned to {t1}. One must be morning and the other afternoon.",
                                "suggestion": "Assign one to AM Half (Morning) and the other to PM Half (Afternoon)."
                            })

            # Feruza tie check
            if c_feruza is not None and "Feruza" in parse_staff_set(c_feruza.staff_names):
                feruza_shift = day_shift_map[day.date].get("Feruza")
                beti_shift = day_shift_map[day.date].get("Beti")
                if feruza_shift and beti_shift:
                    if feruza_shift.shift_type == "OFF" and beti_shift.shift_type != "OFF":
                        conflicts.append({
                            "date": day.date,
                            "employee_name": "Feruza",
                            "severity": "warning",
                            "error_type": "FERUZA_SATURDAY_SCHEDULE_TIE",
                            "message": f"Feruza is OFF on Saturday {day.date}, but rule '{c_feruza.title}' ties her schedule to Beti.",
                            "suggestion": "Align Feruza's Saturday coverage with Beti."
                        })

    # ── 3. EARLY MORNING RULE (08:00–17:00) ──
    early_morning_constraints = active_by_cat.get('EARLY_MORNING', []) + [
        c for c in active_constraints if c.rule_key == 'early_morning_0800' and c not in active_by_cat.get('EARLY_MORNING', [])
    ]
    if early_morning_constraints:
        early_morning_staff = set()
        for c in early_morning_constraints:
            early_morning_staff.update(parse_staff_set(c.staff_names))

        for day in days:
            d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
            weekday = d_obj.weekday()

            # Hebron Monday–Friday check if Hebron is configured in early morning
            if "Hebron" in early_morning_staff and weekday < 5:
                h_shift = day_shift_map[day.date].get("Hebron")
                if h_shift and h_shift.shift_type in ("WORK", "AM_HALF"):
                    if h_shift.start_time and h_shift.start_time != "08:00":
                        checklist["early_morning_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": "Hebron",
                            "severity": "critical",
                            "error_type": "EARLY_MORNING_RULE_VIOLATION",
                            "message": f"Hebron is scheduled starting at {h_shift.start_time} on {day.date}. Early morning constraint requires 08:00 start.",
                            "suggestion": "Set Hebron's start time to 08:00."
                        })

            # Other early morning staff whenever on work
            for name in early_morning_staff:
                if name == "Hebron": continue
                s_shift = day_shift_map[day.date].get(name)
                if s_shift and s_shift.shift_type in ("WORK", "SUNDAY_DUTY"):
                    if s_shift.start_time and s_shift.start_time != "08:00":
                        checklist["early_morning_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": name,
                            "severity": "critical",
                            "error_type": "EARLY_MORNING_RULE_VIOLATION",
                            "message": f"{name} is scheduled starting at {s_shift.start_time} on {day.date}. Early morning constraint requires 08:00 start.",
                            "suggestion": f"Change {name}'s start time to 08:00 (E-M shift)."
                        })

    # ── 4. MON–SAT WORKERS RESTRICTION (Yordi & Obsa) ──
    if c_sun_off is not None:
        mon_sat_staff = parse_staff_set(c_sun_off.staff_names)
        for day in days:
            d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
            if d_obj.weekday() < 6: # Mon–Sat
                for name in mon_sat_staff:
                    shift = day_shift_map[day.date].get(name)
                    if shift and shift.shift_type == "OFF":
                        conflicts.append({
                            "date": day.date,
                            "employee_name": name,
                            "severity": "warning",
                            "error_type": "MON_SAT_WORK_RULE",
                            "message": f"{name} is OFF on {day.date}. Rule '{c_sun_off.title}' specifies working Monday through Saturday.",
                            "suggestion": f"Schedule {name} to work on {day.date}."
                        })

    # ── 5. GDS-CAPABLE CHANNELS & MUTUAL BACKUP ──
    c_gds = active_by_key.get('gds_tasks_policy') or next(
        (c for c in active_by_cat.get('TASK_ROTATION', []) if 'gds' in c.description.lower() or 'gds' in c.title.lower()), 
        None
    )
    if c_gds is not None:
        gds_capable_pool = parse_staff_set(c_gds.staff_names)
        excluded_from_telegram = set()
        if "yabsera" in c_gds.description.lower() or "excluded" in c_gds.description.lower():
            excluded_from_telegram.update({"Yabsera N", "Yeab"})

        for day in days:
            for shift in day.shifts:
                raw_emp = shift.employee.first_name if (hasattr(shift, "employee") and shift.employee) else getattr(shift, "employee_name", "Staff")
                emp_norm = normalize_name(raw_emp)

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
                    
                    if is_gds_task and emp_norm not in gds_capable_pool:
                        checklist["gds_capability_valid"] = False
                        conflicts.append({
                            "date": day.date,
                            "employee_name": raw_emp,
                            "severity": "critical",
                            "error_type": "NON_GDS_STAFF_ON_GDS_CHANNEL",
                            "message": f"{raw_emp} is assigned to '{t_name}' on {day.date}, but GDS policy '{c_gds.title}' restricts this task to qualified GDS staff.",
                            "suggestion": "Reassign this task to a qualified GDS-capable agent."
                        })

                    if "telegram" in t_lower and emp_norm in excluded_from_telegram:
                        conflicts.append({
                            "date": day.date,
                            "employee_name": raw_emp,
                            "severity": "critical",
                            "error_type": "EXCLUDED_FROM_TELEGRAM_RULE",
                            "message": f"{raw_emp} is assigned to Telegram on {day.date}, but is excluded from Telegram rotation.",
                            "suggestion": "Assign Call Center or other channel to this agent instead of Telegram."
                        })

    # ── 6. DYNAMIC DAYS OFF COMPLIANCE ──
    # Build employee target days off from ALL active constraints in DAYS_OFF, LEAD_ROTATION, etc.
    staff_days_off_rule: Dict[str, Dict[str, Any]] = {}

    for c in active_constraints:
        if c.category in ('DAYS_OFF', 'LEAD_ROTATION') or 'days off' in c.description.lower() or 'day off' in c.description.lower():
            target = parse_days_off_target(c.description)
            assigned_staff = parse_staff_set(c.staff_names)
            
            # If target was successfully parsed (e.g. 1.5, 1.0, 0.0, 2.0)
            if target is not None:
                for s in assigned_staff:
                    staff_days_off_rule[s] = {
                        "target": target,
                        "title": c.title,
                        "rule_key": getattr(c, 'rule_key', '')
                    }

    # Check if standard 2 days off rule is active
    c_std_2 = active_by_key.get('standard_two_days_off') or next(
        (c for c in active_by_cat.get('DAYS_OFF', []) if 'standard' in c.title.lower() or 'rest of staff' in c.title.lower() or '2' in c.description), 
        None
    )
    is_standard_2_active = (c_std_2 is not None)

    for (w_idx, emp_name), full_offs in emp_weekly_full_offs.items():
        half_shifts = emp_weekly_half_shifts.get((w_idx, emp_name), 0)

        # Check if a specific active rule targets this employee
        if emp_name in staff_days_off_rule:
            rule_spec = staff_days_off_rule[emp_name]
            target = rule_spec["target"]
            rule_title = rule_spec["title"]

            if target == 1.5:
                # 1.5 days off: requires 1 full off + at least 1 half day (or >= 2 full offs)
                if (full_offs == 1 and half_shifts >= 1) or full_offs >= 2:
                    pass
                elif full_offs < 1:
                    checklist["days_off_valid"] = False
                    conflicts.append({
                        "date": f"Week {w_idx + 1}",
                        "employee_name": emp_name,
                        "severity": "critical",
                        "error_type": "DAYS_OFF_VIOLATION",
                        "message": f"{emp_name} has {full_offs} full days off in Week {w_idx + 1}. Minimum 1.5 days off required by rule '{rule_title}'.",
                        "suggestion": f"Schedule at least 1 full day off and 1 Saturday half-day for {emp_name}."
                    })
            elif target == 1.0:
                # 1 full day off required
                if full_offs < 1:
                    checklist["days_off_valid"] = False
                    conflicts.append({
                        "date": f"Week {w_idx + 1}",
                        "employee_name": emp_name,
                        "severity": "critical",
                        "error_type": "DAYS_OFF_VIOLATION",
                        "message": f"{emp_name} has 0 days off in Week {w_idx + 1}. At least 1 day OFF is mandatory under rule '{rule_title}'.",
                        "suggestion": f"Set {emp_name} to Day OFF on Sunday or another day."
                    })
            elif target == 0.0:
                # 0 days off explicitly allowed by configured rule! No conflict!
                pass
            elif target >= 2.0:
                if full_offs < 2:
                    checklist["days_off_valid"] = False
                    conflicts.append({
                        "date": f"Week {w_idx + 1}",
                        "employee_name": emp_name,
                        "severity": "critical",
                        "error_type": "DAYS_OFF_VIOLATION",
                        "message": f"{emp_name} has {full_offs} days OFF in Week {w_idx + 1}. Exactly 2 days OFF are required by rule '{rule_title}'.",
                        "suggestion": f"Adjust shifts so {emp_name} has 2 days off during the week."
                    })
        else:
            # Employee has no special active constraint.
            # Enforce standard 2 days off if standard rule is active in engine!
            if is_standard_2_active:
                if full_offs != 2:
                    conflicts.append({
                        "date": f"Week {w_idx + 1}",
                        "employee_name": emp_name,
                        "severity": "critical" if full_offs < 2 else "warning",
                        "error_type": "DAYS_OFF_VIOLATION",
                        "message": f"{emp_name} has {full_offs} days OFF in Week {w_idx + 1}. Standard policy requires 2 days OFF.",
                        "suggestion": f"Adjust shifts so {emp_name} has exactly 2 days off during the week."
                    })

    # ── 7. CALL CENTER COVERAGE ──
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
