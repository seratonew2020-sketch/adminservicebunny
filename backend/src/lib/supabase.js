import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// FORCE Load .env from backend root to ensure Service Role Key is used
let envPath = resolve(process.cwd(), ".env");
if (!existsSync(envPath)) {
  // Try parent directory
  envPath = resolve(process.cwd(), "../.env");
}

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

let client;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase configuration missing! URL or Key is empty.");
  // Create a dummy client to prevent crash at import time
  client = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
      upsert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
    }),
    rpc: () => Promise.resolve({ data: null, error: { message: "Supabase not configured (Missing Env Vars)" } }),
    auth: {
      admin: {
        createUser: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        deleteUser: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        listUsers: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }
    }
  };
} else {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = client;
