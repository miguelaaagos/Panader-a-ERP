"use server"

import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Admin client to bypass RLS and create users
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function createUser(data: any) {
    try {
        // Enforce 'cajero' role for new users created via this action
        const rol = "cajero"

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true
        })

        if (authError) throw authError

        // 2. Insert Profile
        if (authData.user) {
            // Check if profile exists (created by trigger)
            const { data: existingProfile } = await supabaseAdmin
                .from("perfiles")
                .select("id")
                .eq("id", authData.user.id)
                .single()

            if (existingProfile) {
                const { error: profileError } = await supabaseAdmin
                    .from("perfiles")
                    .update({
                        nombre_completo: data.nombre_completo,
                        rol: rol,
                        activo: true
                    })
                    .eq("id", authData.user.id)

                if (profileError) throw profileError
            } else {
                // If no trigger, create manually
                const { error: profileError } = await supabaseAdmin
                    .from("perfiles")
                    .insert({
                        id: authData.user.id,
                        nombre_completo: data.nombre_completo,
                        rol: rol,
                        activo: true
                    })

                if (profileError) throw profileError
            }
        }

        revalidatePath("/protected/usuarios")
        return { success: true }
    } catch (error: any) {
        console.error("Error creating user:", error)
        return { success: false, error: error.message }
    }
}

export async function updateUser(id: string, data: any) {
    const supabase = await createServerClient()

    try {
        const { error } = await supabase
            .from("perfiles")
            .update({
                nombre_completo: data.nombre_completo,
                // We keep role update optional or restricted. For now, we trust the input but could restrict if needed.
                // If UI doesn't send role, this might clear it if not handled carefully? 
                // data.rol might be undefined.
                ...(data.rol ? { rol: data.rol } : {})
            })
            .eq("id", id)

        if (error) throw error
        revalidatePath("/protected/usuarios")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
    const supabase = await createServerClient()

    try {
        // Prevent self-deactivation
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.id === id) {
            return { success: false, error: "No puedes desactivar tu propia cuenta" }
        }

        const { error } = await supabase
            .from("perfiles")
            .update({ activo: !currentStatus })
            .eq("id", id)

        if (error) throw error
        revalidatePath("/protected/usuarios")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
