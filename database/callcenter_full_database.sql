-- ====================================================================
-- Call Center Staff Scheduling & Management System - Complete SQL Dump
-- Compatible with PostgreSQL & standard SQL clients
-- Generated: 2026-10-03
-- ====================================================================

-- 1. Clean existing tables if needed
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS coverage_requirements CASCADE;
DROP TABLE IF EXISTS schedule_conflicts CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS shift_assignments CASCADE;
DROP TABLE IF EXISTS schedule_days CASCADE;
DROP TABLE IF EXISTS schedule_periods CASCADE;
DROP TABLE IF EXISTS special_rules CASCADE;
DROP TABLE IF EXISTS lunch_breaks CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;
DROP TABLE IF EXISTS employee_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- 2. Schema Definitions
-- PostgreSQL Schema for Call Center Staff Scheduling & Management System

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    employee_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) DEFAULT '',
    position VARCHAR(100) DEFAULT 'Call Center Agent',
    email VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) DEFAULT 'primary'
);

CREATE TABLE IF NOT EXISTS working_hours (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    end_time VARCHAR(10) NOT NULL DEFAULT '17:00',
    is_work_day BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS lunch_breaks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_time VARCHAR(10) NOT NULL DEFAULT '12:00',
    end_time VARCHAR(10) NOT NULL DEFAULT '13:00',
    duration_minutes INTEGER DEFAULT 60
);

CREATE TABLE IF NOT EXISTS special_rules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL,
    config_json TEXT
);

CREATE TABLE IF NOT EXISTS schedule_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    end_date VARCHAR(10) NOT NULL,
    duration_weeks INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'draft',
    generated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_days (
    id SERIAL PRIMARY KEY,
    schedule_period_id INTEGER NOT NULL REFERENCES schedule_periods(id) ON DELETE CASCADE,
    date VARCHAR(10) NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_weekend BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shift_assignments (
    id SERIAL PRIMARY KEY,
    schedule_day_id INTEGER NOT NULL REFERENCES schedule_days(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_type VARCHAR(20) DEFAULT 'WORK',
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    lunch_start VARCHAR(10),
    lunch_end VARCHAR(10),
    primary_task VARCHAR(50),
    secondary_task VARCHAR(50),
    notes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS task_assignments (
    id SERIAL PRIMARY KEY,
    shift_assignment_id INTEGER NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    task_name VARCHAR(50) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    is_backup BOOLEAN DEFAULT FALSE,
    notes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS schedule_conflicts (
    id SERIAL PRIMARY KEY,
    schedule_period_id INTEGER NOT NULL REFERENCES schedule_periods(id) ON DELETE CASCADE,
    date VARCHAR(10),
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    employee_name VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'critical',
    error_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coverage_requirements (
    id SERIAL PRIMARY KEY,
    slot_index INTEGER UNIQUE NOT NULL,
    slot_name VARCHAR(50) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    target_staff INTEGER DEFAULT 2,
    min_staff INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100) DEFAULT 'System',
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value TEXT,
    new_value TEXT,
    reason VARCHAR(255)
);


-- 3. Data Inserts

-- Table: users (3 rows)
INSERT INTO users ("id", "username", "email", "hashed_password", "role", "is_active", "employee_id", "created_at") VALUES (1, 'admin', 'admin@callcenter.local', '$2b$12$FteTHgoFkVSBT9jw2tx.lu1FyDr2FPx54o5CRyuN.WF/Vha9dltLG', 'admin', TRUE, NULL, '2026-09-25 18:21:14.904139');
INSERT INTO users ("id", "username", "email", "hashed_password", "role", "is_active", "employee_id", "created_at") VALUES (2, 'manager', 'manager@callcenter.local', '$2b$12$ONt38gJslfC4iuIpLqyIWuRM1sRY4RK5LUH6hgLbZP/R9VLggxZbW', 'manager', TRUE, NULL, '2026-09-25 18:21:14.904149');
INSERT INTO users ("id", "username", "email", "hashed_password", "role", "is_active", "employee_id", "created_at") VALUES (3, 'staff', 'staff@callcenter.local', '$2b$12$NK5z7xL2FKenojdR4flk2.PXPDjoY.SDprk0qlYNeMEZZbh9SagCe', 'staff', TRUE, NULL, '2026-09-25 18:21:14.904153');

-- Table: employees (12 rows)
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (1, 'HEBRON', '', 'Day Shift GDS', 'hebron@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.020424');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (2, 'Shalom', '', 'Day Shift Call center', 'shalom@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.024682');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (3, 'Biruk', '', 'Day Shift Call center', 'biruk@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.042321');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (4, 'LUWAM', '', 'Day Shift Call center', 'luam@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.046619');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (5, 'FERUZA', '', 'Day Shift Call center', 'feruza@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.050582');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (6, 'Tirsit', '', 'Day Shift Call center', 'tirsit@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.055634');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (7, 'Rediet', '', 'Day Shift Call center', 'rediet@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.059036');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (8, 'YORDANOS', '', 'Day Shift Call center', 'yordi@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.062147');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (9, 'Hermela', '', 'Day Shift Call center', 'hermela@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.065299');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (10, 'OBSAN', '', 'Day Shift Call center', 'obsa@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.068920');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (11, 'BETHEL', '', 'Day Shift GDS', 'beti@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.073227');
INSERT INTO employees ("id", "first_name", "last_name", "position", "email", "phone", "is_active", "notes", "created_at") VALUES (12, 'Yabsera N', '', 'Day Shift Call center', 'yeab@callcenter.local', NULL, TRUE, NULL, '2026-09-25 18:21:15.077792');

-- Table: skills (10 rows)
INSERT INTO skills ("id", "code", "name", "description") VALUES (1, 'CALL_CENTER', 'Call Center', 'Inbound customer telephone support');
INSERT INTO skills ("id", "code", "name", "description") VALUES (2, 'TELEGRAM', 'Telegram', 'Telegram chat support and messaging');
INSERT INTO skills ("id", "code", "name", "description") VALUES (3, 'GDS', 'GDS', 'Global Distribution System reservations');
INSERT INTO skills ("id", "code", "name", "description") VALUES (4, 'JR_GDS', 'Junior GDS', 'Assisted GDS booking');
INSERT INTO skills ("id", "code", "name", "description") VALUES (5, 'AMADEUS', 'Amadeus', 'Amadeus booking and ticketing system');
INSERT INTO skills ("id", "code", "name", "description") VALUES (6, 'JR_AMADEUS', 'Junior Amadeus', 'Assisted Amadeus operations');
INSERT INTO skills ("id", "code", "name", "description") VALUES (7, 'PHONE_2839', '2839 phone', 'Direct 2839 hotline channel');
INSERT INTO skills ("id", "code", "name", "description") VALUES (8, 'EMAIL', 'Email', 'Customer correspondence via email');
INSERT INTO skills ("id", "code", "name", "description") VALUES (9, 'ELMS', 'ELMS', 'ELMS ticketing management system');
INSERT INTO skills ("id", "code", "name", "description") VALUES (10, 'QUE', 'QUE', 'Queue monitoring and handling');

-- Table: employee_skills (68 rows)
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (1, 1, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (2, 1, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (3, 1, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (4, 1, 7, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (5, 1, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (6, 1, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (7, 1, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (8, 2, 4, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (9, 2, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (10, 2, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (11, 2, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (12, 2, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (13, 2, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (14, 2, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (15, 3, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (16, 3, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (17, 3, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (18, 3, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (19, 3, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (20, 3, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (21, 3, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (22, 4, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (23, 4, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (24, 5, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (25, 5, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (26, 5, 6, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (27, 5, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (28, 5, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (29, 5, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (30, 5, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (31, 6, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (32, 6, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (33, 6, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (34, 6, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (35, 6, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (36, 6, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (37, 6, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (38, 7, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (39, 7, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (40, 7, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (41, 7, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (42, 7, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (43, 7, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (44, 7, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (45, 8, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (46, 8, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (47, 8, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (48, 8, 7, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (49, 8, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (50, 9, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (51, 9, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (52, 9, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (53, 9, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (54, 9, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (55, 9, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (56, 9, 8, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (57, 9, 7, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (58, 10, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (59, 10, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (60, 11, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (61, 11, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (62, 12, 3, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (63, 12, 2, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (64, 12, 1, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (65, 12, 5, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (66, 12, 9, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (67, 12, 10, 'primary');
INSERT INTO employee_skills ("id", "employee_id", "skill_id", "proficiency_level") VALUES (68, 12, 8, 'primary');

-- Table: working_hours (84 rows)
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (1, 1, 0, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (2, 1, 1, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (3, 1, 2, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (4, 1, 3, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (5, 1, 4, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (6, 1, 5, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (7, 1, 6, '08:00', '17:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (8, 2, 0, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (9, 2, 1, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (10, 2, 2, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (11, 2, 3, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (12, 2, 4, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (13, 2, 5, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (14, 2, 6, '08:00', '17:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (15, 3, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (16, 3, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (17, 3, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (18, 3, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (19, 3, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (20, 3, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (21, 3, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (22, 4, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (23, 4, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (24, 4, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (25, 4, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (26, 4, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (27, 4, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (28, 4, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (29, 5, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (30, 5, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (31, 5, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (32, 5, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (33, 5, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (34, 5, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (35, 5, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (36, 6, 0, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (37, 6, 1, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (38, 6, 2, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (39, 6, 3, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (40, 6, 4, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (41, 6, 5, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (42, 6, 6, '08:00', '17:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (43, 7, 0, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (44, 7, 1, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (45, 7, 2, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (46, 7, 3, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (47, 7, 4, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (48, 7, 5, '08:00', '17:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (49, 7, 6, '08:00', '17:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (50, 8, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (51, 8, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (52, 8, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (53, 8, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (54, 8, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (55, 8, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (56, 8, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (57, 9, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (58, 9, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (59, 9, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (60, 9, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (61, 9, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (62, 9, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (63, 9, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (64, 10, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (65, 10, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (66, 10, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (67, 10, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (68, 10, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (69, 10, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (70, 10, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (71, 11, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (72, 11, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (73, 11, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (74, 11, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (75, 11, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (76, 11, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (77, 11, 6, '09:00', '18:00', FALSE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (78, 12, 0, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (79, 12, 1, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (80, 12, 2, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (81, 12, 3, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (82, 12, 4, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (83, 12, 5, '09:00', '18:00', TRUE);
INSERT INTO working_hours ("id", "employee_id", "day_of_week", "start_time", "end_time", "is_work_day") VALUES (84, 12, 6, '09:00', '18:00', FALSE);

-- Table: lunch_breaks (12 rows)
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (1, 1, '12:00', '13:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (2, 2, '13:00', '14:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (3, 3, '13:00', '14:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (4, 4, '13:00', '14:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (5, 5, '13:00', '14:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (6, 6, '12:00', '13:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (7, 7, '12:00', '13:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (8, 8, '12:00', '13:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (9, 9, '12:00', '13:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (10, 10, '13:00', '14:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (11, 11, '14:00', '15:00', 60);
INSERT INTO lunch_breaks ("id", "employee_id", "start_time", "end_time", "duration_minutes") VALUES (12, 12, '13:00', '14:00', 60);

-- Table: special_rules (23 rows)
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (1, 1, 'SUNDAY_ALTERNATING', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (2, 1, 'SATURDAY_ROTATION', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (3, 1, 'NEVER_BOTH_OFF_WITH_BETI', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (4, 2, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (5, 3, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (6, 3, 'TELEGRAM_BACKUP', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (7, 4, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (8, 5, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (9, 5, 'CALL_CENTER_LUNCH_COVER', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (10, 6, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (11, 6, 'TELEGRAM_BACKUP', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (12, 7, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (13, 7, 'TELEGRAM_BACKUP', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (14, 8, 'SUNDAY_NEVER_WORK', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (15, 8, 'CALL_CENTER_LUNCH_COVER', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (16, 9, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (17, 9, 'CALL_CENTER_LUNCH_COVER', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (18, 10, 'SUNDAY_NEVER_WORK', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (19, 11, 'SUNDAY_ALTERNATING', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (20, 11, 'SATURDAY_ROTATION', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (21, 11, 'NEVER_BOTH_OFF_WITH_HEBRON', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (22, 12, 'TWO_DAYS_OFF', NULL);
INSERT INTO special_rules ("id", "employee_id", "rule_type", "config_json") VALUES (23, 12, 'YEAB_COVERS_BETI', NULL);

-- Table: schedule_periods (3 rows)
INSERT INTO schedule_periods ("id", "name", "start_date", "end_date", "duration_weeks", "status", "generated_by", "created_at", "updated_at") VALUES (1, 'Roster Sep 28 – Oct 11, 2026 (Published)', '2026-09-28', '2026-10-11', 2, 'published', 'System Initializer', '2026-09-25 18:21:15.176803', '2026-09-25 18:21:15.176808');
INSERT INTO schedule_periods ("id", "name", "start_date", "end_date", "duration_weeks", "status", "generated_by", "created_at", "updated_at") VALUES (2, 'Schedule 2026-10-12 - 2026-10-18', '2026-10-12', '2026-10-18', 1, 'published', 'admin', '2026-09-28 17:57:28.427490', '2026-09-28 17:57:28.687698');
INSERT INTO schedule_periods ("id", "name", "start_date", "end_date", "duration_weeks", "status", "generated_by", "created_at", "updated_at") VALUES (3, 'Guzo Go Schedule 05 Oct - 11 Oct', '2026-10-05', '2026-10-11', 1, 'published', 'Guzo Go Verified Roster', '2026-10-03 16:17:34.175383', '2026-10-03 16:17:34.175389');

-- Table: schedule_days (28 rows)
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (1, 1, '2026-09-28', 0, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (2, 1, '2026-09-29', 1, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (3, 1, '2026-09-30', 2, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (4, 1, '2026-10-01', 3, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (5, 1, '2026-10-02', 4, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (6, 1, '2026-10-03', 5, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (7, 1, '2026-10-04', 6, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (8, 1, '2026-10-05', 0, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (9, 1, '2026-10-06', 1, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (10, 1, '2026-10-07', 2, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (11, 1, '2026-10-08', 3, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (12, 1, '2026-10-09', 4, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (13, 1, '2026-10-10', 5, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (14, 1, '2026-10-11', 6, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (15, 2, '2026-10-12', 0, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (16, 2, '2026-10-13', 1, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (17, 2, '2026-10-14', 2, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (18, 2, '2026-10-15', 3, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (19, 2, '2026-10-16', 4, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (20, 2, '2026-10-17', 5, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (21, 2, '2026-10-18', 6, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (22, 3, '2026-10-05', 0, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (23, 3, '2026-10-06', 1, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (24, 3, '2026-10-07', 2, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (25, 3, '2026-10-08', 3, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (26, 3, '2026-10-09', 4, FALSE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (27, 3, '2026-10-10', 5, TRUE);
INSERT INTO schedule_days ("id", "schedule_period_id", "date", "day_of_week", "is_weekend") VALUES (28, 3, '2026-10-11', 6, TRUE);

-- Table: shift_assignments (336 rows)
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (1, 1, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Test per-task time save');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (2, 1, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (3, 1, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (4, 1, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (5, 1, 5, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (6, 1, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (7, 1, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (8, 1, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (9, 1, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (10, 1, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (11, 1, 11, 'OFF', NULL, NULL, NULL, NULL, 'Call Center', 'Telegram', 'Multi-task coverage');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (12, 1, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (13, 2, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (14, 2, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (15, 2, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (16, 2, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (17, 2, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (18, 2, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (19, 2, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (20, 2, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (21, 2, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (22, 2, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (23, 2, 11, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (24, 2, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (25, 3, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (26, 3, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (27, 3, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (28, 3, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (29, 3, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (30, 3, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (31, 3, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (32, 3, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (33, 3, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (34, 3, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (35, 3, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (36, 3, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (37, 4, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (38, 4, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (39, 4, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (40, 4, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (41, 4, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (42, 4, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (43, 4, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (44, 4, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (45, 4, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (46, 4, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (47, 4, 11, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (48, 4, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (49, 5, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (50, 5, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (51, 5, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (52, 5, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (53, 5, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (54, 5, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (55, 5, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (56, 5, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (57, 5, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (58, 5, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (59, 5, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (60, 5, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (61, 6, 1, 'AM_HALF', '13:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Saturday Half-Day (Week A)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (62, 6, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (63, 6, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (64, 6, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (65, 6, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (66, 6, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (67, 6, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (68, 6, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (69, 6, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (70, 6, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (71, 6, 11, 'PM_HALF', '09:00', '14:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Saturday Half-Day (Week A)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (72, 6, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (73, 7, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (74, 7, 2, 'SUNDAY_DUTY', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (75, 7, 3, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (76, 7, 4, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (77, 7, 5, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (78, 7, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (79, 7, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (80, 7, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (81, 7, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (82, 7, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (83, 7, 11, 'OFF', NULL, NULL, NULL, NULL, 'Call Center', 'Amadeus', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (84, 7, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (85, 8, 1, 'OFF', NULL, NULL, NULL, NULL, 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (86, 8, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (87, 8, 3, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (88, 8, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (89, 8, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'QUE', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (90, 8, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'QUE', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (91, 8, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (92, 8, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (93, 8, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Email', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (94, 8, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (95, 8, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (96, 8, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (97, 9, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', NULL, 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (98, 9, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (99, 9, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (100, 9, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (101, 9, 5, 'WORK', '21:00', '18:00', '13:00', '14:00', 'Telegram', 'QUE', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (102, 9, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (103, 9, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (104, 9, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (105, 9, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (106, 9, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (107, 9, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (108, 9, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (109, 10, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (110, 10, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (111, 10, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (112, 10, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (113, 10, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (114, 10, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (115, 10, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (116, 10, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (117, 10, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (118, 10, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (119, 10, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (120, 10, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (121, 11, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (122, 11, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (123, 11, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (124, 11, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (125, 11, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (126, 11, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (127, 11, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (128, 11, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (129, 11, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (130, 11, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (131, 11, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (132, 11, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (133, 12, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (134, 12, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (135, 12, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (136, 12, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (137, 12, 5, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (138, 12, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (139, 12, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (140, 12, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (141, 12, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (142, 12, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (143, 12, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (144, 12, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (145, 13, 1, 'AM_HALF', '08:00', '12:00', NULL, NULL, 'Call Center', 'Telegram', 'Saturday Half-Day (Week B)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (146, 13, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (147, 13, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (148, 13, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (149, 13, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (150, 13, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (151, 13, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (152, 13, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (153, 13, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (154, 13, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (155, 13, 11, 'PM_HALF', '14:00', '18:00', NULL, NULL, 'Call Center', 'Amadeus', 'Saturday Half-Day (Week B)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (156, 13, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (157, 14, 1, 'SUNDAY_DUTY', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (158, 14, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (159, 14, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (160, 14, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (161, 14, 5, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (162, 14, 6, 'SUNDAY_DUTY', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (163, 14, 7, 'SUNDAY_DUTY', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (164, 14, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (165, 14, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (166, 14, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (167, 14, 11, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (168, 14, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (169, 15, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (170, 15, 2, 'OFF', NULL, NULL, NULL, NULL, 'Telegram', NULL, 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (171, 15, 3, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (172, 15, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (173, 15, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'QUE', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (174, 15, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', '2839 phone', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (175, 15, 7, 'OFF', NULL, NULL, NULL, NULL, 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (176, 15, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (177, 15, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Email', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (178, 15, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (179, 15, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (180, 15, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (181, 16, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'QUE', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (182, 16, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (183, 16, 3, 'OFF', NULL, NULL, NULL, NULL, 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (184, 16, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (185, 16, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'ELMS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (186, 16, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (187, 16, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (188, 16, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (189, 16, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (190, 16, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (191, 16, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (192, 16, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (193, 17, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (194, 17, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (195, 17, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (196, 17, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (197, 17, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (198, 17, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (199, 17, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (200, 17, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (201, 17, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (202, 17, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (203, 17, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (204, 17, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (205, 18, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (206, 18, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (207, 18, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (208, 18, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (209, 18, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (210, 18, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (211, 18, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (212, 18, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (213, 18, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (214, 18, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (215, 18, 11, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (216, 18, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (217, 19, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (218, 19, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (219, 19, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (220, 19, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (221, 19, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (222, 19, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (223, 19, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (224, 19, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (225, 19, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (226, 19, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (227, 19, 11, 'WORK', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (228, 19, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (229, 20, 1, 'PM_HALF', '13:00', '17:00', NULL, NULL, 'Call Center', 'Telegram', 'Saturday Half-Day (Week A)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (230, 20, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (231, 20, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (232, 20, 4, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (233, 20, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (234, 20, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (235, 20, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (236, 20, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Telegram', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (237, 20, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram', 'Call Center', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (238, 20, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (239, 20, 11, 'AM_HALF', '09:00', '14:00', NULL, NULL, 'Call Center', 'Amadeus', 'Saturday Half-Day (Week A)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (240, 20, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'GDS', 'Regular Shift');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (241, 21, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (242, 21, 2, 'SUNDAY_DUTY', '08:00', '17:00', '13:00', '14:00', 'Call Center', 'GDS', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (243, 21, 3, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Telegram', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (244, 21, 4, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Amadeus', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (245, 21, 5, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (246, 21, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (247, 21, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (248, 21, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (249, 21, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (250, 21, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (251, 21, 11, 'SUNDAY_DUTY', '09:00', '18:00', '14:00', '15:00', 'Call Center', 'Amadeus', 'Sunday Operating Squad (4 Staff)');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (252, 21, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'Scheduled Day Off');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (253, 22, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (254, 23, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (255, 24, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (256, 25, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (257, 26, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (258, 27, 9, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Telegram, Email', 'Call Center (BKP)', 'M-M: E/T/C-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (259, 28, 9, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (260, 22, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Email (BKP)', 'M-M: C/E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (261, 23, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Email (BKP)', 'M-M: C/E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (262, 24, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (263, 25, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Email (BKP)', 'M-M: C/E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (264, 26, 12, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (265, 27, 12, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Email (BKP)', 'M-M: C/E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (266, 28, 12, 'SUNDAY_DUTY', '09:00', '18:00', '12:00', '13:00', 'Call Center, Email, QUE', '2839 phone (BKP)', 'M-M: C/E/Q/2839-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (267, 22, 3, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram (BKP), Telegram (BKP)', 'E-M: C/T-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (268, 23, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (269, 24, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'QUE (BKP), Email (BKP)', 'M-M: C/Q&E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (270, 25, 3, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (271, 26, 3, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', 'Email (BKP), QUE (BKP)', 'M-M: C/E-BKP/Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (272, 27, 3, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'Telegram (BKP)', 'E-M: C/T-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (273, 28, 3, 'SUNDAY_DUTY', '08:00', '17:00', '12:00', '13:00', 'Call Center, Telegram', 'ELMS (BKP), Follow up (BKP)', 'M-M: C/T/ELMS&F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (274, 22, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP), QUE (BKP)', 'E-M: C/ELMS&Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (275, 23, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP)', 'E-M: C/ELMS-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (276, 24, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (277, 25, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP)', 'E-M: C/ELMS-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (278, 26, 6, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (279, 27, 6, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP)', 'E-M: C/ELMS');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (280, 28, 6, 'SUNDAY_DUTY', '08:00', '17:00', '13:00', '14:00', 'Call Center, Follow up', 'Email (BKP)', 'E-M: C/F/E-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (281, 22, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (282, 23, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', NULL, 'E-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (283, 24, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP)', 'E-M: C/ELMS-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (284, 25, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', NULL, 'E-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (285, 26, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'ELMS (BKP)', 'E-M: C/ELMS-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (286, 27, 7, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Call Center', 'QUE (BKP)', 'E-M: C/Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (287, 28, 7, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (288, 22, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center, 2839 phone', NULL, 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (289, 23, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (290, 24, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center, 2839 phone', NULL, 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (291, 25, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center, 2839 phone', NULL, 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (292, 26, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center, 2839 phone', NULL, 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (293, 27, 4, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center, 2839 phone', NULL, 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (294, 28, 4, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (295, 22, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP)', 'M-M: C/F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (296, 23, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP), 2839 phone (BKP)', 'M-M: C/F-BKP/2839-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (297, 24, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP)', 'M-M: C/F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (298, 25, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP)', 'M-M: C/F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (299, 26, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP)', 'M-M: C/F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (300, 27, 8, 'WORK', '09:00', '18:00', '12:00', '13:00', 'Call Center', 'Follow up (BKP)', 'M-M: C/F-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (301, 28, 8, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (302, 22, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (303, 23, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (304, 24, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (305, 25, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (306, 26, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (307, 27, 10, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center, Follow up', NULL, 'M-M: C/F');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (308, 28, 10, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (309, 22, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS, QUE', NULL, 'M-M: T/ELMS/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (310, 23, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS', 'QUE (BKP)', 'M-M: ELMS/Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (311, 24, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS', NULL, 'M-M: T/ELMS');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (312, 25, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS', 'QUE (BKP)', 'M-M: ELMS/Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (313, 26, 5, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS', NULL, 'M-M: T/ELMS');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (314, 27, 5, 'AM_HALF', '09:00', '13:00', NULL, NULL, 'Telegram, ELMS, QUE', NULL, 'M-LHD: T/ELMS/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (315, 28, 5, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Telegram, ELMS, Call Center', 'QUE (BKP)', 'M-M: C/T/ELMS/Q-BKP');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (316, 22, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center, 2839 phone', NULL, 'E-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (317, 23, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center, 2839 phone', NULL, 'E-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (318, 24, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center, 2839 phone', NULL, 'E-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (319, 25, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center, 2839 phone', NULL, 'E-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (320, 26, 2, 'WORK', '08:00', '17:00', '13:00', '14:00', 'Call Center, 2839 phone', NULL, 'E-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (321, 27, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (322, 28, 2, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (323, 22, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', NULL, 'M-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (324, 23, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', NULL, 'M-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (325, 24, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', NULL, 'M-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (326, 25, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', NULL, 'M-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (327, 26, 11, 'WORK', '09:00', '18:00', '13:00', '14:00', 'Call Center', NULL, 'M-M: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (328, 27, 11, 'AM_HALF', '09:00', '13:00', NULL, NULL, 'Call Center', NULL, 'M-LHD: C');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (329, 28, 11, 'SUNDAY_DUTY', '09:00', '18:00', '13:00', '14:00', 'Call Center, 2839 phone', 'QUE (BKP)', 'M-M: C/2839');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (330, 22, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (331, 23, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram, QUE', NULL, 'E-M: T/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (332, 24, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram, QUE', NULL, 'E-M: T/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (333, 25, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram, QUE', NULL, 'E-M: T/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (334, 26, 1, 'WORK', '08:00', '17:00', '12:00', '13:00', 'Telegram, QUE', NULL, 'E-M: T/Q');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (335, 27, 1, 'PM_HALF', '14:00', '18:00', '12:00', '13:00', 'Telegram, ELMS, QUE', NULL, 'A-LHD');
INSERT INTO shift_assignments ("id", "schedule_day_id", "employee_id", "shift_type", "start_time", "end_time", "lunch_start", "lunch_end", "primary_task", "secondary_task", "notes") VALUES (336, 28, 1, 'OFF', NULL, NULL, NULL, NULL, NULL, NULL, 'DO');

-- Table: task_assignments (227 rows)
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (1, 11, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (2, 11, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (3, 11, 'GDS', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (4, 23, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (5, 23, 'Amadeus', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (6, 47, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (7, 47, 'Amadeus', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (8, 71, 'Call Center', '09:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (9, 71, 'Amadeus', '09:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (10, 83, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (11, 83, 'Amadeus', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (15, 61, 'Call Center', '13:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (16, 61, 'Telegram', '13:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (17, 73, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (18, 73, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (19, 73, 'GDS', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (20, 85, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (21, 85, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (23, 1, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (24, 1, 'Call Center', '08:00', '09:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (25, 1, 'GDS', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (26, 1, 'Call Center', '13:00', '14:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (29, 179, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (30, 179, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (36, 175, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (37, 175, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (38, 170, 'Telegram', '08:00', '12:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (50, 174, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (51, 174, '2839 phone', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (52, 176, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (53, 176, 'Amadeus', '09:00', '18:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (54, 172, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (55, 172, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (56, 173, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (57, 173, 'QUE', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (58, 173, 'ELMS', '09:00', '18:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (59, 177, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (60, 177, 'Email', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (61, 177, 'Call Center', '13:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (62, 171, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (63, 171, 'Telegram', '13:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (64, 181, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (65, 181, 'QUE', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (66, 191, 'Call Center', '21:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (67, 191, 'Amadeus', '09:00', '18:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (68, 183, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (69, 183, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (70, 185, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (71, 185, 'ELMS', '09:00', '18:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (72, 95, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (73, 95, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (76, 89, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (77, 89, 'QUE', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (78, 89, 'ELMS', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (79, 93, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (80, 93, 'Email', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (81, 93, 'Call Center', '13:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (106, 88, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (107, 88, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (111, 90, 'Call Center', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (112, 90, 'QUE', '13:00', '14:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (113, 90, 'ELMS', '01:00', '14:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (114, 92, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (115, 92, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (116, 92, '2839 phone', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (117, 94, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (118, 94, 'Amadeus', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (119, 94, '2839 phone', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (124, 87, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (125, 87, 'Telegram', '13:00', '14:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (126, 96, 'Call Center', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (127, 96, 'GDS', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (128, 96, 'Email', '12:00', '13:00', TRUE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (129, 101, 'Telegram', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (130, 101, 'QUE', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (131, 101, 'ELMS', '09:00', '18:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (132, 97, 'Telegram', '08:00', '17:00', FALSE, NULL);
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (133, 253, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (134, 253, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (135, 253, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (136, 254, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (137, 254, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (138, 254, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (139, 255, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (140, 255, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (141, 255, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (142, 256, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (143, 256, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (144, 256, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (145, 257, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (146, 257, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (147, 257, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (148, 258, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (149, 258, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (150, 258, 'Call Center', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (151, 260, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (152, 260, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (153, 261, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (154, 261, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (155, 263, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (156, 263, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (157, 265, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (158, 265, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (159, 266, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (160, 266, 'Email', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (161, 266, 'QUE', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (162, 266, '2839 phone', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (163, 267, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (164, 267, 'Telegram', '08:00', '09:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (165, 267, 'Telegram', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (166, 269, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (167, 269, 'QUE', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (168, 269, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (169, 271, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (170, 271, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (171, 271, 'QUE', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (172, 272, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (173, 272, 'Telegram', '08:00', '09:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (174, 273, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (175, 273, 'Telegram', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (176, 273, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (177, 273, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (178, 274, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (179, 274, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (180, 274, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (181, 275, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (182, 275, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (183, 277, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (184, 277, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (185, 279, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (186, 279, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (187, 280, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (188, 280, 'Follow up', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (189, 280, 'Email', '12:00', '13:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (190, 282, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (191, 283, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (192, 283, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (193, 284, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (194, 285, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (195, 285, 'ELMS', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (196, 286, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (197, 286, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (198, 288, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (199, 288, '2839 phone', '13:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (200, 290, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (201, 290, '2839 phone', '13:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (202, 291, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (203, 291, '2839 phone', '13:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (204, 292, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (205, 292, '2839 phone', '13:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (206, 293, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (207, 293, '2839 phone', '13:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (208, 295, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (209, 295, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (210, 296, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (211, 296, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (212, 296, '2839 phone', '15:00', '18:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (213, 297, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (214, 297, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (215, 298, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (216, 298, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (217, 299, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (218, 299, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (219, 300, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (220, 300, 'Follow up', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (221, 302, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (222, 302, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (223, 303, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (224, 303, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (225, 304, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (226, 304, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (227, 305, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (228, 305, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (229, 306, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (230, 306, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (231, 307, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (232, 307, 'Follow up', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (233, 309, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (234, 309, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (235, 309, 'QUE', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (236, 310, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (237, 310, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (238, 310, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (239, 311, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (240, 311, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (241, 312, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (242, 312, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (243, 312, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (244, 313, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (245, 313, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (246, 314, 'Telegram', '09:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (247, 314, 'ELMS', '09:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (248, 314, 'QUE', '09:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (249, 315, 'Telegram', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (250, 315, 'ELMS', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (251, 315, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (252, 315, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (253, 316, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (254, 316, '2839 phone', '08:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (255, 317, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (256, 317, '2839 phone', '08:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (257, 318, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (258, 318, '2839 phone', '08:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (259, 319, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (260, 319, '2839 phone', '08:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (261, 320, 'Call Center', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (262, 320, '2839 phone', '08:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (263, 323, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (264, 324, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (265, 325, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (266, 326, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (267, 327, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (268, 328, 'Call Center', '09:00', '13:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (269, 329, 'Call Center', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (270, 329, '2839 phone', '09:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (271, 329, 'QUE', '13:00', '14:00', TRUE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (272, 331, 'Telegram', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (273, 331, 'QUE', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (274, 332, 'Telegram', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (275, 332, 'QUE', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (276, 333, 'Telegram', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (277, 333, 'QUE', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (278, 334, 'Telegram', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (279, 334, 'QUE', '08:00', '17:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (280, 335, 'Telegram', '14:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (281, 335, 'ELMS', '14:00', '18:00', FALSE, 'Guzo Go Schedule Verified');
INSERT INTO task_assignments ("id", "shift_assignment_id", "task_name", "start_time", "end_time", "is_backup", "notes") VALUES (282, 335, 'QUE', '14:00', '18:00', FALSE, 'Guzo Go Schedule Verified');

-- Table: schedule_conflicts (21 rows)
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (10, 2, '2026-10-12', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-12 during 8:00–9:00: only 1 staff available (Tirsit).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 19:57:16.981929');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (11, 2, '2026-10-13', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-13 during 8:00–9:00: only 1 staff available (Rediet).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 19:57:16.981952');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (12, 2, '2026-10-18', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-18 during 8:00–9:00: only 1 staff available (Shalom).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 19:57:16.981955');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (13, 2, '2026-10-18', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-18 during 1:00–2:00: only 1 staff available (Beti).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 19:57:16.981958');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (14, 2, 'Week 3', NULL, 'Shalom', 'warning', 'DAYS_OFF_VIOLATION', 'Shalom has 3 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Shalom has exactly 2 days off during the week.', '2026-10-01 19:57:16.981961');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (15, 2, 'Week 3', NULL, 'Biruk', 'warning', 'DAYS_OFF_VIOLATION', 'Biruk has 3 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Biruk has exactly 2 days off during the week.', '2026-10-01 19:57:16.981964');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (16, 2, 'Week 3', NULL, 'Luam', 'critical', 'DAYS_OFF_VIOLATION', 'Luam has 1 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Luam has exactly 2 days off during the week.', '2026-10-01 19:57:16.981967');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (17, 2, 'Week 3', NULL, 'Feruza', 'critical', 'DAYS_OFF_VIOLATION', 'Feruza has 1 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Feruza has exactly 2 days off during the week.', '2026-10-01 19:57:16.981969');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (18, 2, 'Week 3', NULL, 'Rediet', 'warning', 'DAYS_OFF_VIOLATION', 'Rediet has 3 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Rediet has exactly 2 days off during the week.', '2026-10-01 19:57:16.981972');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (19, 2, 'Week 3', NULL, 'Beti', 'critical', 'DAYS_OFF_VIOLATION', 'Beti has 1 days OFF in Week 3. Exactly 2 days OFF are required.', 'Adjust shifts so Beti has exactly 2 days off during the week.', '2026-10-01 19:57:16.981974');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (20, 1, '2026-10-04', NULL, 'Beti', 'critical', 'SUNDAY_ROTATION_MISMATCH', 'Week schedule dictates Beti should work Sunday 2026-10-04, but Beti is OFF.', 'Assign Beti to Sunday duty and set Hebron to OFF.', '2026-10-01 20:43:34.878856');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (21, 1, '2026-10-03', NULL, 'Hebron', 'critical', 'SATURDAY_ROTATION_VIOLATION', 'Saturday 2026-10-03 is Week A: Hebron must work PM_HALF (13:00–17:00).', 'Change Hebron to PM_HALF.', '2026-10-01 20:43:34.878863');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (22, 1, '2026-10-03', NULL, 'Beti', 'critical', 'SATURDAY_ROTATION_VIOLATION', 'Saturday 2026-10-03 is Week A: Beti must work AM_HALF (09:00–14:00).', 'Change Beti to AM_HALF.', '2026-10-01 20:43:34.878866');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (23, 1, '2026-10-04', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-04 during 1:00–2:00: only 1 staff available (Hebron).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 20:43:34.878869');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (24, 1, '2026-10-05', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-05 during 8:00–9:00: only 1 staff available (Tirsit).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 20:43:34.878872');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (25, 1, '2026-10-11', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-11 during 12:00–1:00: only 1 staff available (Feruza).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 20:43:34.878875');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (26, 1, '2026-10-11', NULL, 'All Staff', 'warning', 'CALL_CENTER_LIMITED_COVERAGE', 'Limited coverage on 2026-10-11 during 5:00–6:00: only 1 staff available (Feruza).', 'Consider scheduling an additional qualified agent for redundancy.', '2026-10-01 20:43:34.878877');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (27, 1, 'Week 1', NULL, 'Hebron', 'critical', 'DAYS_OFF_VIOLATION', 'Hebron has 1 days OFF in Week 1. Exactly 2 days OFF are required.', 'Adjust shifts so Hebron has exactly 2 days off during the week.', '2026-10-01 20:43:34.878880');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (28, 1, 'Week 2', NULL, 'Hebron', 'warning', 'DAYS_OFF_VIOLATION', 'Hebron has 3 days OFF in Week 2. Exactly 2 days OFF are required.', 'Adjust shifts so Hebron has exactly 2 days off during the week.', '2026-10-01 20:43:34.878882');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (29, 1, 'Week 2', NULL, 'Feruza', 'critical', 'DAYS_OFF_VIOLATION', 'Feruza has 1 days OFF in Week 2. Exactly 2 days OFF are required.', 'Adjust shifts so Feruza has exactly 2 days off during the week.', '2026-10-01 20:43:34.878885');
INSERT INTO schedule_conflicts ("id", "schedule_period_id", "date", "employee_id", "employee_name", "severity", "error_type", "message", "suggestion", "created_at") VALUES (30, 1, 'Week 2', NULL, 'Beti', 'critical', 'DAYS_OFF_VIOLATION', 'Beti has 1 days OFF in Week 2. Exactly 2 days OFF are required.', 'Adjust shifts so Beti has exactly 2 days off during the week.', '2026-10-01 20:43:34.878887');

-- Table: system_settings (6 rows)
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (1, 'sunday_max_staff', '4', 'Maximum number of staff members allowed in office on Sunday');
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (2, 'required_call_center_target', '2', 'Target number of call center agents per slot for GREEN coverage');
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (3, 'saturday_rotation_anchor_date', '2026-09-28', 'Reference date for Week A Saturday half-day rotation');
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (4, 'weekly_days_off_count', '2', 'Mandatory number of days off per 7-day week for regular staff');
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (5, 'operating_start_hour', '08:00', 'Call center morning opening time');
INSERT INTO system_settings ("id", "key", "value", "description") VALUES (6, 'operating_end_hour', '18:00', 'Call center evening closing time');

-- Table: audit_logs (75 rows)
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (1, NULL, 'System', 'SEED_SCHEDULE', 'SchedulePeriod', 1, '2026-09-25 18:21:15.218367', NULL, 'Seeded initial verified 2-week schedule Sep 28 – Oct 11, 2026', 'System Initialization');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (2, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 11, '2026-09-25 19:18:27.874075', 'Beti was WORK (09:00-18:00)', 'Beti changed to WORK (09:00-18:00)', 'Assigned Call Center, Telegram, and GDS');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (3, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 11, '2026-09-26 05:05:19.735470', 'Beti was WORK (09:00-18:00)', 'Beti changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (4, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 23, '2026-09-26 05:05:47.206422', 'Beti was OFF (-)', 'Beti changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (5, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 47, '2026-09-26 05:06:03.400625', 'Beti was OFF (-)', 'Beti changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (6, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 71, '2026-09-26 05:06:37.728204', 'Beti was AM_HALF (09:00-14:00)', 'Beti changed to PM_HALF (09:00-14:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (7, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 83, '2026-09-26 05:06:51.000172', 'Beti was SUNDAY_DUTY (09:00-18:00)', 'Beti changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (8, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:08:43.808402', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (9, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 61, '2026-09-26 05:09:28.535724', 'Hebron was PM_HALF (13:00-17:00)', 'Hebron changed to AM_HALF (13:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (10, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 73, '2026-09-26 05:09:43.989603', 'Hebron was OFF (-)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (11, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 73, '2026-09-26 05:09:57.684227', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (12, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 85, '2026-09-26 05:10:04.559857', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (13, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 95, '2026-09-26 05:10:24.706275', 'Beti was OFF (-)', 'Beti changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (14, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:24:28.930962', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (15, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:25:45.196425', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (16, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:33:36.079424', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (17, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:37:15.919697', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (18, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:38:53.025003', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (19, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:41:11.665526', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (20, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 05:46:41.786740', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Debug test');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (21, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 1, '2026-09-26 06:17:19.908537', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (22, 1, 'admin', 'ASSIGN_TASK', 'TaskAssignment', 2, '2026-09-26 17:26:05.728255', NULL, 'Assigned Telegram (08:00-09:00) to Shalom', 'Manager task assignment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (23, 1, 'admin', 'GENERATE_SCHEDULE', 'SchedulePeriod', 2, '2026-09-28 17:57:28.512861', NULL, 'Generated 1-week schedule: Schedule 2026-10-12 - 2026-10-18', 'Automated schedule generation');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (24, 1, 'admin', 'PUBLISH_SCHEDULE', 'SchedulePeriod', 2, '2026-09-28 17:57:28.611694', 'draft', 'published', 'Manager published verified schedule');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (25, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 179, '2026-09-28 18:00:24.630257', 'Beti was WORK (09:00-18:00)', 'Beti changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (26, 1, 'admin', 'ASSIGN_TASK', 'TaskAssignment', 170, '2026-09-28 19:40:46.591292', NULL, 'Assigned Telegram (08:00-12:00) to Shalom', 'Manager task assignment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (27, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 179, '2026-10-01 19:21:40.137687', 'Beti was WORK (09:00-18:00)', 'Beti changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (28, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 173, '2026-10-01 19:26:24.294609', 'Feruza was OFF (-)', 'Feruza changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (29, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 171, '2026-10-01 19:27:58.397710', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (30, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 175, '2026-10-01 19:29:58.544551', 'Rediet was WORK (08:00-17:00)', 'Rediet changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (31, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 170, '2026-10-01 19:32:14.874356', 'Shalom was WORK (08:00-17:00)', 'Shalom changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (32, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 172, '2026-10-01 19:33:31.481478', 'Luam was OFF (-)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (33, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 177, '2026-10-01 19:36:57.545704', 'Hermela was WORK (09:00-18:00)', 'Hermela changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (34, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 177, '2026-10-01 19:38:00.336712', 'Hermela was WORK (09:00-18:00)', 'Hermela changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (35, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 173, '2026-10-01 19:38:15.038087', 'Feruza was WORK (09:00-18:00)', 'Feruza changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (36, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 177, '2026-10-01 19:39:03.120940', 'Hermela was WORK (09:00-18:00)', 'Hermela changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (37, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 174, '2026-10-01 19:40:39.787650', 'Tirsit was WORK (08:00-17:00)', 'Tirsit changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (38, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 176, '2026-10-01 19:41:52.788721', 'Yordi was WORK (09:00-18:00)', 'Yordi changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (39, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 172, '2026-10-01 19:45:12.188238', 'Luam was WORK (09:00-18:00)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (40, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 173, '2026-10-01 19:49:20.091821', 'Feruza was WORK (09:00-18:00)', 'Feruza changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (41, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 177, '2026-10-01 19:49:59.088012', 'Hermela was WORK (09:00-18:00)', 'Hermela changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (42, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 171, '2026-10-01 19:50:49.071358', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (43, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 181, '2026-10-01 19:52:45.602534', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (44, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 191, '2026-10-01 19:55:14.269672', 'Beti was OFF (-)', 'Beti changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (45, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 183, '2026-10-01 19:55:27.222442', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to OFF (-)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (46, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 185, '2026-10-01 19:57:16.929142', 'Feruza was WORK (09:00-18:00)', 'Feruza changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (47, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 95, '2026-10-01 20:03:48.341139', 'Beti was WORK (08:00-17:00)', 'Beti changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (48, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 87, '2026-10-01 20:06:00.203805', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (49, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 89, '2026-10-01 20:08:45.014826', 'Feruza was WORK (09:00-18:00)', 'Feruza changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (50, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 93, '2026-10-01 20:10:40.145569', 'Hermela was WORK (09:00-18:00)', 'Hermela changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (51, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 88, '2026-10-01 20:11:30.667919', 'Luam was WORK (09:00-18:00)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (52, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 88, '2026-10-01 20:11:48.696696', 'Luam was WORK (09:00-18:00)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (53, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 94, '2026-10-01 20:12:51.540036', 'Obsa was WORK (09:00-18:00)', 'Obsa changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (54, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 90, '2026-10-01 20:14:03.325308', 'Tirsit was WORK (08:00-17:00)', 'Tirsit changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (55, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:15:19.550555', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (56, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:15:44.742702', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (57, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 92, '2026-10-01 20:16:34.583323', 'Yordi was WORK (09:00-18:00)', 'Yordi changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (58, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 90, '2026-10-01 20:21:07.114970', 'Tirsit was WORK (08:00-17:00)', 'Tirsit changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (59, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:24:54.292218', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (60, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 88, '2026-10-01 20:25:30.828133', 'Luam was WORK (09:00-18:00)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (61, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 90, '2026-10-01 20:27:28.947550', 'Tirsit was WORK (08:00-17:00)', 'Tirsit changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (62, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 88, '2026-10-01 20:28:22.842696', 'Luam was WORK (09:00-18:00)', 'Luam changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (63, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:31:24.724492', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (64, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 90, '2026-10-01 20:35:11.800845', 'Tirsit was WORK (08:00-17:00)', 'Tirsit changed to WORK (08:00-17:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (65, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 92, '2026-10-01 20:35:46.719829', 'Yordi was WORK (09:00-18:00)', 'Yordi changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (66, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 94, '2026-10-01 20:36:01.792208', 'Obsa was WORK (09:00-18:00)', 'Obsa changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (67, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:36:51.383831', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (68, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 87, '2026-10-01 20:37:27.742573', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (69, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 87, '2026-10-01 20:37:37.093041', 'Biruk was WORK (09:00-18:00)', 'Biruk changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (70, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 96, '2026-10-01 20:38:25.839061', 'Yeab was WORK (09:00-18:00)', 'Yeab changed to WORK (09:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (71, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 101, '2026-10-01 20:41:35.973380', 'Feruza was OFF (-)', 'Feruza changed to WORK (21:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (72, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 101, '2026-10-01 20:42:26.700931', 'Feruza was WORK (21:00-18:00)', 'Feruza changed to WORK (21:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (73, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 101, '2026-10-01 20:42:36.966437', 'Feruza was WORK (21:00-18:00)', 'Feruza changed to WORK (21:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (74, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 101, '2026-10-01 20:42:52.945783', 'Feruza was WORK (21:00-18:00)', 'Feruza changed to WORK (21:00-18:00)', 'Manager schedule adjustment');
INSERT INTO audit_logs ("id", "user_id", "user_name", "action", "entity_type", "entity_id", "date_time", "old_value", "new_value", "reason") VALUES (75, 1, 'admin', 'UPDATE_SHIFT', 'ShiftAssignment', 97, '2026-10-01 20:43:34.760961', 'Hebron was WORK (08:00-17:00)', 'Hebron changed to WORK (08:00-17:00)', 'Manager schedule adjustment');

-- 4. Reset PostgreSQL SERIAL sequences (if using PostgreSQL)
DO $$
DECLARE
    seq text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        SELECT pg_get_serial_sequence('users', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM users), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'employees') THEN
        SELECT pg_get_serial_sequence('employees', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM employees), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'skills') THEN
        SELECT pg_get_serial_sequence('skills', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM skills), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'employee_skills') THEN
        SELECT pg_get_serial_sequence('employee_skills', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM employee_skills), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'working_hours') THEN
        SELECT pg_get_serial_sequence('working_hours', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM working_hours), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lunch_breaks') THEN
        SELECT pg_get_serial_sequence('lunch_breaks', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM lunch_breaks), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'special_rules') THEN
        SELECT pg_get_serial_sequence('special_rules', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM special_rules), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schedule_periods') THEN
        SELECT pg_get_serial_sequence('schedule_periods', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM schedule_periods), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schedule_days') THEN
        SELECT pg_get_serial_sequence('schedule_days', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM schedule_days), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'shift_assignments') THEN
        SELECT pg_get_serial_sequence('shift_assignments', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM shift_assignments), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'task_assignments') THEN
        SELECT pg_get_serial_sequence('task_assignments', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM task_assignments), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schedule_conflicts') THEN
        SELECT pg_get_serial_sequence('schedule_conflicts', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM schedule_conflicts), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coverage_requirements') THEN
        SELECT pg_get_serial_sequence('coverage_requirements', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM coverage_requirements), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings') THEN
        SELECT pg_get_serial_sequence('system_settings', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM system_settings), 1), true);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs') THEN
        SELECT pg_get_serial_sequence('audit_logs', 'id') INTO seq;
        IF seq IS NOT NULL THEN
            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM audit_logs), 1), true);
        END IF;
    END IF;
END $$;