-- Link attendance_logs.employee_id to employees.employee_id
-- Run this in Supabase SQL Editor to enable Join query (Alternative to the code workaround)

-- 1. Check if constraint already exists (Optional)
-- select constraint_name from information_schema.table_constraints where table_name = 'attendance_logs';

-- 2. Add Foreign Key Constraint
-- Adjust 'employee_id' if your primary key in employees is named differently (e.g. 'id')
ALTER TABLE "public"."attendance_logs"
ADD CONSTRAINT "fk_attendance_logs_employees"
FOREIGN KEY ("employee_id")
REFERENCES "public"."employees" ("employee_id");

-- Note: Ensure 'employees.employee_id' is UNIQUE or a PRIMARY KEY.
