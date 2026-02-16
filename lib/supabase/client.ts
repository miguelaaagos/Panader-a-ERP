import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: any;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  supabaseClient = createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      }
    }
  );

  return supabaseClient;
}
