import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'MASUKKAN_ANON_KEY_ANDA_DI_SINI';

if (!isConfigured) {
  console.error('\n[Supabase] WARNING: SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi dengan benar.');
  console.error('[Supabase] Fitur upload dokumen tidak akan berfungsi.');
  console.error('[Supabase] Silakan atur environment variables di Vercel Dashboard.\n');
}

// Initialize with placeholder if not configured to avoid crashing the whole app
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
