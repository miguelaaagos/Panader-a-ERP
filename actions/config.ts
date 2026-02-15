"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const configSchema = z.object({
    nombre_negocio: z.string().min(1, "El nombre del negocio es requerido"),
    razon_social: z.string().optional().nullable(),
    rut: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    umbral_stock_bajo: z.number().min(0, "El umbral debe ser mayor o igual a 0").default(10),
    simbolo_moneda: z.string().default("$"),
})

export type ConfigData = z.infer<typeof configSchema>

export async function getBusinessConfig() {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("configuracion")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (error && error.code !== "PGRST116") throw error

        return { success: true, data: data || null }
    } catch (error: unknown) {
        console.error("Error fetching config:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function updateBusinessConfig(data: ConfigData) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit') // Using inventory.edit as a proxy for admin settings for now

        const validatedData = configSchema.parse(data)

        const { data: existingConfig } = await supabase
            .from("configuracion")
            .select("id")
            .eq("tenant_id", profile.tenant_id)
            .single()

        let error
        if (existingConfig) {
            const { error: updateError } = await supabase
                .from("configuracion")
                .update({
                    ...validatedData,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingConfig.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from("configuracion")
                .insert([{
                    ...validatedData,
                    tenant_id: profile.tenant_id
                }])
            error = insertError
        }

        if (error) throw error

        revalidatePath("/dashboard/configuracion")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating config:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
