"use server"

import { createClient } from "@/lib/supabase/server"
import { validateRequest } from "@/lib/server/auth"
import { redirect } from "next/navigation"

export async function loginAction(
    email: string,
    password: string
): Promise<{ error: string } | void> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    redirect("/dashboard")
}

export async function logoutAction(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
}

export async function registerAction(
    email: string,
    password: string
): Promise<{ error: string } | void> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    redirect("/dashboard")
}

export async function getCurrentUser() {
    try {
        const { profile, user_id } = await validateRequest()
        return { profile, user_id }
    } catch {
        return null
    }
}
