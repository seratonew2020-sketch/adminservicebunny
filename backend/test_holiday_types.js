import { supabase } from './src/lib/supabase.js';

async function checkConstraint() {
  console.log('=== TESTING ALL TYPE VALUES ===\n');

  const typesToTest = ['public', 'company', 'vacation', 'emergency', 'substitute', 'personal'];

  for (const type of typesToTest) {
    const testData = {
      title: `Test ${type}`,
      start_date: '2026-12-25',
      end_date: '2026-12-25',
      type: type
    };

    const { data, error } = await supabase
      .from('holidays')
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.log(`❌ ${type.padEnd(15)} - FAILED: ${error.message}`);
    } else {
      console.log(`✅ ${type.padEnd(15)} - SUCCESS (ID: ${data.id.substring(0, 8)}...)`);
      // Clean up
      await supabase.from('holidays').delete().eq('id', data.id);
    }
  }
}

checkConstraint()
  .then(() => {
    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
