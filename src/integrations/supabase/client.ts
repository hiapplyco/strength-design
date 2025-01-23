import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ulnsvkrrdcmfiguibkpx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbnN2a3JyZGNtZmlndWlia3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTk4NzcsImV4cCI6MjA1MjY5NTg3N30.L_ysW1DZXZPXwJT5pn_IepuZwP9zILravQTqv38MccI";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);