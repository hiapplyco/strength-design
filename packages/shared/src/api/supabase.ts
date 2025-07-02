import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey);
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;