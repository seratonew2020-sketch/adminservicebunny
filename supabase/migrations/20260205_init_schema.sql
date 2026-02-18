-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter Employees Table to add user_id and role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id') THEN
        ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
        ALTER TABLE employees ADD COLUMN role VARCHAR(20) DEFAULT 'employee';
    END IF;
END $$;

-- Create Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'public' CHECK (type IN ('public', 'company')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on employees if not already enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (optional, but safer for re-runs)
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Admins and Managers can view all employees" ON employees;
DROP POLICY IF EXISTS "Employees can view own leaves" ON leaves;
DROP POLICY IF EXISTS "Admins and Managers can view all leaves" ON leaves;
DROP POLICY IF EXISTS "Employees can insert own leaves" ON leaves;
DROP POLICY IF EXISTS "Managers can update leaves" ON leaves;
DROP POLICY IF EXISTS "Everyone can read holidays" ON holidays;
DROP POLICY IF EXISTS "Admins can manage holidays" ON holidays;

-- RLS Policies

-- Employees:
CREATE POLICY "Employees can view own profile" ON employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and Managers can view all employees" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('admin', 'manager')
    )
  );

-- Leaves:
-- Assuming leaves table uses employee_code to link to employees
-- We need to map auth.uid() -> employees.user_id -> employees.employee_code -> leaves.employee_code

CREATE POLICY "Employees can view own leaves" ON leaves
  FOR SELECT USING (
    employee_code IN (
      SELECT employee_code FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can view all leaves" ON leaves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Employees can insert own leaves" ON leaves
  FOR INSERT WITH CHECK (
    employee_code IN (
      SELECT employee_code FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update leaves" ON leaves
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('admin', 'manager')
    )
  );

-- Holidays:
CREATE POLICY "Everyone can read holidays" ON holidays
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage holidays" ON holidays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role = 'admin'
    )
  );
