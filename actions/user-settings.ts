"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const profileSchema = z.object({
    nombre_completo: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

const passwordSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
})

export async function updateProfile(data: z.infer<typeof profileSchema>) {
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
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: data.password
        })

        if (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) }
        }

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
