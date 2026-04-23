// ============================================
// Supabase Client for Frontend Auth
// Uses the same Supabase project as the backend
// ============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvbzawnqgpqcpweutgkx.supabase.co';
const supabaseAnonKey = 'sb_publishable_t95j7aLvQejdxOPBoOG7Tg_eGqxTPfC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
