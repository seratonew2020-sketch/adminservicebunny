import { supabase } from "./src/lib/supabase.js";

async function verify() {
  console.log("Running Extended Verification...");

  // Test 1: Attendance Logs (Should work)
  console.log("Querying 'attendance_logs' (limit 1)...");
  const { data: logs, error: logError } = await supabase
    .from("attendance_logs")
    .select("*")
    .limit(1);
  if (logError) console.log("Logs Error:", logError);
  else console.log("Logs Success! Found:", logs?.length);

  // Test 2: Employees (The problem table)
  console.log("Querying 'employees' (limit 1)...");
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*")
    .limit(1);
  if (empError) {
    console.log("Employees Error:", JSON.stringify(empError));
  } else {
    console.log("Employees Success! Found:", employees?.length);
  }
  process.exit(0);
}

verify();
