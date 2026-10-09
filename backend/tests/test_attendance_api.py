import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Employee, AttendanceRecord
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_token():
    db = SessionLocal()
    admin = db.query(User).filter(User.username == "admin_test").first()
    if not admin:
        admin = User(
            username="admin_test",
            email="admin_test@test.local",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    token = create_access_token(admin.username, admin.role)
    db.close()
    return token

@pytest.fixture(scope="module")
def staff_token():
    db = SessionLocal()
    staff = db.query(User).filter(User.username == "staff_test").first()
    if not staff:
        staff = User(
            username="staff_test",
            email="staff_test@test.local",
            hashed_password=get_password_hash("staff123"),
            role="staff",
            is_active=True
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
    token = create_access_token(staff.username, staff.role)
    db.close()
    return token

@pytest.fixture(scope="module")
def sample_employee():
    db = SessionLocal()
    emp = db.query(Employee).filter(Employee.is_active == True).first()
    if not emp:
        emp = Employee(
            first_name="Test",
            last_name="Agent",
            position="Call Center Agent",
            is_active=True
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)
    emp_id = emp.id
    db.close()
    return emp_id

def test_get_day_attendance():
    # Test getting attendance sheet for a weekday
    res = client.get("/api/attendance/day/2026-10-05")
    assert res.status_code == 200
    data = res.json()
    assert "date" in data
    assert data["date"] == "2026-10-05"
    assert "records" in data
    assert len(data["records"]) > 0
    assert "scheduled_count" in data
    assert "pending_cover_count" in data

def test_record_absence_with_next_week_cover(admin_token, sample_employee):
    headers = {"Authorization": f"Bearer {admin_token}"}
    date_str = "2026-10-05"

    payload = {
        "employee_id": sample_employee,
        "date": date_str,
        "status": "ABSENT",
        "admin_remark": "Flu/fever reported - requested to cover next Saturday",
        "needs_next_week_cover": True,
        "cover_status": "PENDING",
        "cover_notes": "Needs to cover Saturday roster shift"
    }

    res = client.post("/api/attendance/record", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ABSENT"
    assert data["needs_next_week_cover"] is True
    assert data["cover_status"] == "PENDING"
    assert data["admin_remark"] == "Flu/fever reported - requested to cover next Saturday"
    rec_id = data["id"]

    # Verify pending cover queue contains this record
    queue_res = client.get("/api/attendance/pending-cover", headers=headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(item["attendance_id"] == rec_id for item in queue)

    # Resolve/Schedule the cover shift
    resolve_res = client.put(
        f"/api/attendance/resolve-cover/{rec_id}",
        json={
            "cover_status": "SCHEDULED",
            "cover_notes": "Scheduled for Saturday Oct 10 08:00-17:00",
            "target_cover_date": "2026-10-10"
        },
        headers=headers
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["cover_status"] == "SCHEDULED"

def test_bulk_mark_present(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    date_str = "2026-10-06"
    res = client.post(f"/api/attendance/bulk-mark-present?date_str={date_str}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "Successfully marked" in data["message"]

def test_attendance_summary():
    res = client.get("/api/attendance/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_records" in data
    assert "attendance_rate_percent" in data
    assert data["total_records"] >= 1

def test_staff_role_forbidden(staff_token, sample_employee):
    # Staff cannot modify attendance records
    headers = {"Authorization": f"Bearer {staff_token}"}
    payload = {
        "employee_id": sample_employee,
        "date": "2026-10-07",
        "status": "PRESENT"
    }
    res = client.post("/api/attendance/record", json=payload, headers=headers)
    assert res.status_code == 403
