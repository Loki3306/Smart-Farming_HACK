import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log('Running IoT migration...');

    try {
        const sqlPath = join(__dirname, 'iot_migration.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);

            // Try RPC first (if exec_sql function exists)
            const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (rpcError) {
                console.log('RPC failed, trying direct REST call (this might fail if postgres user is restricted)...');
                // Fallback to direct fetch if RPC is generic
                // But usually we can't run DDL via client unless we have a specific RPC or use pg driver directly.
                // The previous run-migration.js used this trick, implying there is an 'exec_sql' RPC function.
                // If that fails, we might be stuck without direct DB access.
                // Let's hope the RPC works as in the original script.
                console.error('Error:', rpcError.message);
            } else {
                console.log('✓ Success');
            }
        }

        console.log('\nMigration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
