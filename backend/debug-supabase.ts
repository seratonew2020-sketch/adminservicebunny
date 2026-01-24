import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Calculate correct paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading from ../.env (relative from src/scripts or similar? No, this is in backend root effectively if run from there)
// We will look for .env in the current directory (backend)
const envPath = resolve(process.cwd(), ".env");
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

console.log("URL:", url);
console.log("Service Key config exists:", !!serviceKey);
console.log("Key start:", serviceKey ? serviceKey.substring(0, 10) : "N/A");

if (!url || !serviceKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function test() {
  console.log("Testing connection to 'employees'...");
  const { data, error } = await supabase
    .from("employees")
    .select("count", { count: "exact", head: true });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Count:", data); // valid response usually null for head, or count in count property
  }
}

test();
