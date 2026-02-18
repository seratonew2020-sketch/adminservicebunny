-- Fix 403 Forbidden Errors by ensuring proper RLS policies and permissions
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Ensure Departments and Positions tables exist (if they don't)
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    position_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Grant Access Permissions (Crucial for 403s)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.departments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.positions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.employees TO anon, authenticated, service_role;

-- 3. Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- 4. Fix/Reset Policies

-- DEPARTMENTS (Readable by everyone, Manageable by Admin)
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage departments" ON departments;
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (
  (SELECT role FROM employees WHERE user_id = auth.uid()) IN ('admin', 'manager')
);

-- POSITIONS (Readable by everyone, Manageable by Admin)
DROP POLICY IF EXISTS "Public read positions" ON positions;
CREATE POLICY "Public read positions" ON positions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage positions" ON positions;
CREATE POLICY "Admins manage positions" ON positions FOR ALL USING (
  (SELECT role FROM employees WHERE user_id = auth.uid()) IN ('admin', 'manager')
);

-- EMPLOYEES
-- Ensure users can read their own profile including joined data
DROP POLICY IF EXISTS "Users view own profile" ON employees;
CREATE POLICY "Users view own profile" ON employees 
FOR SELECT USING (
  auth.uid() = user_id
);

-- Ensure Admins/Managers can view all
DROP POLICY IF EXISTS "Admins view all profiles" ON employees;
CREATE POLICY "Admins view all profiles" ON employees 
FOR SELECT USING (
  (SELECT role FROM employees WHERE user_id = auth.uid()) IN ('admin', 'manager')
);

-- 5. Fix Foreign Keys (Ensure they match the query expectations)
-- The query uses departments:dept_id(*) which implies dept_id is the FK column.
-- We try to add the columns if they miss, or add constraint if missing.

DO $$
BEGIN
    -- Add dept_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'dept_id') THEN
        ALTER TABLE employees ADD COLUMN dept_id INTEGER REFERENCES departments(department_id);
    END IF;

    -- Add pos_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pos_id') THEN
        ALTER TABLE employees ADD COLUMN pos_id INTEGER REFERENCES positions(position_id);
    END IF;
END $$;
