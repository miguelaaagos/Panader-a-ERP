'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Action to sign out the user.
 * This pattern ensures that the Next.js router cache is fully cleared,
 * preventing stale session data from being displayed after logout.
 */
export async function signOutAction() {
    const supabase = await createClient();

    // Clear Supabase session on the server
    await supabase.auth.signOut();

    // Clear all Next.js server-side cache tags and pages
    revalidatePath('/', 'layout');

    // Forcing a clean redirect to login
    redirect('/login');
}
