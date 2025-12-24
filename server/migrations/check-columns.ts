import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function checkColumns() {
  console.log('📋 Checking columns in farms table...\n');
  
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('✅ Columns in farms table:');
    console.log('─'.repeat(50));
    columns.forEach((col, i) => {
      console.log(`  ${i + 1}. ${col}`);
    });
    console.log('─'.repeat(50));
    console.log(`\nTotal: ${columns.length} columns\n`);
    
    // Check for missing columns
    const requiredColumns = ['crop_type', 'season', 'water_source', 'irrigation_type'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️  MISSING COLUMNS:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('\nRun this SQL in Supabase Dashboard to add them:');
      console.log('─'.repeat(50));
      missingColumns.forEach(col => {
        console.log(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS ${col} VARCHAR(100);`);
      });
      console.log('─'.repeat(50));
    } else {
      console.log('✅ All required columns exist!');
    }
  } else {
    console.log('⚠️  No data in farms table yet');
  }
}

checkColumns();
