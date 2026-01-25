import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables (Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid (not placeholder values)
const hasValidCredentials =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'your_supabase_url_here' &&
  SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here' &&
  SUPABASE_ANON_KEY !== 'placeholder_anon_key_for_development';

if (!hasValidCredentials) {
  console.warn(
    '⚠️ Supabase credentials not configured. Running in MOCK DATA mode.\n' +
    'To use real database:\n' +
    '1. Get your Supabase credentials from https://supabase.com\n' +
    '2. Update .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create a mock client or real client based on credentials
let supabaseClient: SupabaseClient | null = null;

if (hasValidCredentials) {
  // Create real Supabase client
  supabaseClient = createClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
} else {
  // Create a mock client that won't throw errors
  supabaseClient = null;
  console.log('📦 Using localStorage for data persistence (mock mode)');
}

// Export the client (can be null in mock mode)
export const supabase = supabaseClient;

export default supabase;

