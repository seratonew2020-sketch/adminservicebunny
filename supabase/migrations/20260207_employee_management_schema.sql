-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Index for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Alter Employees Table to add missing columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add Foreign Keys linking to existing departments and positions tables (using integer IDs)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dept_id INTEGER REFERENCES departments(department_id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pos_id INTEGER REFERENCES positions(position_id);

-- Create Indexes for new FKs
CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON employees(dept_id);
CREATE INDEX IF NOT EXISTS idx_employees_pos_id ON employees(pos_id);

-- Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    RETURN user_email IN ('adm001@bunny.com', 'admin@bunny.com', 'adm002@bunny.com', 'manager1@bunny.com', 'manager2@bunny.com');
END;
$$;

-- RLS Policies

-- Audit Logs
DROP POLICY IF EXISTS "Admins view audit logs" ON audit_logs;
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (is_admin_email());

DROP POLICY IF EXISTS "System create audit logs" ON audit_logs;
CREATE POLICY "System create audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Employees
-- Note: Existing policies might exist. We add ours or replace if needed.
-- "Users view own profile"
DROP POLICY IF EXISTS "Users view own profile" ON employees;
CREATE POLICY "Users view own profile" ON employees FOR SELECT USING (auth.uid() = user_id);

-- "Admins view all profiles"
DROP POLICY IF EXISTS "Admins view all profiles" ON employees;
CREATE POLICY "Admins view all profiles" ON employees FOR SELECT USING (is_admin_email());

-- "Admins manage profiles"
DROP POLICY IF EXISTS "Admins manage profiles" ON employees;
CREATE POLICY "Admins manage profiles" ON employees FOR ALL USING (is_admin_email());

-- "Users update own profile"
DROP POLICY IF EXISTS "Users update own profile" ON employees;
CREATE POLICY "Users update own profile" ON employees FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Departments & Positions (Read only for everyone, Write for Admin)
-- We need to ensure RLS is enabled on them if we want to restrict write
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage departments" ON departments;
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (is_admin_email());

DROP POLICY IF EXISTS "Public read positions" ON positions;
CREATE POLICY "Public read positions" ON positions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage positions" ON positions;
CREATE POLICY "Admins manage positions" ON positions FOR ALL USING (is_admin_email());
