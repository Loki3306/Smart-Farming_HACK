import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTable() {
  console.log('Verifying farm_settings table structure...\n');
  
  // Try to get the table structure
  const { data, error } = await supabase
    .from('farm_settings')
    .select('*')
    .limit(1);

  console.log('Query result:');
  console.log('- Error:', error);
  console.log('- Data:', data);
  
  if (data && data.length > 0) {
    console.log('\nColumns in farm_settings table:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('\nTable is empty or query failed');
  }
  
  // Try to fetch all records
  const { data: allData, error: allError } = await supabase
    .from('farm_settings')
    .select('farmer_id, push_notifications, theme, language')
    .limit(5);
    
  console.log('\nTest query for new columns:');
  console.log('- Error:', allError);
  console.log('- Data:', allData);
  
  // Check if columns exist by trying to insert
  console.log('\nTrying to check column existence...');
  const { data: schema, error: schemaError } = await supabase
    .rpc('get_table_columns', { table_name: 'farm_settings' })
    .single();
    
  console.log('Schema check:', { schema, schemaError });
}

verifyTable().catch(console.error);
