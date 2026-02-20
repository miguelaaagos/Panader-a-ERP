import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Supabase Server Client
 * 
 * Use this in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 * 
 * Never use the browser client (lib/supabase/client.ts) in server code
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method may be called from a Server Component or a Server Action.
            // When called from a Server Component, it's read-only, so this will fail.
            // This is expected and fine - the session will be refreshed by proxy.ts
          }
        },
      },
    }
  )
}
