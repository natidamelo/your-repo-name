from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment, get_week_index_from_anchor
from app.engine.validator import validate_schedule_period

# Standard working hours and profile data for the 12 staff
STAFF_PROFILES = {
    "Hebron": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Telegram",
        "secondary_task": "Call Center", # 8-9, 1-2
        "skills": ["GDS", "Telegram", "Call Center", "2839 phone", "Email", "QUE", "ELMS"]
    },
    "Shalom": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "GDS",
        "skills": ["Junior GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    },
    "Biruk": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "Telegram", # Backup
        "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    },
    "Luam": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "Amadeus",
        "skills": ["Call Center", "Amadeus"]
    },
    "Feruza": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Telegram",
        "secondary_task": "Call Center", # 12-1 PM
        "skills": ["GDS", "Telegram", "Junior Amadeus", "ELMS", "Email", "QUE"]
    },
    "Tirsit": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "Telegram",
        "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    },
    "Rediet": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "Telegram",
        "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    },
    "Yordi": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "Telegram",
        "skills": ["Call Center", "Amadeus"]
    },
    "Hermela": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Telegram",
        "secondary_task": "Call Center",
        "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    },
    "Obsa": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "Amadeus",
        "skills": ["Call Center", "Amadeus"]
    },
    "Beti": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "14:00",
        "lunch_end": "15:00",
        "primary_task": "Call Center",
        "secondary_task": "Amadeus",
        "skills": ["Call Center", "Amadeus"]
    },
    "Yeab": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "GDS",
        "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"]
    }
}

class EphemeralPeriod:
    """Lightweight container used for validation before saving to DB."""
    def __init__(self, start_date: str, end_date: str, days: list):
        self.start_date = start_date
        self.end_date = end_date
        self.days = days

class EphemeralDay:
    def __init__(self, date_str: str, day_of_week: int, shifts: list):
        self.date = date_str
        self.day_of_week = day_of_week
        self.shifts = shifts

class EphemeralShift:
    def __init__(self, employee_id: int, employee_name: str, shift_type: str,
                 start_time: str = None, end_time: str = None,
                 lunch_start: str = None, lunch_end: str = None,
                 primary_task: str = None, secondary_task: str = None,
                 notes: str = None, tasks: list = None):
        self.employee_id = employee_id
        self.employee_name = employee_name
        self.shift_type = shift_type
        self.start_time = start_time
        self.end_time = end_time
        self.lunch_start = lunch_start
        self.lunch_end = lunch_end
        self.primary_task = primary_task
        self.secondary_task = secondary_task
        self.notes = notes
        self.tasks = tasks or []
        
        # Mock employee property for validator
        class MockEmp:
            def __init__(self, name):
                self.first_name = name
                self.skills = []
        self.employee = MockEmp(employee_name)

def generate_schedule_data(start_date_str: str, duration_weeks: int, employee_db_map: dict = None) -> Tuple[Any, Dict[str, Any]]:
    """
    Generates a conflict-free schedule for 1, 2, or 4 weeks.
    employee_db_map: optional dict of {first_name: db_employee_id}
    """
    start_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    total_days = duration_weeks * 7
    days_data = []

    # Map names to IDs if provided
    def get_emp_id(name: str) -> int:
        if employee_db_map and name in employee_db_map:
            return employee_db_map[name]
        return 0

    # Non-Beti/Hebron candidate pool for Sunday duty (3 people per Sunday, alternating)
    sunday_pool_a = ["Shalom", "Biruk", "Luam"]
    sunday_pool_b = ["Feruza", "Tirsit", "Rediet"]
    sunday_pools = [sunday_pool_a, sunday_pool_b]

    # Precompute schedule week by week (each 7 days: Monday to Sunday)
    for w in range(duration_weeks):
        week_start_dt = start_dt + timedelta(days=w * 7)
        week_idx = get_week_index_from_anchor(week_start_dt)
        is_even_week = (week_idx % 2 == 0) # Week A / Week 1

        # Sunday duty decision
        # Week 1 (even): Beti works Sunday, Hebron OFF
        # Week 2 (odd): Hebron works Sunday, Beti OFF
        sat_rotation = get_saturday_rotation(week_start_dt + timedelta(days=5))

        # 3 other Sunday staff for this week
        sunday_squad_others = sunday_pools[week_idx % len(sunday_pools)]

        # Off days map for this week
        off_days_map = {}
        for emp_name in STAFF_PROFILES.keys():
            off_days_map[emp_name] = set()

        if is_even_week:
            # Beti works Sunday
            # If this is week 0 (initial anchor start), Hebron did not work preceding Sunday in this window
            # If week_idx > 0, preceding week was odd -> Hebron worked Sunday -> Hebron is OFF on Monday (0)
            if week_idx > 0:
                off_days_map["Hebron"] = {0, 6} # Mon, Sun
                off_days_map["Beti"] = {1, 3}   # Tue, Thu (works Sun)
                off_days_map["Yeab"] = {2, 6}   # Wed, Sun (covers Beti on Tue, Thu)
            else:
                off_days_map["Hebron"] = {2, 6} # Wed, Sun
                off_days_map["Beti"] = {1, 3}   # Tue, Thu (works Sun)
                off_days_map["Yeab"] = {2, 6}   # Wed, Sun
        else:
            # Odd week: Hebron works Sunday, Beti is OFF Sunday
            # Preceding week was even -> Beti worked Sunday -> Beti is strictly OFF Monday (0)
            off_days_map["Beti"] = {0, 6}       # Mon, Sun
            off_days_map["Hebron"] = {2, 3}     # Wed, Thu (works Sun)
            off_days_map["Yeab"] = {1, 6}       # Tue, Sun (covers Beti on Mon)

        # Yordi & Obsa: strictly Sunday OFF (day 6), plus 1 weekday
        off_days_map["Yordi"] = {1, 6} if is_even_week else {3, 6}
        off_days_map["Obsa"] = {3, 6} if is_even_week else {4, 6}

        # Handle the 3 other staff who work Sunday: they work Sunday (6 is NOT off), and get 2 weekdays OFF
        for name in sunday_squad_others:
            if name == "Shalom":
                off_days_map["Shalom"] = {1, 4} # Tue, Fri
            elif name == "Biruk":
                off_days_map["Biruk"] = {2, 4}  # Wed, Fri
            elif name == "Luam":
                off_days_map["Luam"] = {0, 3}   # Mon, Thu
            elif name == "Feruza":
                off_days_map["Feruza"] = {1, 4} # Tue, Fri
            elif name == "Tirsit":
                off_days_map["Tirsit"] = {2, 4} # Wed, Fri
            elif name == "Rediet":
                off_days_map["Rediet"] = {0, 3} # Mon, Thu

        # For remaining staff who don't work Sunday this week:
        # Sunday (6) is Day OFF #1, plus 1 weekday off (Day OFF #2)
        all_staff = list(STAFF_PROFILES.keys())
        fixed_staff = {"Hebron", "Beti", "Yeab", "Yordi", "Obsa"} | set(sunday_squad_others)
        remaining = [s for s in all_staff if s not in fixed_staff]

        default_weekday_offs = [0, 1, 2, 3, 4]
        for idx, name in enumerate(remaining):
            wk_off = default_weekday_offs[idx % len(default_weekday_offs)]
            off_days_map[name] = {6, wk_off}

        # Build each of the 7 days
        for day_offset in range(7):
            cur_date = week_start_dt + timedelta(days=day_offset)
            cur_date_str = cur_date.strftime("%Y-%m-%d")
            weekday = cur_date.weekday() # 0=Mon, 5=Sat, 6=Sun
            is_weekend = (weekday in (5, 6))

            day_shifts = []
            for emp_name, profile in STAFF_PROFILES.items():
                emp_id = get_emp_id(emp_name)
                is_off = (weekday in off_days_map[emp_name])

                if is_off:
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type="OFF",
                        start_time=None,
                        end_time=None,
                        lunch_start=None,
                        lunch_end=None,
                        notes="Scheduled Day Off"
                    )
                elif weekday == 5 and emp_name in ("Hebron", "Beti"):
                    # Saturday half-day rotation
                    rot_info = sat_rotation[emp_name]
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type=rot_info["shift_type"],
                        start_time=rot_info["start_time"],
                        end_time=rot_info["end_time"],
                        lunch_start=None,
                        lunch_end=None,
                        primary_task=rot_info["primary_task"],
                        secondary_task=rot_info["secondary_task"],
                        notes=f"Saturday Half-Day (Week {sat_rotation['week_type']})"
                    )
                elif weekday == 6:
                    # Sunday duty: strictly 4 staff
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type="SUNDAY_DUTY",
                        start_time=profile["start_time"],
                        end_time=profile["end_time"],
                        lunch_start=profile["lunch_start"],
                        lunch_end=profile["lunch_end"],
                        primary_task=profile["primary_task"],
                        secondary_task=profile["secondary_task"],
                        notes="Sunday Operating Squad (4 Staff)"
                    )
                else:
                    # Normal working day
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type="WORK",
                        start_time=profile["start_time"],
                        end_time=profile["end_time"],
                        lunch_start=profile["lunch_start"],
                        lunch_end=profile["lunch_end"],
                        primary_task=profile["primary_task"],
                        secondary_task=profile["secondary_task"],
                        notes="Regular Shift"
                    )

                day_shifts.append(shift)

            days_data.append(EphemeralDay(cur_date_str, weekday, day_shifts))

    period = EphemeralPeriod(
        start_date=start_date_str,
        end_date=days_data[-1].date,
        days=days_data
    )

    validation = validate_schedule_period(period)
    return period, validation

class Tuple_Result:
    pass
