import { supabase } from './src/lib/supabase.js';

async function linkUserToEmployee() {
  console.log('=== LINKING USER TO EMPLOYEE ===\n');

  const userId = '3a90f59c-dcbe-4a2b-9510-7b7411c010ab';
  const employeeId = '20034';

  console.log(`Linking user_id: ${userId}`);
  console.log(`To employee_id: ${employeeId}\n`);

  // Update the employee record
  const { data, error } = await supabase
    .from('employees')
    .update({ user_id: userId })
    .eq('employee_id', employeeId)
    .select();

  if (error) {
    console.error('❌ Error updating employee:', error);
    return;
  }

  console.log('✅ Successfully linked user to employee!');
  console.log('\nUpdated Employee Record:');
  console.log(JSON.stringify(data[0], null, 2));

  // Verify the linkage
  console.log('\n\n=== VERIFICATION ===\n');
  const { data: verifyData, error: verifyError } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log('✅ Verified! Employee can now be fetched by user_id');
    console.log(`   Full Name: ${verifyData.full_name}`);
    console.log(`   Email: ${verifyData.email}`);
    console.log(`   Position: ${verifyData.position}`);
  }
}

linkUserToEmployee()
  .then(() => {
    console.log('\n=== LINK COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
