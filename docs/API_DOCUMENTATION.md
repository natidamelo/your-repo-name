# REST API Documentation

The Call Center Staff Scheduling & Management System exposes an interactive OpenAPI specification available at `http://127.0.0.1:8001/docs` (Swagger UI) and `http://127.0.0.1:8001/redoc` (ReDoc).

---

## Base URL

```
http://127.0.0.1:8001/api
```

---

## Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Form data login (`username`, `password`), returns Bearer JWT | Public |
| `GET` | `/auth/me` | Returns current authenticated user profile and role | Bearer Token |
| `POST` | `/auth/register` | Create a new user (admin, manager, staff) | Admin only |

### Default Credentials Seeded

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Staff | `staff` | `staff123` |

---

## Schedules & Generator Endpoints (`/api/schedules`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/schedules/` | List all schedule periods | Any |
| `GET` | `/schedules/{id}` | Get full schedule period with all 14 days, shifts & conflicts | Any |
| `POST` | `/schedules/generate` | Generate schedule. Supports `preview_only: true` (dry run with checklist) or `preview_only: false` (persists draft to DB) | Manager, Admin |
| `PUT` | `/schedules/shifts/{shift_id}` | Modify a shift (shift_type, hours, lunch, tasks, reason). Re-validates constraints & logs to audit trail | Manager, Admin |
| `POST` | `/schedules/{id}/publish` | Validates schedule and marks status as `published`. Blocks publishing if critical errors > 0 | Manager, Admin |
| `DELETE` | `/schedules/{id}` | Deletes a schedule period | Admin only |
| `GET` | `/schedules/{id}/export-excel` | Generates and downloads a 5-sheet styled `.xlsx` workbook | Any |

---

## Coverage Analytics (`/api/coverage`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/coverage/day/{date_str}` | Returns coverage status for 6 intervals (8-9, 9-12, 12-1, 1-2, 2-5, 5-6) and all channels | Any |
| `GET` | `/coverage/matrix/{schedule_id}` | Complete schedule coverage matrix across all dates with GREEN/YELLOW/RED indicators | Any |

---

## Task & Channel Assignments (`/api/assignments`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/assignments/` | Assign staff to a task/channel. Validates employee qualification and flags warning if uncertified | Manager, Admin |
| `DELETE` | `/assignments/{task_id}` | Removes a task assignment | Manager, Admin |

---

## Employees (`/api/employees`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/employees/` | List all 12 staff profiles with skills, hours, lunch breaks, and rules | Any |
| `GET` | `/employees/{id}` | Get single employee profile | Any |
| `POST` | `/employees/` | Add new employee | Manager, Admin |
| `PUT` | `/employees/{id}` | Update employee skills, hours, lunch, status | Manager, Admin |
| `DELETE` | `/employees/{id}` | Deactivate employee | Admin only |

---

## Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Live KPIs, working/off counts, upcoming Saturday rotation (Week A/B), Sunday 4-squad details | Any |

---

## Audit Logs (`/api/audit-logs`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/audit-logs/` | Chronological log of schedule changes, old/new values, user, and mandatory reasons | Manager, Admin |

---

## Settings (`/api/settings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/settings/` | Retrieve system scheduling parameters | Any |
| `PUT` | `/settings/{key}` | Update system parameter (e.g. Sunday maximum staff = 4) | Admin only |
