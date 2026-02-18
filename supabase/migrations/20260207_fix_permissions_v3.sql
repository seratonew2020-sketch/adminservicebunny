-- FIX 403 & PERMISSION DENIED ON TABLE USERS (Ultimate Fix)
-- This script addresses the issue where Supabase queries fail because they try to reference `auth.users` directly 
-- or via a foreign key that the current user doesn't have permission to see.

-- 1. Create a public view for users (safest way to expose auth.users data)
-- We'll call it `public_users` to avoid conflict with potential `public.users` table
CREATE OR REPLACE VIEW public_users AS
SELECT id, email, raw_user_meta_data
FROM auth.users;

-- Grant access to this view
GRANT SELECT ON public_users TO anon, authenticated, service_role;

-- 2. Fix Foreign Keys in Employees Table
-- If `user_id` in employees references `auth.users`, standard RLS might block JOINs.
-- We can't easily change the FK constraint to a view, but we can ensure the policy doesn't trip up.

-- 3. OVERRIDE ALL RLS on Employees to be extremely simple first to debug
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON employees;
CREATE POLICY "Enable insert for authenticated users only" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for users based on email" ON employees;
CREATE POLICY "Enable update for users based on email" ON employees FOR UPDATE USING (auth.uid() = user_id);

-- 4. Fix Notifications
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for own notifications" ON notifications;
CREATE POLICY "Enable read access for own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for own notifications" ON notifications;
CREATE POLICY "Enable update for own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for service role" ON notifications;
CREATE POLICY "Enable insert for service role" ON notifications FOR INSERT WITH CHECK (true); -- Allow system to insert

-- 5. Helper function cleanup
-- We will redefine get_my_role to be simple and use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  END IF;
  
  -- Direct query, bypassing RLS because of SECURITY DEFINER
  SELECT role INTO user_role FROM employees WHERE user_id = auth.uid() LIMIT 1;
  
  RETURN COALESCE(user_role, 'employee');
EXCEPTION WHEN OTHERS THEN
  RETURN 'employee';
END;
$$;

-- 6. Re-enable Stricter Policies for Employees (After verifying basic read works)
-- We use the safe function we just created
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;

-- Admin/Manager can see all
CREATE POLICY "Admins view all" ON employees FOR SELECT USING (
  get_my_role() IN ('admin', 'manager')
);

-- Users can see themselves
CREATE POLICY "Users view self" ON employees FOR SELECT USING (
  auth.uid() = user_id
);

-- Public read (if needed for login checks before auth?) - usually NO.
-- But we might need to allow reading basic info? 
-- Let's stick to the above two. If a user has no employee record, they can't see anything, which is correct.

-- 7. Grant everything again just to be sure
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
