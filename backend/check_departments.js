import { supabase } from './src/lib/supabase.js';

async function checkDepartmentsSchema() {
  console.log('=== CHECKING DEPARTMENTS TABLE ===\n');

  // ดึงข้อมูล 1 แถวเพื่อดูโครงสร้าง
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nFull error:', error);
  } else {
    console.log('✅ Sample row:');
    console.log(JSON.stringify(data, null, 2));

    if (data && data.length > 0) {
      console.log('\n📋 Available columns:');
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    }
  }

  process.exit(0);
}

checkDepartmentsSchema();
