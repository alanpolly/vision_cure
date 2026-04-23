// ============================================
// Supabase Client Initialization
// ============================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// Only create real client if valid credentials exist
const hasValidCreds = supabaseUrl
  && supabaseKey
  && !supabaseUrl.includes('YOUR_')
  && !supabaseKey.includes('YOUR_');

if (hasValidCreds) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[SUPABASE] Client initialized successfully.');
} else {
  console.warn('[SUPABASE] No valid credentials — running in mock/offline mode.');
  console.warn('[SUPABASE] Set SUPABASE_URL and SUPABASE_ANON_KEY in .env to connect.');
}

module.exports = supabase;
