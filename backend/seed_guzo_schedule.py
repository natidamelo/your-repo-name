import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import (
    Base, Employee, Skill, EmployeeSkill, WorkingHours, LunchBreak,
    SchedulePeriod, ScheduleDay, ShiftAssignment, TaskAssignment, AuditLog, User
)
from app.core.security import get_password_hash

# 12 Staff Names matching Guzo Go Schedule 05 Oct - 11 Oct
STAFF_LIST = [
    {"name": "Hermela",    "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "Yabsera N",  "pos": "Day Shift Call center", "lunch": ("13:00", "14:00")},
    {"name": "Biruk",      "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "Tirsit",     "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "Rediet",     "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "LUWAM",      "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "YORDANOS",   "pos": "Day Shift Call center", "lunch": ("12:00", "13:00")},
    {"name": "OBSAN",      "pos": "Day Shift Call center", "lunch": ("13:00", "14:00")},
    {"name": "FERUZA",     "pos": "Day Shift Call center", "lunch": ("13:00", "14:00")},
    {"name": "Shalom",     "pos": "Day Shift Call center", "lunch": ("13:00", "14:00")},
    {"name": "BETHEL",     "pos": "Day Shift GDS",         "lunch": ("13:00", "14:00")},
    {"name": "HEBRON",     "pos": "Day Shift GDS",         "lunch": ("12:00", "13:00")},
]

# Exact 7-day schedule mapping: (day_date, day_name)
DATES = [
    ("2026-10-05", 0),  # MON
    ("2026-10-06", 1),  # TUE
    ("2026-10-07", 2),  # WED
    ("2026-10-08", 3),  # THU
    ("2026-10-09", 4),  # FRI
    ("2026-10-10", 5),  # SAT
    ("2026-10-11", 6),  # SUN
]

# Exact schedule definition per staff member
# Each item has 7 days (index 0 to 6)
SCHEDULE_DATA = {
    "Hermela": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: E/T/C-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("Call Center", "13:00", "14:00", True)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "Yabsera N": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/E-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "12:00", "13:00", True)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/E-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "12:00", "13:00", True)]},
        # Wed 07 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/E-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "12:00", "13:00", True)]},
        # Fri 09 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Sat 10 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/E-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "12:00", "13:00", True)]},
        # Sun 11 Oct
        {"type": "SUNDAY_DUTY", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/E/Q/2839-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "09:00", "18:00", False), ("QUE", "09:00", "18:00", False), ("2839 phone", "13:00", "14:00", True)]}
    ],

    "Biruk": [
        # Mon 05 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/T-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("Telegram", "08:00", "09:00", True), ("Telegram", "13:00", "14:00", True)]},
        # Tue 06 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/Q&E-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("QUE", "12:00", "13:00", True), ("Email", "12:00", "13:00", True)]},
        # Thu 08 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/E-BKP/Q-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Email", "12:00", "13:00", True), ("QUE", "12:00", "13:00", True)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/T-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("Telegram", "08:00", "09:00", True)]},
        # Sun 11 Oct
        {"type": "SUNDAY_DUTY", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/T/ELMS&F-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("Telegram", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True), ("Follow up", "13:00", "14:00", True)]}
    ],

    "Tirsit": [
        # Mon 05 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS&Q-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True), ("QUE", "13:00", "14:00", True)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True)]},
        # Wed 07 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Thu 08 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True)]},
        # Fri 09 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Sat 10 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True)]},
        # Sun 11 Oct
        {"type": "SUNDAY_DUTY", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/F/E-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("Follow up", "08:00", "17:00", False), ("Email", "12:00", "13:00", True)]}
    ],

    "Rediet": [
        # Mon 05 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Tue 06 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C",
         "tasks": [("Call Center", "08:00", "17:00", False)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C",
         "tasks": [("Call Center", "08:00", "17:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/ELMS-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("ELMS", "13:00", "14:00", True)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: C/Q-BKP",
         "tasks": [("Call Center", "08:00", "17:00", False), ("QUE", "13:00", "14:00", True)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "LUWAM": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "13:00", "18:00", False)]},
        # Tue 06 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "13:00", "18:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "13:00", "18:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "13:00", "18:00", False)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "13:00", "18:00", False)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "YORDANOS": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP/2839-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True), ("2839 phone", "15:00", "18:00", True)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "M-M: C/F-BKP",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "13:00", "14:00", True)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "OBSAN": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Sat 10 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/F",
         "tasks": [("Call Center", "09:00", "18:00", False), ("Follow up", "09:00", "18:00", False)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "FERUZA": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: T/ELMS/Q",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False), ("QUE", "09:00", "18:00", False)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: ELMS/Q-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False), ("QUE", "13:00", "14:00", True)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: T/ELMS",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: ELMS/Q-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False), ("QUE", "13:00", "14:00", True)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: T/ELMS",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False)]},
        # Sat 10 Oct
        {"type": "AM_HALF", "start": "09:00", "end": "13:00", "l_start": None, "l_end": None, "notes": "M-LHD: T/ELMS/Q",
         "tasks": [("Telegram", "09:00", "13:00", False), ("ELMS", "09:00", "13:00", False), ("QUE", "09:00", "13:00", False)]},
        # Sun 11 Oct
        {"type": "SUNDAY_DUTY", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/T/ELMS/Q-BKP",
         "tasks": [("Telegram", "09:00", "18:00", False), ("ELMS", "09:00", "18:00", False), ("Call Center", "09:00", "18:00", False), ("QUE", "13:00", "14:00", True)]}
    ],

    "Shalom": [
        # Mon 05 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/2839",
         "tasks": [("Call Center", "08:00", "17:00", False), ("2839 phone", "08:00", "13:00", False)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/2839",
         "tasks": [("Call Center", "08:00", "17:00", False), ("2839 phone", "08:00", "13:00", False)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/2839",
         "tasks": [("Call Center", "08:00", "17:00", False), ("2839 phone", "08:00", "13:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/2839",
         "tasks": [("Call Center", "08:00", "17:00", False), ("2839 phone", "08:00", "13:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "13:00", "l_end": "14:00", "notes": "E-M: C/2839",
         "tasks": [("Call Center", "08:00", "17:00", False), ("2839 phone", "08:00", "13:00", False)]},
        # Sat 10 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],

    "BETHEL": [
        # Mon 05 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C",
         "tasks": [("Call Center", "09:00", "18:00", False)]},
        # Tue 06 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C",
         "tasks": [("Call Center", "09:00", "18:00", False)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C",
         "tasks": [("Call Center", "09:00", "18:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C",
         "tasks": [("Call Center", "09:00", "18:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C",
         "tasks": [("Call Center", "09:00", "18:00", False)]},
        # Sat 10 Oct
        {"type": "AM_HALF", "start": "09:00", "end": "13:00", "l_start": None, "l_end": None, "notes": "M-LHD: C",
         "tasks": [("Call Center", "09:00", "13:00", False)]},
        # Sun 11 Oct
        {"type": "SUNDAY_DUTY", "start": "09:00", "end": "18:00", "l_start": "13:00", "l_end": "14:00", "notes": "M-M: C/2839",
         "tasks": [("Call Center", "09:00", "18:00", False), ("2839 phone", "09:00", "18:00", False), ("QUE", "13:00", "14:00", True)]}
    ],

    "HEBRON": [
        # Mon 05 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []},
        # Tue 06 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: T/Q",
         "tasks": [("Telegram", "08:00", "17:00", False), ("QUE", "08:00", "17:00", False)]},
        # Wed 07 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: T/Q",
         "tasks": [("Telegram", "08:00", "17:00", False), ("QUE", "08:00", "17:00", False)]},
        # Thu 08 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: T/Q",
         "tasks": [("Telegram", "08:00", "17:00", False), ("QUE", "08:00", "17:00", False)]},
        # Fri 09 Oct
        {"type": "WORK", "start": "08:00", "end": "17:00", "l_start": "12:00", "l_end": "13:00", "notes": "E-M: T/Q",
         "tasks": [("Telegram", "08:00", "17:00", False), ("QUE", "08:00", "17:00", False)]},
        # Sat 10 Oct
        {"type": "PM_HALF", "start": "14:00", "end": "18:00", "l_start": "12:00", "l_end": "13:00", "notes": "A-LHD",
         "tasks": [("Telegram", "14:00", "18:00", False), ("ELMS", "14:00", "18:00", False), ("QUE", "14:00", "18:00", False)]},
        # Sun 11 Oct
        {"type": "OFF", "start": None, "end": None, "l_start": None, "l_end": None, "notes": "DO", "tasks": []}
    ],
}

def seed_db_url(db_url: str):
    print(f"\n==========================================")
    print(f"Connecting to database: {db_url[:45]}...")
    print(f"==========================================")
    engine = create_engine(db_url)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # Step 1: Ensure Employees exist with exact names
        emp_map = {}
        for staff in STAFF_LIST:
            emp = db.query(Employee).filter(Employee.first_name == staff["name"]).first()
            if not emp:
                # Also check aliases
                alias_map = {"LUWAM": "Luam", "YORDANOS": "Yordi", "OBSAN": "Obsa", "FERUZA": "Feruza", "BETHEL": "Beti", "HEBRON": "Hebron", "Yabsera N": "Yeab"}
                old_name = alias_map.get(staff["name"])
                if old_name:
                    emp = db.query(Employee).filter(Employee.first_name == old_name).first()
                if emp:
                    emp.first_name = staff["name"]
                    emp.position = staff["pos"]
                    db.flush()
                else:
                    emp = Employee(
                        first_name=staff["name"],
                        position=staff["pos"],
                        email=f"{staff['name'].lower().replace(' ', '')}@callcenter.local",
                        is_active=True
                    )
                    db.add(emp)
                    db.flush()
            else:
                emp.position = staff["pos"]
                db.flush()
            emp_map[staff["name"]] = emp

        print(f"Resolved all {len(emp_map)} staff profiles.")

        # Step 2: Remove existing 05 Oct - 11 Oct schedule if any, to cleanly recreate exact
        old_sched = db.query(SchedulePeriod).filter(
            SchedulePeriod.start_date == "2026-10-05"
        ).first()
        if old_sched:
            print(f"Replacing existing schedule ID={old_sched.id} ({old_sched.name})...")
            db.delete(old_sched)
            db.commit()

        # Step 3: Create Guzo Go Schedule Period
        sched = SchedulePeriod(
            name="Guzo Go Schedule 05 Oct - 11 Oct",
            start_date="2026-10-05",
            end_date="2026-10-11",
            duration_weeks=1,
            status="published",
            generated_by="Guzo Go Verified Roster"
        )
        db.add(sched)
        db.flush()
        print(f"Created SchedulePeriod ID={sched.id}: '{sched.name}'")

        # Step 4: Create the 7 Schedule Days
        day_map = {}
        for d_str, dow in DATES:
            s_day = ScheduleDay(
                schedule_period_id=sched.id,
                date=d_str,
                day_of_week=dow,
                is_weekend=(dow in (5, 6))
            )
            db.add(s_day)
            db.flush()
            day_map[d_str] = s_day

        print(f"Created {len(day_map)} ScheduleDays (2026-10-05 to 2026-10-11).")

        # Step 5: Insert Shifts and Tasks
        total_shifts = 0
        total_tasks = 0

        for staff_name, day_shifts in SCHEDULE_DATA.items():
            emp = emp_map[staff_name]
            for day_idx, shift_def in enumerate(day_shifts):
                d_str, _ = DATES[day_idx]
                s_day = day_map[d_str]

                # Compute primary/secondary summary from tasks
                prim = None
                sec = None
                if shift_def["tasks"]:
                    prim = ", ".join([t[0] for t in shift_def["tasks"] if not t[3]])
                    sec_tasks = [f"{t[0]} (BKP)" for t in shift_def["tasks"] if t[3]]
                    if sec_tasks:
                        sec = ", ".join(sec_tasks)

                shift_rec = ShiftAssignment(
                    schedule_day_id=s_day.id,
                    employee_id=emp.id,
                    shift_type=shift_def["type"],
                    start_time=shift_def["start"],
                    end_time=shift_def["end"],
                    lunch_start=shift_def["l_start"],
                    lunch_end=shift_def["l_end"],
                    primary_task=prim,
                    secondary_task=sec,
                    notes=shift_def["notes"]
                )
                db.add(shift_rec)
                db.flush()
                total_shifts += 1

                # Add individual task assignments
                for task_name, t_start, t_end, is_bkp in shift_def["tasks"]:
                    db.add(TaskAssignment(
                        shift_assignment_id=shift_rec.id,
                        task_name=task_name,
                        start_time=t_start,
                        end_time=t_end,
                        is_backup=is_bkp,
                        notes="Guzo Go Schedule Verified"
                    ))
                    total_tasks += 1

        db.commit()
        print(f"SUCCESS: Seeded {total_shifts} shifts and {total_tasks} tasks for '{sched.name}'!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    # 1. Seed local SQLite database (backend/callcenter.db)
    local_db_path = backend_dir / "callcenter.db"
    seed_db_url(f"sqlite:///{local_db_path}")

    # 2. Also seed root callcenter.db if present
    root_db_path = backend_dir.parent / "callcenter.db"
    seed_db_url(f"sqlite:///{root_db_path}")

    # 3. Seed Supabase PostgreSQL database
    supabase_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres.yaubytjsryjywqlafwrd:uPGGSkG7b3NSLUAL@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
    )
    if "postgresql" in supabase_url:
        if not supabase_url.startswith("postgresql+psycopg2://") and not supabase_url.startswith("postgresql+psycopg://"):
            supabase_url = supabase_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        try:
            seed_db_url(supabase_url)
            print("Successfully updated live Supabase PostgreSQL database!")
        except Exception as e:
            print(f"Could not connect to Supabase: {e}")
