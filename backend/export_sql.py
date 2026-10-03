import sqlite3
from pathlib import Path

def export_full_sql():
    db_path = Path("callcenter.db")
    if not db_path.exists():
        print("Database not found!")
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    tables_order = [
        'users', 'employees', 'skills', 'employee_skills',
        'working_hours', 'lunch_breaks', 'special_rules',
        'schedule_periods', 'schedule_days', 'shift_assignments',
        'task_assignments', 'schedule_conflicts', 'coverage_requirements',
        'system_settings', 'audit_logs'
    ]

    boolean_cols = {'is_active', 'is_work_day', 'is_weekend', 'is_backup'}

    out = []
    out.append('-- ====================================================================')
    out.append('-- Call Center Staff Scheduling & Management System - Complete SQL Dump')
    out.append('-- Compatible with PostgreSQL & standard SQL clients')
    out.append('-- Generated: 2026-10-03')
    out.append('-- ====================================================================\n')

    out.append('-- 1. Clean existing tables if needed')
    for tbl in reversed(tables_order):
        out.append(f'DROP TABLE IF EXISTS {tbl} CASCADE;')
    out.append('\n')

    schema_file = Path("../database/schema.sql")
    if schema_file.exists():
        with open(schema_file, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        out.append('-- 2. Schema Definitions')
        out.append(schema_sql)
        out.append('\n-- 3. Data Inserts\n')

    for tbl in tables_order:
        cursor.execute(f'PRAGMA table_info({tbl})')
        columns = [row[1] for row in cursor.fetchall()]
        if not columns:
            continue
        
        col_names = ', '.join([f'"{c}"' for c in columns])
        
        cursor.execute(f'SELECT * FROM {tbl}')
        rows = cursor.fetchall()
        if not rows:
            continue
            
        out.append(f'-- Table: {tbl} ({len(rows)} rows)')
        for r in rows:
            val_strs = []
            for col_name, val in zip(columns, r):
                if val is None:
                    val_strs.append('NULL')
                elif col_name in boolean_cols:
                    val_strs.append('TRUE' if val else 'FALSE')
                elif isinstance(val, (int, float)):
                    val_strs.append(str(val))
                else:
                    escaped = str(val).replace("'", "''")
                    val_strs.append(f"'{escaped}'")
            values_clause = ", ".join(val_strs)
            out.append(f'INSERT INTO {tbl} ({col_names}) VALUES ({values_clause});')
        out.append('')

    out.append('-- 4. Reset PostgreSQL SERIAL sequences (if using PostgreSQL)')
    out.append('DO $$')
    out.append('DECLARE')
    out.append('    seq text;')
    out.append('BEGIN')
    for tbl in tables_order:
        out.append(f"    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '{tbl}') THEN")
        out.append(f"        SELECT pg_get_serial_sequence('{tbl}', 'id') INTO seq;")
        out.append(f"        IF seq IS NOT NULL THEN")
        out.append(f"            PERFORM setval(seq, COALESCE((SELECT MAX(id) FROM {tbl}), 1), true);")
        out.append(f"        END IF;")
        out.append(f"    END IF;")
    out.append('END $$;')

    final_sql = '\n'.join(out)
    target_path = Path("../database/callcenter_full_database.sql")
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(final_sql)

    print(f"Generated {target_path} successfully ({len(final_sql)} bytes)!")

if __name__ == "__main__":
    export_full_sql()
