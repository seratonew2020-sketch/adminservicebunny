import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// FORCE Load .env from backend root to ensure Service Role Key is used
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envConfig = dotenv.parse(readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.SUPABASE_URL || "";
// Prioritize Service Role Key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

console.log("----- Supabase Config -----");
console.log("URL:", supabaseUrl);
try {
  if (supabaseKey) {
    const payload = supabaseKey.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    console.log("Key Role:", decoded.role); // Should be 'service_role'
  } else {
    console.log("Key Role: None (Key missing)");
  }
} catch (e) {
  console.log("Key Role: Unknown (Decode failed)");
}
console.log("---------------------------");

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
