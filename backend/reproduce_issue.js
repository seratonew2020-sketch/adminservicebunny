import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from "@supabase/supabase-js";

// Load .env from root directory (parent of backend)
const envPath = resolve(process.cwd(), '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials. Exiting.");
  process.exit(1);
}

const testClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function testEmployees() {
  console.log('Testing Employees Query...');
  try {
    const userId = 'f38727de-5557-4c94-8382-5200c032d45a';
    const { data, error } = await testClient
      .from('employees')
      .select('*, departments:dept_id(*), positions:pos_id(*)')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Employees Error:', error);
    } else {
      console.log('Employees Data:', data);
    }
  } catch (err) {
    console.error('Employees Exception:', err);
  }
}

async function testHolidays() {
  console.log('Testing Holidays Query...');
  try {
    const { data, error } = await testClient
      .from('holidays')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Holidays Error:', error);
    } else {
      console.log('Holidays Data:', data);
    }
  } catch (err) {
    console.error('Holidays Exception:', err);
  }
}

async function verifyEmployee() {
  const userId = 'f38727de-5557-4c94-8382-5200c032d45a';
  console.log(`Verifying employee for user ${userId}...`);

  const { data, error } = await testClient
    .from('employees')
    .select('*, departments:dept_id(*), positions:pos_id(*)')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Employees Query Error:', error);
  } else {
    console.log('Employees Query Success:', data.id);
  }
}

async function run() {
  await verifyEmployee();
  process.exit(0);
}

run();
