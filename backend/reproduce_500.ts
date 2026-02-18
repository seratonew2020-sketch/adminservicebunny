import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from backend directory
const envPath = resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const url = process.env.SUPABASE_URL;
// Use ANON key to trigger RLS
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function test() {
  console.log("Attempting to fetch employees with ANON key (should trigger RLS)...");
  
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Caught Error:", error);
      console.log("Status:", error.code); 
      // 500 usually comes as a network error or specific code from Supabase
    } else {
      console.log("Success:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
