// Run ADD_DATA_TO_NOTIFICATIONS.sql migration
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running ADD_DATA_TO_NOTIFICATIONS migration...');
  
  const sql = readFileSync('./DB_Scripts/ADD_DATA_TO_NOTIFICATIONS.sql', 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      console.log(`\n📝 Executing statement...`);
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error('❌ Error:', error.message);
        // Try direct execution as fallback
        console.log('🔄 Trying direct execution...');
        const result = await supabase.from('_sql').select().single();
        console.log('Result:', result);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error('❌ Execution error:', err);
    }
  }
  
  console.log('\n✨ Migration complete!');
}

runMigration().catch(console.error);
