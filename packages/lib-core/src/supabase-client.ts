import { createClient } from '@supabase/supabase-js';
import type { Database } from '@giulio-leone/types';

import { logger } from '@giulio-leone/lib-shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  logger.warn('Supabase credentials missing! Realtime features will be disabled.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false, // We use NextAuth for authentication, Supabase is only for Realtime
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
