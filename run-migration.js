// Quick script to run SQL migration on Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running message_type column migration...');
  
  const sql = readFileSync('./DB_Scripts/ADD_MESSAGE_TYPE_COLUMN.sql', 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error('Error:', error.message);
        // Try direct execution
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!result.ok) {
          console.error(`Failed: ${await result.text()}`);
        }
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('Exception:', err.message);
    }
  }
  
  console.log('\nMigration complete!');
}

runMigration().catch(console.error);
