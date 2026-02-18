import { supabase } from './src/lib/supabase.js';

async function checkAuthUser() {
  console.log('=== CHECKING AUTH USER ===\n');

  const targetUserId = '3a90f59c-dcbe-4a2b-9510-7b7411c010ab';

  // Check if the user exists in auth.users
  console.log(`Looking for user_id: ${targetUserId}\n`);

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  console.log(`Total auth users: ${data.users.length}\n`);

  const matchingUser = data.users.find(u => u.id === targetUserId);

  if (matchingUser) {
    console.log('✅ USER FOUND in auth.users:');
    console.log(JSON.stringify(matchingUser, null, 2));
  } else {
    console.log('❌ USER NOT FOUND in auth.users');
    console.log('\nFirst 5 auth users:');
    data.users.slice(0, 5).forEach((u, i) => {
      console.log(`${i + 1}. ID: ${u.id}, Email: ${u.email}`);
    });
  }

  // Also check if there's any employee linked to any auth user
  console.log('\n\nChecking employees with user_id:');
  const { data: linkedEmployees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, user_id')
    .not('user_id', 'is', null)
    .limit(10);

  if (empError) {
    console.error('Error:', empError);
  } else {
    if (linkedEmployees.length > 0) {
      console.log(`Found ${linkedEmployees.length} employees with user_id:`);
      linkedEmployees.forEach(emp => {
        console.log(`  - ${emp.full_name} (${emp.employee_id}): user_id = ${emp.user_id}`);
      });
    } else {
      console.log('❌ No employees are linked to auth users (all user_id are NULL)');
    }
  }
}

checkAuthUser()
  .then(() => {
    console.log('\n=== CHECK COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
