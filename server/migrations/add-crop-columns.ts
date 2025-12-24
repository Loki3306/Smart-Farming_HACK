import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('🔄 Running migration: Add crop_type and related columns to farms table...\n');

  try {
    // Try to add the columns using raw SQL via RPC
    // Since Supabase JS client doesn't support ALTER TABLE directly,
    // we'll test if the column exists by trying to select it
    
    const { data: testData, error: testError } = await supabase
      .from('farms')
      .select('crop_type')
      .limit(1);

    if (testError && testError.message.includes('crop_type')) {
      console.log('📋 Column crop_type does not exist. Please run the following SQL in Supabase Dashboard:\n');
      console.log('='.repeat(70));
      console.log(`
-- Add missing columns to farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS season VARCHAR(50);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS water_source VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(100);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farms';
`);
      console.log('='.repeat(70));
      console.log('\n⚠️  Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
      console.log('    Paste the above SQL and click "Run"\n');
    } else if (testError) {
      console.error('❌ Database error:', testError.message);
    } else {
      console.log('✅ Column crop_type already exists!');
      
      // Test all columns
      const { error: fullTestError } = await supabase
        .from('farms')
        .select('crop_type, season, water_source, irrigation_type')
        .limit(1);

      if (fullTestError) {
        console.log('\n⚠️  Some columns may be missing. Please run the SQL above to ensure all columns exist.');
      } else {
        console.log('✅ All required columns exist (crop_type, season, water_source, irrigation_type)');
        console.log('\n🎉 Your database is ready! You can now save crop information.');
      }
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration();
