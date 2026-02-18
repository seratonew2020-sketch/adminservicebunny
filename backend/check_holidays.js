import { supabase } from './src/lib/supabase.js';

async function checkHolidaysSchema() {
  console.log('=== CHECKING HOLIDAYS TABLE ===\n');

  // Get a sample holiday to see the schema
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    console.log('\nError Code:', error.code);
    console.log('Error Details:', error.details);
    console.log('Error Hint:', error.hint);
  } else {
    console.log('Sample Holiday:');
    console.log(JSON.stringify(data, null, 2));
    if (data && data.length > 0) {
      console.log('\nAvailable columns:', Object.keys(data[0]));
    }
  }

  // Try creating a holiday with Thai type
  console.log('\n\n=== TESTING CREATE WITH THAI TYPE ===');
  const testData = {
    title: 'Test Holiday Thai',
    start_date: '2026-03-15',
    end_date: '2026-03-15',
    type: 'วันหยุดปกติ'
  };

  console.log('Data to insert:', JSON.stringify(testData, null, 2));

  const { data: createData, error: createError } = await supabase
    .from('holidays')
    .insert([testData])
    .select()
    .single();

  if (createError) {
    console.error('\n❌ Create Error:', createError.message);
    console.log('Error Code:', createError.code);
    console.log('Error Details:', createError.details);
    console.log('Error Hint:', createError.hint);
  } else {
    console.log('\n✅ Created successfully:');
    console.log(JSON.stringify(createData, null, 2));
  }
}

checkHolidaysSchema()
  .then(() => {
    console.log('\n=== CHECK COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
