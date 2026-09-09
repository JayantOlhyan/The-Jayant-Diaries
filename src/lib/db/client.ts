import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock.supabase.co') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project.supabase.co') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('mock-anon-key') &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key')
);

/**
 * Public singleton Supabase client for client-side or general queries.
 */
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Server-only admin client with Service Role privileges.
 * Bypasses RLS. NEVER import in Client Components!
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin database operations');
  }
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
