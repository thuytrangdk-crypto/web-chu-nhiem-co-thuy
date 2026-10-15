import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sohuavueougdlsqerwuk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2BcotajR597WKnTP9G0wrg_N8oBj1PM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseSyncStatus {
  connected: boolean;
  url: string;
  tableName: string;
  lastSyncedAt?: string;
  error?: string;
}
