import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models import User, SystemConstraint
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

def test_get_constraints():
    res = client.get("/api/constraints/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 9
    assert any(c["title"] == "Sunday Squad" for c in data)
    assert any(c["title"] == "Hebron & Beti" for c in data)

def test_create_and_update_constraint(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create
    new_payload = {
        "title": "Friday Peak Coverage",
        "category": "GENERAL",
        "description": "Ensure at least 4 agents are scheduled between 14:00 and 18:00 on Fridays.",
        "staff_names": "Shalom, Rediet, Tirsit",
        "is_active": True
    }
    create_res = client.post("/api/constraints/", json=new_payload, headers=headers)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["title"] == "Friday Peak Coverage"
    assert created["id"] > 0
    c_id = created["id"]

    # Toggle
    toggle_res = client.patch(f"/api/constraints/{c_id}/toggle", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # Update
    update_payload = {
        "title": "Friday Peak Coverage Updated",
        "description": "Updated rule description.",
        "is_active": True
    }
    update_res = client.put(f"/api/constraints/{c_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Friday Peak Coverage Updated"
    assert update_res.json()["is_active"] is True

    # Delete
    del_res = client.delete(f"/api/constraints/{c_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted
    get_res = client.get(f"/api/constraints/{c_id}")
    assert get_res.status_code == 404
