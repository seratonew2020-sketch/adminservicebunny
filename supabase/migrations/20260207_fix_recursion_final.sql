-- Fix Infinite Recursion in RLS Policies
-- The recursion happens because "Admins manage departments" and "Admins view all profiles" policies
-- query the 'employees' table to check the role, while 'employees' table policies might query themselves or related tables.

-- To fix this, we should use a JWT claim or a SECURITY DEFINER function to check roles,
-- instead of querying the table directly within the policy.

-- 1. Create a helper function to check role safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Update Policies to use the function instead of direct subquery

-- DEPARTMENTS
DROP POLICY IF EXISTS "Admins manage departments" ON departments;
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (
  get_my_role() IN ('admin', 'manager')
);

-- POSITIONS
DROP POLICY IF EXISTS "Admins manage positions" ON positions;
CREATE POLICY "Admins manage positions" ON positions FOR ALL USING (
  get_my_role() IN ('admin', 'manager')
);

-- EMPLOYEES
DROP POLICY IF EXISTS "Admins view all profiles" ON employees;
CREATE POLICY "Admins view all profiles" ON employees 
FOR SELECT USING (
  get_my_role() IN ('admin', 'manager')
);

-- Also fix "Admins manage profiles" if it exists
DROP POLICY IF EXISTS "Admins manage profiles" ON employees;
CREATE POLICY "Admins manage profiles" ON employees 
FOR ALL USING (
  get_my_role() IN ('admin', 'manager')
);
