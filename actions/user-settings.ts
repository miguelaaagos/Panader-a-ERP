"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ProfileData = {
    nombre_completo: string
}

type PasswordData = {
    password: string
    confirmPassword: string
}

export async function updateProfile(data: ProfileData) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { success: false, error: "Usuario no autenticado" }
        }

        const { error: profileError } = await supabase
            .from("usuarios")
            .update({ nombre_completo: data.nombre_completo })
            .eq("id", user.id)

        if (profileError) {
            return { success: false, error: profileError.message }
        }

        revalidatePath("/dashboard/perfil")
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
}

export async function updatePassword(data: PasswordData) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: data.password
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
}
