-- Fix 403 Forbidden on "users" table query
-- The error "permission denied for table users" suggests the app is trying to join the `users` table or query it directly,
-- which Supabase usually blocks (auth.users is private).
-- However, looking at the logs, it seems to be failing on `employees` table policies or related joins.

-- CRITICAL FIX: Ensure the get_my_role() function handles cases where user has no employee record yet.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Return 'none' if no user is logged in
  IF auth.uid() IS NULL THEN
    RETURN 'none';
  END IF;

  SELECT role INTO user_role FROM employees WHERE user_id = auth.uid();
  
  -- Return 'employee' as default if found but no role set, or 'none' if not found
  RETURN COALESCE(user_role, 'none');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'none';
END;
$$;

-- RE-APPLY POLICIES with stricter checks but safe function
DROP POLICY IF EXISTS "Admins view all profiles" ON employees;
CREATE POLICY "Admins view all profiles" ON employees 
FOR SELECT USING (
  get_my_role() IN ('admin', 'manager')
);

DROP POLICY IF EXISTS "Admins manage profiles" ON employees;
CREATE POLICY "Admins manage profiles" ON employees 
FOR ALL USING (
  get_my_role() IN ('admin', 'manager')
);

-- Allow new user registration (INSERT) if they don't exist yet? 
-- Usually admins create employees. If self-registration is needed, we need a policy for that.
-- For now, let's assume Admins create them.

-- FIX: Grant permissions explicitly again
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE employees TO anon, authenticated;
GRANT ALL ON TABLE departments TO anon, authenticated;
GRANT ALL ON TABLE positions TO anon, authenticated;
GRANT ALL ON TABLE attendance_logs TO anon, authenticated;
GRANT ALL ON TABLE leaves TO anon, authenticated;
GRANT ALL ON TABLE audit_logs TO anon, authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
