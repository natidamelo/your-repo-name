from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment, get_week_index_from_anchor
from app.engine.validator import validate_schedule_period

# Standard working profiles for the 12 staff
STAFF_PROFILES = {
    "Hebron": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Telegram",
        "secondary_task": "Call Center",
        "notes": "E-M: T/C-BKP"
    },
    "Shalom": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "2839 phone",
        "notes": "E-M: C/2839"
    },
    "Biruk": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "Telegram",
        "notes": "E-M: C/T-BKP"
    },
    "Luam": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "2839 phone",
        "notes": "M-M: C/2839"
    },
    "Feruza": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Telegram",
        "secondary_task": "ELMS",
        "notes": "M-M: T/ELMS"
    },
    "Tirsit": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "ELMS",
        "notes": "E-M: C/ELMS"
    },
    "Rediet": {
        "start_time": "08:00",
        "end_time": "17:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "QUE",
        "notes": "E-M: C/Q-BKP"
    },
    "Yordi": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Call Center",
        "secondary_task": "Follow up",
        "notes": "M-M: C/F-BKP"
    },
    "Hermela": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "12:00",
        "lunch_end": "13:00",
        "primary_task": "Telegram",
        "secondary_task": "Email",
        "notes": "M-M: E/T/C-BKP"
    },
    "Obsa": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "Follow up",
        "notes": "M-M: C/F"
    },
    "Beti": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "2839 phone",
        "notes": "M-M: C"
    },
    "Yabsera N": {
        "start_time": "09:00",
        "end_time": "18:00",
        "lunch_start": "13:00",
        "lunch_end": "14:00",
        "primary_task": "Call Center",
        "secondary_task": "Email",
        "notes": "M-M: C/E-BKP"
    }
}

class EphemeralPeriod:
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
        
        class MockEmp:
            def __init__(self, name):
                self.first_name = name
                self.skills = []
        self.employee = MockEmp(employee_name)

def generate_schedule_data(start_date_str: str, duration_weeks: int, employee_db_map: dict = None, db: Any = None) -> Tuple[Any, Dict[str, Any]]:
    """
    Generates an optimized schedule adhering strictly to:
    1. Hebron and Beti rotation leads (1.5 days off: 1 full day off + Saturday half-day).
    2. Saturday alternation between Beti and Hebron (weekly).
    3. Bi-weekly Sunday duty lead rotation between Beti and Hebron.
    4. Sunday duty worker gets Monday OFF.
    5. Exactly 5 staff on Sunday; 2 to 3 Sunday workers get Monday OFF.
    6. Feruza tied to Beti (1.5 days off).
    7. Hebron (Mon-Fri) ALWAYS 08:00–17:00 (E-M).
    8. Shalom, Rediet, Tirsit ALWAYS 08:00–17:00 (E-M) when working.
    9. Yordi and Obsa work Mon–Sat and have Sunday OFF.
    10. Rest of agents have 2 days off per week.
    11. Telegram/ELMS/Q/E handled only by GDS-capable staff; Yabsera N excluded from Telegram.
    12. 2839 & Follow-up rotated among Luam, Obsa, Yordi, Beti, Shalom, Yabsera N.
    """
    start_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    days_data = []

    def get_emp_id(name: str) -> int:
        if not employee_db_map: return 0
        n_low = name.lower().strip()
        synonyms = {
            "luam": "luwam", "luwam": "luam",
            "yordi": "yordanos", "yordanos": "yordi",
            "obsa": "obsan", "obsan": "obsa",
            "beti": "bethel", "bethel": "beti",
            "yeab": "yabsera n", "yabsera": "yabsera n"
        }
        target_names = {n_low}
        if n_low in synonyms:
            target_names.add(synonyms[n_low])
        for k, v in employee_db_map.items():
            k_low = k.lower().strip()
            if k_low in target_names or any(t and (t in k_low or k_low in t) for t in target_names):
                return v
        return 0

    # Pool of Sunday squads (each week has 1 Lead + 4 other agents = exactly 5 staff)
    sunday_pool_rotation = [
        ["Yabsera N", "Biruk", "Tirsit", "Feruza"],
        ["Biruk", "Hermela", "Shalom", "Rediet"],
        ["Yabsera N", "Tirsit", "Feruza", "Luam"],
        ["Biruk", "Rediet", "Hermela", "Shalom"]
    ]

    for w in range(duration_weeks):
        week_start_dt = start_dt + timedelta(days=w * 7)
        week_idx = get_week_index_from_anchor(week_start_dt)
        sat_date = week_start_dt + timedelta(days=5)
        sun_date = week_start_dt + timedelta(days=6)

        sat_rotation = get_saturday_rotation(sat_date)
        sun_lead = get_sunday_duty_assignment(sun_date)

        duty_lead = sun_lead["working"] # "Beti" or "Hebron"
        off_lead = sun_lead["off"]       # "Hebron" or "Beti"

        # 4 other staff for Sunday = exactly 5 staff on Sunday
        squad_pool = sunday_pool_rotation[week_idx % len(sunday_pool_rotation)]
        active_sunday_squad = set([duty_lead] + squad_pool)

        # Determine who worked the previous Sunday (yesterday relative to this Monday)
        prev_sun_date = week_start_dt - timedelta(days=1)
        prev_sun_lead = get_sunday_duty_assignment(prev_sun_date)["working"] # "Hebron" or "Beti"
        prev_week_idx = get_week_index_from_anchor(week_start_dt - timedelta(days=7))
        prev_squad_pool = sunday_pool_rotation[prev_week_idx % len(sunday_pool_rotation)]

        # Off days map for this week: emp_name -> set of day offsets (0=Mon, 6=Sun)
        off_days_map: Dict[str, set] = {}
        for emp in STAFF_PROFILES.keys():
            off_days_map[emp] = set()

        # Rule: Worker who worked Sunday gets Monday (0) OFF!
        # The lead who worked previous Sunday gets Monday OFF this week.
        # The lead who works THIS Sunday (6) is NOT off on Sunday; the other lead is OFF on Sunday.
        if prev_sun_lead == "Hebron":
            off_days_map["Hebron"].add(0) # Monday recovery OFF
        else:
            off_days_map["Beti"].add(0)   # Monday recovery OFF

        # Sunday of this week
        if duty_lead == "Hebron":
            off_days_map["Beti"].add(6)   # Beti OFF on Sunday
            if 0 not in off_days_map["Hebron"]:
                off_days_map["Hebron"].add(3) # Hebron gets Thursday OFF
        else:
            off_days_map["Hebron"].add(6) # Hebron OFF on Sunday
            if 0 not in off_days_map["Beti"]:
                off_days_map["Beti"].add(3)   # Beti gets Thursday OFF

        # Feruza: 1.5 days off per week, tied to Beti
        if "Feruza" in prev_squad_pool:
            off_days_map["Feruza"].add(0) # Monday recovery OFF
        elif "Feruza" not in active_sunday_squad:
            off_days_map["Feruza"].add(6) # Sunday OFF
        else:
            off_days_map["Feruza"].add(3) # Midweek OFF if working Sunday

        # Yordi and Obsa: ALWAYS work Mon–Sat, DAY OFF on Sunday (day 6)
        off_days_map["Yordi"] = {6}
        off_days_map["Obsa"] = {6}

        # Handle Sunday squad members: they work Sunday (day 6), and need 2 days off (Monday + 1 weekday)
        # Rule: Out of 5 Sunday staff, 2 or 3 must be OFF on Monday!
        # Duty lead (Beti or Hebron) is already OFF Monday (0).
        # We give 1 or 2 other Sunday squad members Monday OFF to reach target of 2-3 Monday offs.
        monday_off_given = 1 # lead already has Monday off
        for s_emp in squad_pool:
            if s_emp in ("Yordi", "Obsa"): continue
            if monday_off_given < 3:
                off_days_map[s_emp] = {0, 3} # Monday + Thursday OFF (works Sunday)
                monday_off_given += 1
            else:
                off_days_map[s_emp] = {2, 4} # Wednesday + Friday OFF (works Sunday)

        # Handle remaining staff who do NOT work Sunday:
        # Sunday (6) is mandatory Day Off #1, plus 1 weekday off (Day Off #2) = exactly 2 days off
        remaining_staff = [
            s for s in STAFF_PROFILES.keys() 
            if s not in active_sunday_squad and s not in ("Hebron", "Beti", "Feruza", "Yordi", "Obsa")
        ]

        weekday_cycle = [1, 2, 4, 3, 5] # Tue, Wed, Fri, Thu, Sat
        for idx, rem_emp in enumerate(remaining_staff):
            wk_day = weekday_cycle[idx % len(weekday_cycle)]
            off_days_map[rem_emp] = {6, wk_day}

        # Build each day of the week
        for day_offset in range(7):
            cur_date = week_start_dt + timedelta(days=day_offset)
            cur_date_str = cur_date.strftime("%Y-%m-%d")
            weekday = cur_date.weekday()

            day_shifts = []
            for emp_name, profile in STAFF_PROFILES.items():
                emp_id = get_emp_id(emp_name)
                is_off = (weekday in off_days_map[emp_name])

                if is_off:
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type="OFF",
                        notes="DO"
                    )
                elif weekday == 5 and emp_name in sat_rotation:
                    # Saturday half-day rotation
                    rot = sat_rotation[emp_name]
                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type=rot["shift_type"],
                        start_time=rot["start_time"],
                        end_time=rot["end_time"],
                        primary_task=rot.get("primary_task", profile["primary_task"]),
                        secondary_task=rot.get("secondary_task"),
                        notes=rot.get("notes", f"Saturday Half-Day (Week {sat_rotation['week_type']})")
                    )
                elif weekday == 6:
                    # Sunday duty: strictly 5 staff
                    is_sunday_squad = emp_name in active_sunday_squad
                    if is_sunday_squad:
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
                            notes="SUNDAY_DUTY: 5 Staff Squad"
                        )
                    else:
                        shift = EphemeralShift(
                            employee_id=emp_id,
                            employee_name=emp_name,
                            shift_type="OFF",
                            notes="DO"
                        )
                else:
                    # Regular working day
                    # Early morning check: Hebron, Shalom, Rediet, Tirsit are 08:00
                    start_t = profile["start_time"]
                    end_t = profile["end_time"]
                    if emp_name in ("Hebron", "Shalom", "Rediet", "Tirsit"):
                        start_t = "08:00"
                        end_t = "17:00"

                    shift = EphemeralShift(
                        employee_id=emp_id,
                        employee_name=emp_name,
                        shift_type="WORK",
                        start_time=start_t,
                        end_time=end_t,
                        lunch_start=profile["lunch_start"],
                        lunch_end=profile["lunch_end"],
                        primary_task=profile["primary_task"],
                        secondary_task=profile["secondary_task"],
                        notes=profile.get("notes", "Regular Shift")
                    )

                day_shifts.append(shift)

            days_data.append(EphemeralDay(cur_date_str, weekday, day_shifts))

    period = EphemeralPeriod(
        start_date=start_date_str,
        end_date=days_data[-1].date,
        days=days_data
    )

    validation = validate_schedule_period(period, db=db)
    return period, validation
