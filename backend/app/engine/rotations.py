from datetime import datetime, date, timedelta

# Anchor date set to Monday October 5, 2026 (Guzo Go Schedule anchor)
ANCHOR_DATE = date(2026, 10, 5)

def get_week_index_from_anchor(target_date: date) -> int:
    """
    Returns 0-based week index relative to anchor Monday 2026-10-05.
    e.g., 2026-10-05 to 2026-10-11 is week index 0.
    2026-10-12 to 2026-10-18 is week index 1.
    """
    monday = target_date - timedelta(days=target_date.weekday())
    diff_days = (monday - ANCHOR_DATE).days
    return diff_days // 7

def get_saturday_rotation(target_date: date) -> dict:
    """
    Saturday rotation for Hebron and Beti, with Feruza tied to Beti:
    - Weekly alternation between Hebron & Beti:
      Week A (even index, e.g. Oct 10):
        Beti: Morning AM_HALF (09:00–13:00, M-LHD: C)
        Feruza: Morning AM_HALF (09:00–13:00, M-LHD: T/ELMS/Q)
        Hebron: Afternoon PM_HALF (14:00–18:00, A-LHD)
      Week B (odd index, e.g. Oct 17):
        Hebron: Morning AM_HALF (08:00–12:00, M-HD)
        Beti: Afternoon PM_HALF (13:00–17:00, A-HD)
        Feruza: Regular or PM coverage tied to Beti
    """
    week_idx = get_week_index_from_anchor(target_date)
    is_week_a = (week_idx % 2 == 0)

    if is_week_a:
        return {
            "week_type": "A",
            "Beti": {
                "shift_type": "AM_HALF",
                "start_time": "09:00",
                "end_time": "13:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "notes": "M-LHD: C"
            },
            "Feruza": {
                "shift_type": "AM_HALF",
                "start_time": "09:00",
                "end_time": "13:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Telegram",
                "secondary_task": "ELMS",
                "notes": "M-LHD: T/ELMS/Q"
            },
            "Hebron": {
                "shift_type": "PM_HALF",
                "start_time": "14:00",
                "end_time": "18:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Telegram",
                "notes": "A-LHD"
            }
        }
    else:
        return {
            "week_type": "B",
            "Hebron": {
                "shift_type": "AM_HALF",
                "start_time": "08:00",
                "end_time": "12:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Telegram",
                "notes": "M-HD"
            },
            "Beti": {
                "shift_type": "PM_HALF",
                "start_time": "13:00",
                "end_time": "17:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "notes": "A-HD"
            },
            "Feruza": {
                "shift_type": "PM_HALF",
                "start_time": "13:00",
                "end_time": "17:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Telegram",
                "notes": "A-HD: T"
            }
        }

def get_sunday_duty_assignment(target_date: date) -> dict:
    """
    Bi-weekly Sunday duty lead rotation between Hebron and Beti:
    - Bi-weekly cycle: (week_idx // 2) % 2 == 0 -> Beti works Sunday, Hebron OFF
    - (week_idx // 2) % 2 == 1 -> Hebron works Sunday, Beti OFF
    - Mandatory Rule: The duty lead working on Sunday gets Monday OFF!
    """
    week_idx = get_week_index_from_anchor(target_date)
    is_beti_cycle = ((week_idx // 2) % 2 == 0)

    if is_beti_cycle:
        return {
            "working": "Beti",
            "off": "Hebron",
            "cycle": "Bi-weekly Beti Sunday Lead",
            "notes": "Beti works Sunday (gets Monday OFF), Hebron OFF Sunday"
        }
    else:
        return {
            "working": "Hebron",
            "off": "Beti",
            "cycle": "Bi-weekly Hebron Sunday Lead",
            "notes": "Hebron works Sunday (gets Monday OFF), Beti OFF Sunday"
        }
