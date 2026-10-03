from datetime import datetime, date, timedelta

# Reference anchor week: Monday September 28, 2026 is Week 1 (Week A for Saturday rotation)
ANCHOR_DATE = date(2026, 9, 28)

def get_week_index_from_anchor(target_date: date) -> int:
    """
    Returns 0-based week index relative to anchor Monday 2026-09-28.
    e.g., 2026-09-28 to 2026-10-04 is week index 0.
    2026-10-05 to 2026-10-11 is week index 1.
    """
    # Find Monday of target_date's week
    monday = target_date - timedelta(days=target_date.weekday())
    diff_days = (monday - ANCHOR_DATE).days
    return diff_days // 7

def get_saturday_rotation(target_date: date) -> dict:
    """
    Determines Saturday rotation for Hebron and Beti.
    Week A (even week index from anchor):
      Beti: Morning (09:00–14:00) -> AM_HALF
      Hebron: Afternoon (13:00–17:00) -> PM_HALF
    Week B (odd week index from anchor):
      Hebron: Morning (08:00–12:00) -> AM_HALF
      Beti: Afternoon (14:00–18:00) -> PM_HALF
    """
    week_idx = get_week_index_from_anchor(target_date)
    is_week_a = (week_idx % 2 == 0)

    if is_week_a:
        return {
            "week_type": "A",
            "Beti": {
                "shift_type": "AM_HALF",
                "start_time": "09:00",
                "end_time": "14:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "secondary_task": "Amadeus"
            },
            "Hebron": {
                "shift_type": "PM_HALF",
                "start_time": "13:00",
                "end_time": "17:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "secondary_task": "Telegram"
            }
        }
    else:
        return {
            "week_type": "B",
            "Beti": {
                "shift_type": "PM_HALF",
                "start_time": "14:00",
                "end_time": "18:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "secondary_task": "Amadeus"
            },
            "Hebron": {
                "shift_type": "AM_HALF",
                "start_time": "08:00",
                "end_time": "12:00",
                "lunch_start": None,
                "lunch_end": None,
                "primary_task": "Call Center",
                "secondary_task": "Telegram"
            }
        }

def get_sunday_duty_assignment(target_date: date) -> dict:
    """
    Determines whether Hebron or Beti is on Sunday duty.
    Week 1 (even index): Beti WORK, Hebron OFF
    Week 2 (odd index): Hebron WORK, Beti OFF
    """
    week_idx = get_week_index_from_anchor(target_date)
    is_week_1 = (week_idx % 2 == 0)
    
    if is_week_1:
        return {
            "working": "Beti",
            "off": "Hebron",
            "notes": "Week 1: Beti on Sunday duty, Hebron OFF"
        }
    else:
        return {
            "working": "Hebron",
            "off": "Beti",
            "notes": "Week 2: Hebron on Sunday duty, Beti OFF"
        }
