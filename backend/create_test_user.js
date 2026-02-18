import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from root
const envPath = resolve(process.cwd(), "../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  const email = "testadmin@bunny.com";
  const password = "password123";

  console.log(`Creating user ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("User created:", data.user.id);
    
    // Also add to employees table so they have a profile
    // Note: The triggers might handle this or we might need to do it manually.
    // Let's assume we need to do it manually if triggers aren't set up for this specific flow.
    // Based on previous issues, let's insert into employees.
    
    console.log("Creating employee profile...");
    const { error: empError } = await supabase.from('employees').upsert({
      user_id: data.user.id,
      email: email,
      first_name: 'Test',
      last_name: 'Admin',
      employee_code: 'TEST001',
      role: 'admin',
      is_active: true
    });
    
    if (empError) {
       console.error("Error creating employee profile:", empError);
    } else {
       console.log("Employee profile created.");
    }
  }
}

createTestUser();
