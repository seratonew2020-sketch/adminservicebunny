-- Fix 403 Forbidden and "Permission denied for table users"
-- This script ensures ALL tables are accessible and fixes any RLS issues.

-- 1. Ensure public.users does not exist or is accessible
-- Sometimes users accidentally create a public.users table. If it exists, we need to handle it.
-- But usually, "permission denied for table users" in Supabase refers to a failed lookup on auth.users via a FK.

-- GRANT ALL on all tables in public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Explicitly Grant access to Notifications and Preferences
GRANT ALL ON TABLE notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE notification_preferences TO anon, authenticated, service_role;

-- 3. Update get_my_role to be absolutely safe
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- If no user is logged in, return 'anon'
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  END IF;

  -- Check if user exists in employees table
  SELECT role INTO user_role FROM employees WHERE user_id = auth.uid();
  
  -- If user found, return role. If not found, return 'none' (or 'employee' if you want default)
  RETURN COALESCE(user_role, 'none');
EXCEPTION
  WHEN OTHERS THEN
    -- In case of any error (e.g. table doesn't exist), return 'error'
    RETURN 'error';
END;
$$;

-- 4. Apply non-recursive policies using the safe function

-- EMPLOYEES
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "Users view own profile" ON employees;
CREATE POLICY "Users view own profile" ON employees 
FOR SELECT USING (
  auth.uid() = user_id
);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
CREATE POLICY "Users can view their own preferences" ON notification_preferences
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
CREATE POLICY "Users can update their own preferences" ON notification_preferences
FOR UPDATE USING (auth.uid() = user_id);

-- 5. Fix "Permission denied for table users" workaround
-- If there is a public.users table causing conflict, grant access to it.
-- If it doesn't exist, this block will be ignored/fail harmlessly in some SQL clients, 
-- but in Supabase SQL editor it might error if table doesn't exist.
-- So we use a DO block to check existence.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        EXECUTE 'GRANT ALL ON TABLE public.users TO anon, authenticated, service_role';
        EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
        -- Add a basic policy if it exists
        EXECUTE 'DROP POLICY IF EXISTS "Public read users" ON public.users';
        EXECUTE 'CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true)';
    END IF;
END $$;
