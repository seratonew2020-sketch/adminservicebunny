import { supabase } from './lib/supabaseClient.js';

async function checkConnection() {
  console.log('🔍 Checking Supabase connection...');
  try {
    // 1. Check 'users' table
    const { count, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('❌ Users table check failed:', userError.message);
    } else {
      console.log('✅ Users table connection successful!');
      console.log(`📊 Total users in system: ${count}`);
    }

    // 2. Check 'employees' table
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('first_name, last_name')
      .limit(1);

    if (empError) {
      console.error('❌ Employees table check failed:', empError.message);
    } else {
      console.log('✅ Employees table connection successful!');
      if (employees && employees.length > 0) {
        console.log(`👤 Sample Employee: ${employees[0].first_name} ${employees[0].last_name}`);
      } else {
        console.log('ℹ️ No employees found in the table.');
      }
    }

    // 3. Final status
    if (!userError && !empError) {
      console.log('\n🚀 Database is fully responsive!');
    } else {
      console.warn('\n⚠️ Database connection is partially working, but some tables might be missing or inaccessible.');
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
    process.exit(1);
  }
}

checkConnection();
