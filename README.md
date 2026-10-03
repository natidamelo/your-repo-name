# Call Center Staff Scheduling & Management System

A complete, production-ready full-stack web application designed to replace manual Excel scheduling with constraint-based automated roster generation, real-time conflict detection, coverage monitoring across 6 mandatory daily time slots, role-based access control, styled Excel exports, and print formatting.

---

## 1. Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2, PyJWT, bcrypt, openpyxl, pytest
* **Database:** Dual-compatible (SQLite for zero-config instant local execution, PostgreSQL schema & Docker Compose included)
* **Authentication:** JWT Bearer tokens with Role-Based Access Control (`admin`, `manager`, `staff`)

---

## 2. Project Structure

```
CALL CENTER STAFF SCHEDULING & MANAGEMENT SYSTEM/
├── backend/
│   ├── app/
│   │   ├── core/           # JWT, hashing, security dependencies
│   │   ├── engine/         # Constraint engine, rotations, coverage, validator
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # FastAPI REST endpoints
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── utils/          # Styled openpyxl 5-sheet workbook builder
│   │   ├── config.py       # Pydantic settings & defaults
│   │   ├── database.py     # Database engine & session
│   │   ├── main.py         # Application entrypoint & CORS
│   │   └── seed.py         # Database seeding script
│   ├── tests/              # 14 automated pytest constraint test cases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Typed backend API client
│   │   ├── components/     # Layout, modals, calendar, print
│   │   ├── context/        # Authentication context
│   │   ├── pages/          # Dashboard, Calendar, Daily, Coverage, Employees, etc.
│   │   ├── types/          # TypeScript definitions
│   │   └── index.css       # Tailwind & print styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/
│   ├── schema.sql          # PostgreSQL DDL schema
│   └── docker-compose.yml  # PostgreSQL container service
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── SCHEDULING_RULES.md
│   └── USER_GUIDE.md
└── README.md
```

---

## 3. Quick Start (Running Locally)

### Prerequisites
* Python 3.10+
* Node.js v18+ & npm

### Step 1: Start Backend Server
```powershell
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt

# Seed the database with the 12 staff profiles and initial 2-week schedule
python -m app.seed

# Start FastAPI server on port 8001
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
Backend API will be running at `http://127.0.0.1:8001/`.  
Interactive Swagger docs: `http://127.0.0.1:8001/docs`.

### Step 2: Start Frontend Application
In a separate terminal:
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173/` in your browser.

---

## 4. Default Seeded Users & Roles

| Role | Username | Password | Capabilities |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full access: users, settings, employees, generation, publishing, export |
| **Manager** | `manager` | `manager123` | Operational access: employees, shift edits, schedule generation, publishing, export |
| **Staff Member** | `staff` | `staff123` | View personal schedule, daily assignments, coverage (read-only) |

*The login page also provides 1-click demo login buttons for each role.*

---

## 5. Seed Data & 12 Core Staff Members

The database is pre-populated with the 12 staff profiles and their exact working hours, lunch hours, skills, and rotation constraints:

1. **Hebron:** Rotation Lead, 08:00–17:00 (Lunch 12:00–13:00). Sat half-day & biweekly Sun duty.
2. **Beti:** Rotation Lead, 09:00–18:00 (Lunch 14:00–15:00). Sat half-day & biweekly Sun duty.
3. **Yeab:** Beti Coverage Lead, 09:00–18:00 (Lunch 13:00–14:00). Covers Beti when OFF and during Beti's lunch.
4. **Shalom:** 08:00–17:00 (Lunch 13:00–14:00). Call Center, Telegram, GDS, Amadeus.
5. **Biruk:** 09:00–18:00 (Lunch 13:00–14:00). Call Center & Backup Telegram.
6. **Luam:** 09:00–18:00 (Lunch 13:00–14:00). Call Center & Amadeus.
7. **Feruza:** 09:00–18:00 (Lunch 13:00–14:00). Call Center lunch cover (12:00–13:00) & Telegram.
8. **Tirsit:** 08:00–17:00 (Lunch 12:00–13:00). Call Center & Backup Telegram.
9. **Rediet:** 08:00–17:00 (Lunch 12:00–13:00). Call Center & Backup Telegram.
10. **Yordi:** 09:00–18:00 (Lunch 12:00–13:00). Strictly Sunday OFF; Call Center lunch cover (12:00–13:00).
11. **Hermela:** 09:00–18:00 (Lunch 12:00–13:00). Call Center lunch cover (12:00–13:00) & Telegram.
12. **Obsa:** 09:00–18:00 (Lunch 13:00–14:00). Strictly Sunday OFF; Call Center & Amadeus.

---

## 6. Initial Seed Schedule: September 28 – October 11, 2026

The initial 14-day schedule strictly satisfies all rules:
* **Week A Saturday (Oct 3):** Beti morning half (`09:00–14:00`), Hebron afternoon half (`13:00–17:00`).
* **Week 1 Sunday (Oct 4):** Beti works Sunday duty in office. Total Sunday staff = **exactly 4** (Beti, Shalom, Biruk, Luam). Hebron is `OFF`. Yordi & Obsa are `OFF`.
* **Week 2 Monday (Oct 5):** Beti worked Sunday &rarr; Beti is **strictly OFF Monday**. Hebron **works Monday** (never both off). Yeab works Monday to cover Beti.
* **Week B Saturday (Oct 10):** Hebron morning half (`08:00–12:00`), Beti afternoon half (`14:00–18:00`).
* **Week 2 Sunday (Oct 11):** Hebron works Sunday duty in office. Total Sunday staff = **exactly 4** (Hebron, Feruza, Tirsit, Rediet). Beti is `OFF`. Yordi & Obsa are `OFF`.
* **Following Monday (Oct 12):** Hebron is OFF.
* **Hebron & Beti Mutual Presence:** They are never both OFF on any day of the 14-day schedule.
* **Days Off:** Every employee receives exactly 2 days off per 7 days.
* **Call Center Coverage:** All 6 daily time slots (8-9, 9-12, 12-1, 1-2, 2-5, 5-6) maintain adequate staffing (GREEN).

---

## 7. Running Automated Engine Tests

The backend includes 14 comprehensive automated pytest test cases validating every single scheduling requirement:

```powershell
cd backend
python -m pytest tests/test_scheduling_engine.py -v
```

### Verified Tests Summary
```
tests/test_scheduling_engine.py::test_sunday_never_more_than_4_staff PASSED
tests/test_scheduling_engine.py::test_sunday_always_exactly_4_staff PASSED
tests/test_scheduling_engine.py::test_yordi_never_works_sunday PASSED
tests/test_scheduling_engine.py::test_obsa_never_works_sunday PASSED
tests/test_scheduling_engine.py::test_hebron_beti_never_both_off PASSED
tests/test_scheduling_engine.py::test_sunday_worker_gets_monday_off PASSED
tests/test_scheduling_engine.py::test_saturday_half_day_rotation_alternates PASSED
tests/test_scheduling_engine.py::test_no_employee_works_during_lunch PASSED
tests/test_scheduling_engine.py::test_no_employee_works_outside_defined_hours PASSED
tests/test_scheduling_engine.py::test_call_center_coverage_checked PASSED
tests/test_scheduling_engine.py::test_skills_are_validated PASSED
tests/test_scheduling_engine.py::test_two_weekly_off_days_respected PASSED
tests/test_scheduling_engine.py::test_schedule_generation_different_start_dates PASSED
tests/test_scheduling_engine.py::test_schedule_generation_1_2_4_weeks PASSED
============================= 14 passed in 0.37s ==============================
```

---

## 8. Export to Excel & Print Formatting

* **5-Sheet Formatted Excel Export:** Accessible via `GET /api/schedules/{id}/export-excel` or clicking **Export Excel** in the UI. Contains:
  1. `Staff Roster` (14-day color-coded matrix)
  2. `Daily Coverage` (6-slot breakdown with status fills)
  3. `Sunday Schedule` (Sunday squad with duties)
  4. `Staff Assignments` (Task & shift breakdown)
  5. `Conflict Report` (Validation checklist & compliance audit)
* **Print Schedule View:** Clean `@media print` layout with department banner, roster table, guidelines, and manager sign-off lines.
