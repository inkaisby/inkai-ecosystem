import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'MASUKKAN_ANON_KEY_ANDA_DI_SINI') {
  console.error('\n[Supabase] ERROR: SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi di .env');
  console.error('[Supabase] Silakan ambil ANON KEY dari Dashboard Supabase -> Settings -> API\n');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
