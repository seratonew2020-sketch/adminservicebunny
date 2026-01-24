-- FIX: Grant permissions to access 'employees' table
-- Run this entire script in your Supabase Dashboard > SQL Editor

GRANT ALL ON TABLE "public"."employees" TO "service_role";
GRANT ALL ON TABLE "public"."employees" TO "postgres";
GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";

-- Also explicitly enable RLS but allow access via these grants or policies
-- (Service role normally bypasses RLS, but if table owner is different it helps)
ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;
