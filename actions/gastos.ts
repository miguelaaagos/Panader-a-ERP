"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { GastoSchema } from "@/schemas/gastos"

/**
 * Obtiene todas las categorías de gastos
 */
export async function getCategoriasGastos() {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("categorias_gastos")
            .select("id, nombre, descripcion")
            .eq("tenant_id", profile.tenant_id)
            .order("nombre", { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message || String(error) }
    }
}

/**
 * Registra un nuevo gasto manual
 */
export async function registrarGasto(data: z.infer<typeof GastoSchema>) {
    try {
        const { supabase, profile } = await validateRequest()
        const validated = GastoSchema.parse(data)

        const { data: result, error } = await supabase
            .from("gastos")
            .insert({
                tenant_id: profile.tenant_id,
                usuario_id: profile.id,
                descripcion: validated.descripcion,
                categoria_id: validated.categoria_id || null,
                monto_neto: validated.monto_neto,
                monto_iva: validated.monto_iva,
                monto_total: validated.monto_total,
                tipo_documento: validated.tipo_documento,
                fecha_gasto: validated.fecha_gasto
            })
            .select("id")
            .single()

        if (error) throw error

        revalidatePath("/dashboard/gastos")
        return { success: true, data: result }
    } catch (error: any) {
        let msg = error.message || String(error)
        if (error instanceof z.ZodError) {
            msg = (error as any).errors.map((e: any) => e.message).join(", ")
        }
        return { success: false, error: msg }
    }
}

/**
 * Obtiene el historial de gastos con filtrado básico
 */
export async function getGastos() {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("gastos")
            .select(`
                id,
                descripcion,
                fecha_gasto,
                monto_neto,
                monto_iva,
                monto_total,
                tipo_documento,
                created_at,
                categoria:categoria_id(nombre),
                usuario:usuario_id(nombre_completo)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("fecha_gasto", { ascending: false })
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message || String(error) }
    }
}

/**
 * Elimina un gasto manual
 */
export async function eliminarGasto(id: string) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        // Verifica que el gasto exista y pertenezca al tenant
        const { data: gasto, error: checkError } = await supabase
            .from("gastos")
            .select("id, ingreso_inventario_id")
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (checkError || !gasto) throw new Error("Gasto no encontrado")

        // No permitir eliminar gastos que vengan de un ingreso de inventario directo
        if (gasto.ingreso_inventario_id) {
            throw new Error("No se puede eliminar un gasto automático generado por un ingreso de inventario. Debes anular el ingreso.")
        }

        const { error } = await supabase
            .from("gastos")
            .delete()
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)

        if (error) throw error

        revalidatePath("/dashboard/gastos")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || String(error) }
    }
}
