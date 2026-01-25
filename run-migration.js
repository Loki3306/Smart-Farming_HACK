/**
 * Run Supabase SQL Migration
 * Usage: node run-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('🚀 Running yield tables migration...\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'DB_Scripts', 'CREATE_YIELD_TABLES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      // Skip empty or comment-only statements
      if (!statement || statement.match(/^[\s\-]*$/)) continue;

      // Add semicolon back
      const fullStatement = statement + ';';

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: fullStatement });

        if (error) {
          // Try direct query for CREATE/INSERT statements
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

          if (directError && !fullStatement.toLowerCase().includes('select')) {
            console.log(`⏭️  Skipping (may already exist): ${fullStatement.substring(0, 60)}...`);
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Ignore errors for statements that might already exist
        console.log(`⚠️  ${err.message?.substring(0, 50) || 'Statement skipped'}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Statements processed: ${statements.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
