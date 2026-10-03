import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Employee, Skill, EmployeeSkill, WorkingHours, LunchBreak, SpecialRule,
    SchedulePeriod, ScheduleDay, ShiftAssignment, ScheduleConflict, SystemSetting, AuditLog
)
from app.core.security import get_password_hash
from app.engine.generator import generate_schedule_data, STAFF_PROFILES
from app.engine.validator import validate_schedule_period

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("Seeding default users (admin, manager, staff)...")
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@callcenter.local",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            ))
        if not db.query(User).filter(User.username == "manager").first():
            db.add(User(
                username="manager",
                email="manager@callcenter.local",
                hashed_password=get_password_hash("manager123"),
                role="manager",
                is_active=True
            ))
        if not db.query(User).filter(User.username == "staff").first():
            db.add(User(
                username="staff",
                email="staff@callcenter.local",
                hashed_password=get_password_hash("staff123"),
                role="staff",
                is_active=True
            ))
        db.commit()

        # 2. Seed Skills
        print("Seeding skills...")
        skills_def = [
            ("CALL_CENTER", "Call Center", "Inbound customer telephone support"),
            ("TELEGRAM", "Telegram", "Telegram chat support and messaging"),
            ("GDS", "GDS", "Global Distribution System reservations"),
            ("JR_GDS", "Junior GDS", "Assisted GDS booking"),
            ("AMADEUS", "Amadeus", "Amadeus booking and ticketing system"),
            ("JR_AMADEUS", "Junior Amadeus", "Assisted Amadeus operations"),
            ("PHONE_2839", "2839 phone", "Direct 2839 hotline channel"),
            ("EMAIL", "Email", "Customer correspondence via email"),
            ("ELMS", "ELMS", "ELMS ticketing management system"),
            ("QUE", "QUE", "Queue monitoring and handling")
        ]

        skill_records = {}
        for code, name, desc in skills_def:
            sk = db.query(Skill).filter(Skill.code == code).first()
            if not sk:
                sk = Skill(code=code, name=name, description=desc)
                db.add(sk)
                db.flush()
            skill_records[code] = sk
            skill_records[name] = sk

        # 3. Seed 12 Staff Members
        print("Seeding 12 staff members...")
        STAFF_CONFIGS = [
            {
                "first_name": "Hebron",
                "position": "Senior Agent / Rotation Lead",
                "start_time": "08:00", "end_time": "17:00",
                "lunch_start": "12:00", "lunch_end": "13:00",
                "skills": ["GDS", "Telegram", "Call Center", "2839 phone", "Email", "QUE", "ELMS"],
                "special_rules": ["SUNDAY_ALTERNATING", "SATURDAY_ROTATION", "NEVER_BOTH_OFF_WITH_BETI"]
            },
            {
                "first_name": "Shalom",
                "position": "Call Center Agent",
                "start_time": "08:00", "end_time": "17:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["Junior GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"],
                "special_rules": ["TWO_DAYS_OFF"]
            },
            {
                "first_name": "Biruk",
                "position": "Call Center Agent / Backup Telegram",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"],
                "special_rules": ["TWO_DAYS_OFF", "TELEGRAM_BACKUP"]
            },
            {
                "first_name": "Luam",
                "position": "Call Center Agent",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["Call Center", "Amadeus"],
                "special_rules": ["TWO_DAYS_OFF"]
            },
            {
                "first_name": "Feruza",
                "position": "Support Agent / Lunch CC Cover",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["GDS", "Telegram", "Junior Amadeus", "ELMS", "Email", "QUE", "Call Center"],
                "special_rules": ["TWO_DAYS_OFF", "CALL_CENTER_LUNCH_COVER"]
            },
            {
                "first_name": "Tirsit",
                "position": "Call Center Agent / Backup Telegram",
                "start_time": "08:00", "end_time": "17:00",
                "lunch_start": "12:00", "lunch_end": "13:00",
                "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"],
                "special_rules": ["TWO_DAYS_OFF", "TELEGRAM_BACKUP"]
            },
            {
                "first_name": "Rediet",
                "position": "Call Center Agent / Backup Telegram",
                "start_time": "08:00", "end_time": "17:00",
                "lunch_start": "12:00", "lunch_end": "13:00",
                "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"],
                "special_rules": ["TWO_DAYS_OFF", "TELEGRAM_BACKUP"]
            },
            {
                "first_name": "Yordi",
                "position": "Support Agent / Sunday Restricted",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "12:00", "lunch_end": "13:00",
                "skills": ["Call Center", "Amadeus", "Telegram", "2839 phone", "GDS"],
                "special_rules": ["SUNDAY_NEVER_WORK", "CALL_CENTER_LUNCH_COVER"]
            },
            {
                "first_name": "Hermela",
                "position": "Support Agent / Lunch CC Cover",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "12:00", "lunch_end": "13:00",
                "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email", "2839 phone"],
                "special_rules": ["TWO_DAYS_OFF", "CALL_CENTER_LUNCH_COVER"]
            },
            {
                "first_name": "Obsa",
                "position": "Call Center Agent / Sunday Restricted",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["Call Center", "Amadeus"],
                "special_rules": ["SUNDAY_NEVER_WORK"]
            },
            {
                "first_name": "Beti",
                "position": "Senior Agent / Rotation Lead",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "14:00", "lunch_end": "15:00",
                "skills": ["Call Center", "Amadeus"],
                "special_rules": ["SUNDAY_ALTERNATING", "SATURDAY_ROTATION", "NEVER_BOTH_OFF_WITH_HEBRON"]
            },
            {
                "first_name": "Yeab",
                "position": "Call Center Agent / Beti Coverage Lead",
                "start_time": "09:00", "end_time": "18:00",
                "lunch_start": "13:00", "lunch_end": "14:00",
                "skills": ["GDS", "Telegram", "Call Center", "Amadeus", "ELMS", "QUE", "Email"],
                "special_rules": ["TWO_DAYS_OFF", "YEAB_COVERS_BETI"]
            }
        ]

        emp_db_map = {}
        for cfg in STAFF_CONFIGS:
            emp = db.query(Employee).filter(Employee.first_name == cfg["first_name"]).first()
            if not emp:
                emp = Employee(
                    first_name=cfg["first_name"],
                    position=cfg["position"],
                    email=f"{cfg['first_name'].lower()}@callcenter.local",
                    is_active=True
                )
                db.add(emp)
                db.flush()

                # Lunch break
                lunch = LunchBreak(
                    employee_id=emp.id,
                    start_time=cfg["lunch_start"],
                    end_time=cfg["lunch_end"],
                    duration_minutes=60
                )
                db.add(lunch)

                # Working hours Mon-Sun
                for dow in range(7):
                    db.add(WorkingHours(
                        employee_id=emp.id,
                        day_of_week=dow,
                        start_time=cfg["start_time"],
                        end_time=cfg["end_time"],
                        is_work_day=(dow < 6)
                    ))

                # Skills
                for sk_name in cfg["skills"]:
                    sk_rec = skill_records.get(sk_name)
                    if sk_rec:
                        db.add(EmployeeSkill(
                            employee_id=emp.id,
                            skill_id=sk_rec.id,
                            proficiency_level="primary"
                        ))

                # Special rules
                for r in cfg["special_rules"]:
                    db.add(SpecialRule(
                        employee_id=emp.id,
                        rule_type=r
                    ))

            emp_db_map[emp.first_name] = emp.id

        db.commit()

        # 4. Seed Initial 2-Week Schedule: September 28, 2026 - October 11, 2026
        print("Seeding initial 2-week schedule (Sep 28, 2026 – Oct 11, 2026)...")
        existing_period = db.query(SchedulePeriod).filter(SchedulePeriod.start_date == "2026-09-28").first()
        if not existing_period:
            period_data, validation = generate_schedule_data("2026-09-28", 2, emp_db_map)

            period = SchedulePeriod(
                name="Roster Sep 28 – Oct 11, 2026 (Published)",
                start_date="2026-09-28",
                end_date="2026-10-11",
                duration_weeks=2,
                status="published",
                generated_by="System Initializer"
            )
            db.add(period)
            db.flush()

            for d in period_data.days:
                s_day = ScheduleDay(
                    schedule_period_id=period.id,
                    date=d.date,
                    day_of_week=d.day_of_week,
                    is_weekend=(d.day_of_week in (5, 6))
                )
                db.add(s_day)
                db.flush()

                for s in d.shifts:
                    db.add(ShiftAssignment(
                        schedule_day_id=s_day.id,
                        employee_id=s.employee_id,
                        shift_type=s.shift_type,
                        start_time=s.start_time,
                        end_time=s.end_time,
                        lunch_start=s.lunch_start,
                        lunch_end=s.lunch_end,
                        primary_task=s.primary_task,
                        secondary_task=s.secondary_task,
                        notes=s.notes
                    ))

            # Store any initial warnings
            for c in validation["conflicts"]:
                db.add(ScheduleConflict(
                    schedule_period_id=period.id,
                    date=c.get("date"),
                    employee_name=c.get("employee_name"),
                    severity=c.get("severity", "warning"),
                    error_type=c.get("error_type", "CONSTRAINT"),
                    message=c.get("message", ""),
                    suggestion=c.get("suggestion", "")
                ))

            # Audit log
            db.add(AuditLog(
                user_name="System",
                action="SEED_SCHEDULE",
                entity_type="SchedulePeriod",
                entity_id=period.id,
                new_value="Seeded initial verified 2-week schedule Sep 28 – Oct 11, 2026",
                reason="System Initialization"
            ))

            db.commit()
            print("Successfully seeded initial 2-week schedule!")
        else:
            print("Initial schedule already present.")

        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
