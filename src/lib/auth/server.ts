import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/db/client';

export async function createServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
      },
    }
  );
}

export interface StudioAuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Server-side authorization check for Studio actions.
 * Enforces valid Supabase session when configured, or handles development/testing mode safely.
 */
export async function verifyStudioAuth(): Promise<StudioAuthResult> {
  // Test override hook for unit testing authorization rejection
  if (process.env.TEST_AUTH_OVERRIDE === 'unauthorized') {
    return {
      authenticated: false,
      error: 'Unauthorized: Studio session rejected by test override',
    };
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerAuthClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return {
          authenticated: false,
          error: error?.message || 'Unauthorized: Valid Studio session required',
        };
      }

      return {
        authenticated: true,
        userId: user.id,
      };
    } catch (e: any) {
      return {
        authenticated: false,
        error: e.message || 'Unauthorized: Session verification failed',
      };
    }
  }

  // Development/mock fallback
  return {
    authenticated: true,
    userId: 'dev-studio-admin',
  };
}
