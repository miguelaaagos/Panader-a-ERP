"use server"

import { createClient } from "@supabase/supabase-js"
import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"

// The admin client will be initialized inside the action to prevent top-level crashes
// and appropriately await connection() if needed by Next.js in the future.
interface UserData {
    email: string
    password?: string
    nombre_completo: string
}

export async function createUser(data: UserData) {
    try {
        // Validar permisos antes de usar el cliente admin
        await validateRequest('users.manage')

        // Cargar clave secreta desde el nuevo estándar o el legacy
        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!secretKey) {
            throw new Error("Missing Supabase Secret/Service Role Key")
        }

        // Admin client to bypass RLS and create users
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            secretKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

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
                .from("usuarios")
                .select("id")
                .eq("id", authData.user.id)
                .single()

            if (existingProfile) {
                const { error: profileError } = await supabaseAdmin
                    .from("usuarios")
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
                    .from("usuarios")
                    .insert({
                        id: authData.user.id,
                        nombre_completo: data.nombre_completo,
                        rol: rol,
                        activo: true
                    })

                if (profileError) throw profileError
            }
        }

        revalidatePath("/dashboard/usuarios")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error creating user:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

interface UpdateUserData {
    nombre_completo: string
    rol?: string
}

export async function updateUser(id: string, data: UpdateUserData) {
    try {
        const { supabase } = await validateRequest('users.manage')

        const { error } = await supabase
            .from("usuarios")
            .update({
                nombre_completo: data.nombre_completo,
                // We keep role update optional or restricted. For now, we trust the input but could restrict if needed.
                // If UI doesn't send role, this might clear it if not handled carefully? 
                // data.rol might be undefined.
                ...(data.rol ? { rol: data.rol } : {})
            })
            .eq("id", id)

        if (error) throw error
        revalidatePath("/dashboard/usuarios")
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
    try {
        const { supabase, user_id } = await validateRequest('users.manage')

        // Prevent self-deactivation
        if (user_id === id) {
            return { success: false, error: "No puedes desactivar tu propia cuenta" }
        }

        const { error } = await supabase
            .from("usuarios")
            .update({ activo: !currentStatus })
            .eq("id", id)

        if (error) throw error
        revalidatePath("/dashboard/usuarios")
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
