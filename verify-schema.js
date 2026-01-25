import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log('Verifying schema...');

    // Try to insert a dummy record with battery_level to see if it's accepted
    // Or better, just check if we can select it (might return null, but shouldn't error on column name)

    const { data, error } = await supabase
        .from('sensor_readings')
        .select('battery_level')
        .limit(1);

    if (error) {
        console.error('Error selecting battery_level:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('Column MISSING');
        }
    } else {
        console.log('Column EXISTS');
    }
}

verifySchema();
