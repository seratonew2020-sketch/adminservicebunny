-- Fix RLS Recursion and Establish Safe Policies
-- Run this in Supabase SQL Editor

-- 1. Drop Recursive Policies
DROP POLICY IF EXISTS "Admins and Managers can view all employees" ON employees;
DROP POLICY IF EXISTS "Admins view all profiles" ON employees;
DROP POLICY IF EXISTS "Admins manage profiles" ON employees;
DROP POLICY IF EXISTS "Users view own profile" ON employees;

-- 2. Create/Replace Secure Helper Function
-- This function runs as the owner (postgres) and bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM employees WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$;

-- 3. Create/Replace Policies using the Safe Function

-- Allow users to view their own profile
CREATE POLICY "Users view own profile" ON employees
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow Admins/Managers to view ALL profiles
-- Using get_my_role() which is safe
CREATE POLICY "Admins view all profiles" ON employees
  FOR SELECT USING (
    get_my_role() IN ('admin', 'manager')
  );

-- Allow Admins to INSERT/UPDATE/DELETE (Manage)
CREATE POLICY "Admins manage profiles" ON employees
  FOR ALL USING (
    get_my_role() IN ('admin', 'manager')
  );

-- 4. Ensure Departments and Positions are Accessible
-- (Re-applying just in case)
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read positions" ON positions;
CREATE POLICY "Public read positions" ON positions FOR SELECT USING (true);

-- 5. Grant Permissions to Authenticated Users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE employees TO authenticated;
GRANT SELECT ON TABLE departments TO authenticated;
GRANT SELECT ON TABLE positions TO authenticated;
