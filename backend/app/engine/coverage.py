from typing import List, Dict, Any

REQUIRED_SLOTS = [
    {"index": 0, "name": "8:00–9:00", "start": "08:00", "end": "09:00", "target": 2, "min": 1, "is_peak": False},
    {"index": 1, "name": "9:00–12:00", "start": "09:00", "end": "12:00", "target": 2, "min": 1, "is_peak": True},
    {"index": 2, "name": "12:00–1:00", "start": "12:00", "end": "13:00", "target": 2, "min": 1, "is_peak": False},
    {"index": 3, "name": "1:00–2:00", "start": "13:00", "end": "14:00", "target": 2, "min": 1, "is_peak": False},
    {"index": 4, "name": "2:00–5:00", "start": "14:00", "end": "17:00", "target": 2, "min": 1, "is_peak": True},
    {"index": 5, "name": "5:00–6:00", "start": "17:00", "end": "18:00", "target": 2, "min": 1, "is_peak": False},
]

CHANNELS = [
    "Call Center",
    "Telegram",
    "GDS",
    "2839 phone",
    "Email",
    "ELMS",
    "QUE",
    "Amadeus"
]

def parse_time_to_minutes(time_str: str) -> int:
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def is_overlapping(start1: str, end1: str, start2: str, end2: str) -> bool:
    s1, e1 = parse_time_to_minutes(start1), parse_time_to_minutes(end1)
    s2, e2 = parse_time_to_minutes(start2), parse_time_to_minutes(end2)
    return max(s1, s2) < min(e1, e2)

def is_staff_on_lunch(shift, slot_start: str, slot_end: str) -> bool:
    if not shift.lunch_start or not shift.lunch_end:
        return False
    # If the lunch interval completely contains or overlaps the slot
    l_start = parse_time_to_minutes(shift.lunch_start)
    l_end = parse_time_to_minutes(shift.lunch_end)
    s_start = parse_time_to_minutes(slot_start)
    s_end = parse_time_to_minutes(slot_end)
    # Check if more than half of the slot is in lunch
    overlap = max(0, min(l_end, s_end) - max(l_start, s_start))
    slot_duration = s_end - s_start
    return overlap >= (slot_duration / 2)

def calculate_day_coverage(shifts: list) -> Dict[str, Any]:
    """
    Given a list of ShiftAssignment objects for a specific day,
    computes coverage across the 6 required time slots and across all channels.
    """
    time_slots_res = []
    
    # Filter active working shifts
    active_shifts = [s for s in shifts if s.shift_type in ("WORK", "AM_HALF", "PM_HALF", "SUNDAY_DUTY")]
    
    total_slots = len(REQUIRED_SLOTS)
    green_count = 0
    yellow_count = 0
    red_count = 0
    total_agents_across_slots = 0
    total_target_across_slots = 0
    
    for slot in REQUIRED_SLOTS:
        covering_staff = []
        for s in active_shifts:
            if not s.start_time or not s.end_time:
                continue
            
            # Check if shift covers this slot time
            if is_overlapping(s.start_time, s.end_time, slot["start"], slot["end"]):
                # Check if employee is on lunch during this slot
                if is_staff_on_lunch(s, slot["start"], slot["end"]):
                    continue
                
                # Check if employee or their task assignment covers Call Center
                emp_name = s.employee.first_name if (hasattr(s, "employee") and s.employee) else (getattr(s, "employee_name", "Staff"))
                
                # Check specific tasks or primary/secondary
                is_cc = False
                if getattr(s, "primary_task", None) == "Call Center" or getattr(s, "secondary_task", None) == "Call Center":
                    is_cc = True
                elif hasattr(s, "tasks") and s.tasks:
                    for t in s.tasks:
                        if t.task_name == "Call Center" and is_overlapping(t.start_time, t.end_time, slot["start"], slot["end"]):
                            is_cc = True
                            break
                else:
                    # In standard call center operations, working staff with Call Center skill cover
                    is_cc = True
                
                if is_cc:
                    covering_staff.append(emp_name)
                    
        count = len(covering_staff)
        if count >= slot["target"]:
            status = "GREEN"
            green_count += 1
        elif count >= slot["min"]:
            status = "YELLOW"
            yellow_count += 1
        else:
            status = "RED"
            red_count += 1
        
        total_agents_across_slots += count
        total_target_across_slots += slot["target"]
            
        time_slots_res.append({
            "slot_index": slot["index"],
            "slot_name": slot["name"],
            "start_time": slot["start"],
            "end_time": slot["end"],
            "staff_count": count,
            "target_count": slot["target"],
            "status": status,
            "staff_names": covering_staff,
            "is_peak": slot.get("is_peak", False),
            "fill_pct": min(100, round((count / max(slot["target"], 1)) * 100))
        })
        
    # Channel coverage
    channels_res = []
    for ch in CHANNELS:
        ch_staff = []
        for s in active_shifts:
            emp_name = s.employee.first_name if (hasattr(s, "employee") and s.employee) else (getattr(s, "employee_name", "Staff"))
            # Check employee skills or tasks
            has_ch = False
            if hasattr(s, "employee") and s.employee and hasattr(s.employee, "skills"):
                for es in s.employee.skills:
                    if (es.skill and es.skill.name.lower() == ch.lower()) or (es.skill and es.skill.code.lower() == ch.lower().replace(" ", "_")):
                        has_ch = True
                        break
            elif getattr(s, "primary_task", None) == ch or getattr(s, "secondary_task", None) == ch:
                has_ch = True
            else:
                has_ch = True # fallback
                
            if has_ch and emp_name not in ch_staff:
                ch_staff.append(emp_name)
                
        count = len(ch_staff)
        status = "GREEN" if count >= 2 else ("YELLOW" if count == 1 else "RED")
        channels_res.append({
            "channel": ch,
            "available_staff_count": count,
            "target_count": 2,
            "status": status,
            "staff_names": ch_staff
        })
    
    # Day-level score
    day_score = round((total_agents_across_slots / max(total_target_across_slots, 1)) * 100)
    day_score = min(day_score, 100)
    
    return {
        "time_slots": time_slots_res,
        "channels": channels_res,
        "day_stats": {
            "green_slots": green_count,
            "yellow_slots": yellow_count,
            "red_slots": red_count,
            "total_slots": total_slots,
            "coverage_score": day_score,
            "total_active_staff": len(active_shifts),
        }
    }


def calculate_matrix_summary(matrix_rows: list) -> Dict[str, Any]:
    """
    Given a list of day-coverage rows (each with day_stats),
    produces overall schedule-level summary statistics.
    """
    total_days = len(matrix_rows)
    if total_days == 0:
        return {
            "overall_score": 0,
            "total_green": 0,
            "total_yellow": 0,
            "total_red": 0,
            "total_cells": 0,
            "worst_day": None,
            "best_day": None,
            "avg_agents_per_slot": 0,
            "gap_days": [],
        }
    
    total_green = 0
    total_yellow = 0
    total_red = 0
    total_cells = 0
    worst_score = 999
    best_score = -1
    worst_day = None
    best_day = None
    gap_days = []
    score_sum = 0
    
    for row in matrix_rows:
        stats = row.get("day_stats", {})
        g = stats.get("green_slots", 0)
        y = stats.get("yellow_slots", 0)
        r = stats.get("red_slots", 0)
        s = stats.get("coverage_score", 0)
        
        total_green += g
        total_yellow += y
        total_red += r
        total_cells += stats.get("total_slots", 6)
        score_sum += s
        
        if s < worst_score:
            worst_score = s
            worst_day = row.get("date")
        if s > best_score:
            best_score = s
            best_day = row.get("date")
        if r > 0:
            gap_days.append({
                "date": row.get("date"),
                "day_name": row.get("day_name"),
                "red_count": r,
            })
    
    overall_score = round(score_sum / total_days) if total_days else 0
    
    return {
        "overall_score": overall_score,
        "total_green": total_green,
        "total_yellow": total_yellow,
        "total_red": total_red,
        "total_cells": total_cells,
        "worst_day": worst_day,
        "best_day": best_day,
        "avg_agents_per_slot": round(total_green / max(total_cells, 1) * 100),
        "gap_days": gap_days[:5],  # top 5 problem days
        "total_days": total_days,
    }
