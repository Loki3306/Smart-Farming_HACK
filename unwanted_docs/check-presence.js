import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPresence() {
  console.log('Checking user_presence table...\n');
  
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else if (!data || data.length === 0) {
    console.log('❌ No presence data found in database');
    console.log('The "Last seen 7h ago" is likely FAKE - no real tracking data exists\n');
  } else {
    console.log('✅ Found presence data:');
    console.log(JSON.stringify(data, null, 2));
  }
  
  process.exit(0);
}

checkPresence();
