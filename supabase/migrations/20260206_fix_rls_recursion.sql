-- Fix Infinite Recursion in RLS Policies

-- 1. Create a secure function to get the current user's role
-- This function runs as SECURITY DEFINER, bypassing RLS on the employees table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM employees WHERE employees.user_id = auth.uid();
  RETURN user_role;
END;
$$;

-- 2. Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins and Managers can view all employees" ON employees;
DROP POLICY IF EXISTS "Admins and Managers can view all leaves" ON leaves;
DROP POLICY IF EXISTS "Managers can update leaves" ON leaves;
DROP POLICY IF EXISTS "Admins can manage holidays" ON holidays;

-- 3. Re-create policies using the helper function

-- Employees Table
CREATE POLICY "Admins and Managers can view all employees" ON employees
  FOR SELECT USING (
    get_current_user_role() IN ('admin', 'manager')
  );

-- Leaves Table
CREATE POLICY "Admins and Managers can view all leaves" ON leaves
  FOR SELECT USING (
    get_current_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "Managers can update leaves" ON leaves
  FOR UPDATE USING (
    get_current_user_role() IN ('admin', 'manager')
  );

-- Holidays Table
CREATE POLICY "Admins can manage holidays" ON holidays
  FOR ALL USING (
    get_current_user_role() = 'admin'
  );
