import { supabase } from './src/lib/supabase.js';

async function debugEmployee() {
  console.log('=== DEBUG EMPLOYEE TABLE ===\n');

  // 1. Get all employees (limited)
  console.log('1. Fetching all employees (limit 5):');
  const { data: allEmployees, error: allError } = await supabase
    .from('employees')
    .select('*')
    .limit(5);

  if (allError) {
    console.error('Error fetching all employees:', allError);
  } else {
    console.log('Employees:', JSON.stringify(allEmployees, null, 2));
    if (allEmployees && allEmployees.length > 0) {
      console.log('\nAvailable columns:', Object.keys(allEmployees[0]));
    }
  }

  // 2. Search for specific user_id
  const targetUserId = '3a90f59c-dcbe-4a2b-9510-7b7411c010ab';
  console.log(`\n2. Searching for user_id: ${targetUserId}`);
  const { data: specificEmployee, error: specificError } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', targetUserId);

  if (specificError) {
    console.error('Error:', specificError);
  } else {
    console.log('Result:', JSON.stringify(specificEmployee, null, 2));
  }

  // 3. Count total employees
  console.log('\n3. Total employee count:');
  const { count, error: countError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error:', countError);
  } else {
    console.log('Total employees:', count);
  }

  // 4. Get all user_ids
  console.log('\n4. All user_ids in employees table:');
  const { data: userIds, error: uidError } = await supabase
    .from('employees')
    .select('id, user_id, first_name, last_name')
    .limit(20);

  if (uidError) {
    console.error('Error:', uidError);
  } else {
    console.log('User IDs:');
    userIds.forEach(emp => {
      console.log(`  - ID: ${emp.id}, User ID: ${emp.user_id}, Name: ${emp.first_name} ${emp.last_name}`);
    });
  }
}

debugEmployee()
  .then(() => {
    console.log('\n=== DEBUG COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
