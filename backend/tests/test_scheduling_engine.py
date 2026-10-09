import pytest
from datetime import datetime, date, timedelta
from app.engine.generator import generate_schedule_data, STAFF_PROFILES
from app.engine.validator import validate_schedule_period
from app.engine.rotations import get_saturday_rotation, get_sunday_duty_assignment
from app.engine.coverage import calculate_day_coverage

def test_sunday_staff_count_exactly_5():
    """Requirement 1 & 2: Sunday always has exactly 5 staff on duty."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    for day in period.days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:  # Sunday
            working_shifts = [s for s in day.shifts if s.shift_type in ("WORK", "SUNDAY_DUTY", "AM_HALF", "PM_HALF")]
            assert len(working_shifts) == 5, f"Sunday {day.date} has {len(working_shifts)} staff, expected exactly 5"


def test_yordi_never_works_sunday():
    """Requirement 3: Yordi never works Sunday."""
    period, validation = generate_schedule_data("2026-09-28", 4)
    for day in period.days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:
            yordi_shift = next((s for s in day.shifts if s.employee_name == "Yordi"), None)
            assert yordi_shift is not None
            assert yordi_shift.shift_type == "OFF", f"Yordi is scheduled to work on Sunday {day.date}"

def test_obsa_never_works_sunday():
    """Requirement 4: Obsa never works Sunday."""
    period, validation = generate_schedule_data("2026-09-28", 4)
    for day in period.days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() == 6:
            obsa_shift = next((s for s in day.shifts if s.employee_name == "Obsa"), None)
            assert obsa_shift is not None
            assert obsa_shift.shift_type == "OFF", f"Obsa is scheduled to work on Sunday {day.date}"

def test_hebron_beti_never_both_off():
    """Requirement 5: Hebron and Beti are NEVER both OFF on the same day."""
    period, validation = generate_schedule_data("2026-09-28", 4)
    for day in period.days:
        h_shift = next((s for s in day.shifts if s.employee_name == "Hebron"), None)
        b_shift = next((s for s in day.shifts if s.employee_name == "Beti"), None)
        assert h_shift and b_shift
        assert not (h_shift.shift_type == "OFF" and b_shift.shift_type == "OFF"), \
            f"Both Hebron and Beti are OFF on {day.date}"

def test_sunday_worker_gets_monday_off():
    """Requirement 6: Person working Sunday gets the following Monday OFF."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    # Sunday Oct 4: Hebron works Sunday Duty
    sun_oct4 = next(d for d in period.days if d.date == "2026-10-04")
    mon_oct5 = next(d for d in period.days if d.date == "2026-10-05")
    
    lead_sun = next(s for s in sun_oct4.shifts if s.employee_name == "Hebron")
    assert lead_sun.shift_type == "SUNDAY_DUTY"
    lead_mon = next(s for s in mon_oct5.shifts if s.employee_name == "Hebron")
    assert lead_mon.shift_type == "OFF", "Hebron worked Sunday Oct 4 but is not OFF Monday Oct 5"

def test_saturday_half_day_rotation_alternates():
    """Requirement 7: Saturday half-day rotation alternates between Week A and Week B."""
    # Oct 3 (Week A)
    sat1 = next(d for d in generate_schedule_data("2026-09-28", 2)[0].days if d.date == "2026-10-03")
    h1 = next(s for s in sat1.shifts if s.employee_name == "Hebron")
    b1 = next(s for s in sat1.shifts if s.employee_name == "Beti")
    assert h1.shift_type == "AM_HALF", f"Expected Hebron AM_HALF on Week A, got {h1.shift_type}"
    assert b1.shift_type == "PM_HALF", f"Expected Beti PM_HALF on Week A, got {b1.shift_type}"

    # Oct 10 (Week B)
    sat2 = next(d for d in generate_schedule_data("2026-09-28", 2)[0].days if d.date == "2026-10-10")
    h2 = next(s for s in sat2.shifts if s.employee_name == "Hebron")
    b2 = next(s for s in sat2.shifts if s.employee_name == "Beti")
    assert b2.shift_type == "AM_HALF", f"Expected Beti AM_HALF on Week B, got {b2.shift_type}"
    assert h2.shift_type == "PM_HALF", f"Expected Hebron PM_HALF on Week B, got {h2.shift_type}"

def test_no_employee_works_during_lunch():
    """Requirement 8: No employee works during their designated lunch hour without coverage."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    assert validation["checklist"]["call_center_coverage_valid"] is True
    # Ensure lunch times are defined and within working hours
    for day in period.days:
        for s in day.shifts:
            if s.shift_type == "WORK" and s.lunch_start and s.lunch_end:
                assert s.lunch_start < s.lunch_end
                assert s.start_time <= s.lunch_start
                assert s.lunch_end <= s.end_time

def test_no_employee_works_outside_defined_hours():
    """Requirement 9: No employee works outside their defined hours."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    for day in period.days:
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        if d_obj.weekday() < 5:  # Weekday
            for s in day.shifts:
                if s.shift_type == "WORK":
                    profile = STAFF_PROFILES[s.employee_name]
                    assert s.start_time == profile["start_time"]
                    assert s.end_time == profile["end_time"]

def test_call_center_coverage_checked():
    """Requirement 10: Call-center coverage is checked across all 6 time slots."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    for day in period.days:
        cov = calculate_day_coverage(day.shifts)
        assert len(cov["time_slots"]) == 6
        for slot in cov["time_slots"]:
            assert slot["status"] in ("GREEN", "YELLOW", "RED")
            assert slot["staff_count"] >= 0

def test_tasks_are_validated():
    """Requirement 11: Task assignment validates employee profiles."""
    assert STAFF_PROFILES["Beti"]["primary_task"] == "Call Center"
    assert STAFF_PROFILES["Hebron"]["primary_task"] == "Telegram"
    assert STAFF_PROFILES["Biruk"]["primary_task"] == "Call Center"

def test_weekly_off_days_respected():
    """Requirement 12: Weekly OFF days are respected (1.5 days for Leads/Feruza, 2 days for rest)."""
    period, validation = generate_schedule_data("2026-09-28", 2)
    assert validation["checklist"]["days_off_valid"] is True


def test_schedule_generation_different_start_dates():
    """Requirement 13: Schedule generation works for different start dates."""
    for dt_str in ["2026-10-12", "2026-11-02", "2027-01-04"]:
        p, v = generate_schedule_data(dt_str, 2)
        assert v["critical_errors"] == 0
        assert len(p.days) == 14

def test_schedule_generation_1_2_4_weeks():
    """Requirement 14: Schedule generation works for 1, 2, and 4 weeks."""
    for weeks in [1, 2, 4]:
        p, v = generate_schedule_data("2026-09-28", weeks)
        assert len(p.days) == weeks * 7
        assert v["critical_errors"] == 0
