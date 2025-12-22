import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Load environment variables from .env in project root FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// NOW create Supabase client with loaded env vars
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'Found' : 'Missing');
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Seed Script - Create demo farmers with different sensor scenarios
 * Perfect for showing judges how AI adapts to different conditions
 * 
 * Usage: npx tsx server/seed-data.ts
 */

// Hash password using SHA-256 (must match frontend's CryptoJS.SHA256)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const demoFarmers = [
  {
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    email: 'rajesh@demo.com',
    password: 'demo123',
    experience: 'intermediate',
    farm: {
      farm_name: 'Green Valley Farm',
      state: 'Maharashtra',
      city: 'Pune',
      district: 'Pune',
      village: 'Kharadi',
      area_acres: 5.5,
      soil_type: 'Clay Loam',
    },
    sensors: {
      soil_moisture: 25,    // CRITICAL - Very low
      temperature: 32,
      nitrogen: 30,         // CRITICAL - Very low
      phosphorus: 15,       // Low
      potassium: 110,       // Low
      ph: 8.5,             // CRITICAL - Too alkaline
    },
    scenario: '🔴 Critical Issues - Needs urgent attention'
  },
  {
    name: 'Priya Sharma',
    phone: '+919876543211',
    email: 'priya@demo.com',
    password: 'demo123',
    experience: 'beginner',
    farm: {
      farm_name: 'Sunshine Orchards',
      state: 'Karnataka',
      city: 'Bangalore',
      district: 'Bangalore Rural',
      village: 'Devanahalli',
      area_acres: 3.2,
      soil_type: 'Red Soil',
    },
    sensors: {
      soil_moisture: 55,    // Good
      temperature: 28,
      nitrogen: 45,         // Slightly low
      phosphorus: 18,       // Low
      potassium: 140,       // Slightly low
      ph: 7.2,             // Good
    },
    scenario: '🟡 Moderate Care - Minor adjustments needed'
  },
  {
    name: 'Arjun Patel',
    phone: '+919876543212',
    email: 'arjun@demo.com',
    password: 'demo123',
    experience: 'expert',
    farm: {
      farm_name: 'Evergreen Estate',
      state: 'Gujarat',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      village: 'Sanand',
      area_acres: 10.0,
      soil_type: 'Black Cotton Soil',
    },
    sensors: {
      soil_moisture: 65,    // Perfect
      temperature: 26,
      nitrogen: 155,        // Excellent
      phosphorus: 40,       // Excellent
      potassium: 185,       // Excellent
      ph: 6.8,             // Perfect
    },
    scenario: '🟢 Optimal Conditions - Just monitoring needed'
  },
  {
    name: 'Lakshmi Reddy',
    phone: '+919876543213',
    email: 'lakshmi@demo.com',
    password: 'demo123',
    experience: 'intermediate',
    farm: {
      farm_name: 'Sunset Fields',
      state: 'Telangana',
      city: 'Hyderabad',
      district: 'Rangareddy',
      village: 'Shamshabad',
      area_acres: 7.8,
      soil_type: 'Laterite Soil',
    },
    sensors: {
      soil_moisture: 30,    // Low - Heat stress
      temperature: 38,      // CRITICAL - Very hot
      nitrogen: 50,         // Okay
      phosphorus: 25,       // Okay
      potassium: 160,       // Okay
      ph: 7.0,             // Good
    },
    scenario: '🔴 Heat Stress - Emergency cooling needed'
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed for demo farmers...\n');
  
  try {
    for (const farmer of demoFarmers) {
      console.log(`\n📝 Creating: ${farmer.name} (${farmer.phone})`);
      console.log(`   Scenario: ${farmer.scenario}`);
      
      // 1. Check if farmer exists
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('phone', farmer.phone)
        .maybeSingle();
      
      let farmerId: string;
      
      if (existingFarmer) {
        console.log('   ⚠️  Farmer already exists, updating password...');
        farmerId = existingFarmer.id;
        
        // Update the password to use proper hash
        const { error: updateError } = await supabase
          .from('farmers')
          .update({ password: hashPassword(farmer.password) })
          .eq('id', farmerId);
        
        if (updateError) {
          console.log('   ❌ Failed to update password:', updateError.message);
        } else {
          console.log('   ✅ Password updated with proper hash');
        }
      } else {
        // 2. Create farmer account
        const { data: newFarmer, error: farmerError } = await supabase
          .from('farmers')
          .insert({
            name: farmer.name,
            phone: farmer.phone,
            email: farmer.email,
            password: hashPassword(farmer.password),
            experience: farmer.experience,
          })
          .select()
          .single();
        
        if (farmerError) throw farmerError;
        farmerId = newFarmer.id;
        console.log('   ✅ Farmer created');
      }
      
      // 3. Create or reuse farm (avoid duplicates across seed runs)
      const { data: existingFarm, error: existingFarmError } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', farmerId)
        .eq('farm_name', farmer.farm.farm_name)
        .limit(1)
        .maybeSingle();

      if (existingFarmError) throw existingFarmError;

      let farmId: string;
      if (existingFarm) {
        farmId = existingFarm.id;
        console.log('   ✅ Farm exists:', existingFarm.farm_name);
      } else {
        const { data: newFarm, error: farmError } = await supabase
          .from('farms')
          .insert({
            farmer_id: farmerId,
            ...farmer.farm,
          })
          .select()
          .single();

        if (farmError) throw farmError;
        farmId = newFarm.id;
        console.log('   ✅ Farm created:', newFarm.farm_name);
      }
      
      // 4. Create sensor reading data
      const { error: sensorError } = await supabase
        .from('sensor_readings')
        .insert({
          farmer_id: farmerId,
          farm_id: farmId,
          ...farmer.sensors,
          timestamp: new Date().toISOString(),
        });
      
      if (sensorError) throw sensorError;
      console.log('   ✅ Sensor data inserted');
      console.log(`   📊 Moisture: ${farmer.sensors.soil_moisture}%, N: ${farmer.sensors.nitrogen}, pH: ${farmer.sensors.ph}`);
    }
    
    console.log('\n\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('   Phone: +919876543210, Password: demo123 (Critical Issues)');
    console.log('   Phone: +919876543211, Password: demo123 (Moderate Care)');
    console.log('   Phone: +919876543212, Password: demo123 (Optimal Conditions)');
    console.log('   Phone: +919876543213, Password: demo123 (Heat Stress)');
    console.log('\n💡 Each farmer will see different AI recommendations based on their sensor data!');
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
