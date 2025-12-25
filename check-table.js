import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function addColumns() {
  console.log('Adding columns to farm_settings table...\n');
  
  const columns = [
    { name: 'push_notifications', type: 'boolean', default: 'true' },
    { name: 'email_notifications', type: 'boolean', default: 'false' },
    { name: 'sms_alerts', type: 'boolean', default: 'true' },
    { name: 'notification_sound', type: 'boolean', default: 'true' },
    { name: 'vibration', type: 'boolean', default: 'true' },
    { name: 'moisture_alerts', type: 'boolean', default: 'true' },
    { name: 'weather_alerts', type: 'boolean', default: 'true' },
    { name: 'pest_alerts', type: 'boolean', default: 'true' },
    { name: 'harvest_alerts', type: 'boolean', default: 'true' },
    { name: 'language', type: 'varchar(10)', default: "'en'" },
    { name: 'theme', type: 'varchar(10)', default: "'light'" },
  ];

  // First, let's check if the columns already exist
  const { data: existing, error: checkError } = await supabase
    .from('farm_settings')
    .select('*')
    .limit(1);

  if (checkError) {
    console.error('Error checking table:', checkError);
    return;
  }

  console.log('Current columns:', Object.keys(existing?.[0] || {}));
  
  console.log('\n✓ Successfully checked farm_settings table');
  console.log('\nIMPORTANT: You need to manually add these columns in Supabase SQL Editor:');
  console.log('\nALTER TABLE farm_settings');
  for (const col of columns) {
    console.log(`  ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default},`);
  }
  console.log('  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
}

addColumns().catch(console.error);
