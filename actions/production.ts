"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const productionOrderSchema = z.object({
    receta_id: z.string().uuid("Receta inválida"),
    cantidad_a_producir: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    notas: z.string().optional(),
})

export type ProductionOrderFormData = z.infer<typeof productionOrderSchema>

export async function getProductionOrders() {
    try {
        const { supabase, profile } = await validateRequest('production.view')

        const { data, error } = await supabase
            .from("ordenes_produccion")
            .select(`
                *,
                receta:recetas(nombre, rendimiento, costo_total),
                producto:productos(nombre, unidad_medida),
                usuario:usuarios(nombre_completo)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: unknown) {
        console.error("Error fetching production orders:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function createProductionOrder(data: ProductionOrderFormData) {
    try {
        const { supabase, user_id, profile } = await validateRequest('production.manage')
        const validated = productionOrderSchema.parse(data)

        // Obtener producto_id de la receta
        const { data: recetaData, error: recetaError } = await supabase
            .from("recetas")
            .select("producto_id")
            .eq("id", validated.receta_id)
            .single()

        if (recetaError || !recetaData) throw new Error("Receta no encontrada")

        // Generar número de orden simple (ej: OP-20240214-001)
        const dateStr = (new Date().toISOString().split('T')[0] ?? '').replace(/-/g, '')
        const { count } = await supabase
            .from("ordenes_produccion")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", new Date().toISOString().split('T')[0])

        const orderNumber = `OP-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`

        const { error } = await supabase
            .from("ordenes_produccion")
            .insert([{
                tenant_id: profile.tenant_id,
                numero_orden: orderNumber,
                receta_id: validated.receta_id,
                producto_id: recetaData.producto_id,
                cantidad_a_producir: validated.cantidad_a_producir,
                estado: "pendiente",
                notas: validated.notas,
                usuario_id: user_id
            }])

        if (error) throw error

        revalidatePath("/dashboard/produccion")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error creating production order:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function cancelProductionOrder(id: string) {
    try {
        const { supabase, profile } = await validateRequest('production.manage')

        const { error } = await supabase
            .from("ordenes_produccion")
            .update({ estado: "cancelada", updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .eq("estado", "pendiente") // Solo se pueden cancelar si están pendientes

        if (error) throw error

        revalidatePath("/dashboard/produccion")
        return { success: true }
    } catch (error: unknown) {
        console.error("Error cancelling production order:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function completeProductionOrder(id: string) {
    try {
        const { supabase, profile } = await validateRequest('production.manage')

        // 1. Llamada atómica al RPC
        const { error: rpcError } = await supabase.rpc('complete_production_v1', {
            p_order_id: id,
            p_tenant_id: profile.tenant_id
        })

        if (rpcError) {
            console.error("RPC Production Error:", rpcError)
            return { success: false, error: rpcError.message }
        }

        revalidatePath("/dashboard/produccion")
        revalidatePath("/dashboard/inventario")
        return { success: true }

    } catch (error: unknown) {
        console.error("Error completing production order:", error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
