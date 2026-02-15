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
                receta:recetas(nombre),
                producto:productos(nombre, unidad_medida),
                usuario:usuarios(nombre_completo)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        console.error("Error fetching production orders:", error)
        return { success: false, error: error.message }
    }
}

export async function createProductionOrder(data: ProductionOrderFormData) {
    try {
        const { supabase, user, profile } = await validateRequest('production.manage')
        const validated = productionOrderSchema.parse(data)

        // Obtener producto_id de la receta
        const { data: recetaData, error: recetaError } = await supabase
            .from("recetas")
            .select("producto_id")
            .eq("id", validated.receta_id)
            .single()

        if (recetaError || !recetaData) throw new Error("Receta no encontrada")

        // Generar número de orden simple (ej: OP-20240214-001)
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
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
                usuario_id: user.id
            }])

        if (error) throw error

        revalidatePath("/dashboard/produccion")
        return { success: true }
    } catch (error: any) {
        console.error("Error creating production order:", error)
        return { success: false, error: error.message }
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
    } catch (error: any) {
        console.error("Error cancelling production order:", error)
        return { success: false, error: error.message }
    }
}

export async function completeProductionOrder(id: string) {
    try {
        const { supabase, profile } = await validateRequest('production.manage')

        // 1. Obtener la orden y detalles de la receta
        const { data: order, error: orderError } = await supabase
            .from("ordenes_produccion")
            .select("*, receta:recetas(*, ingredientes:receta_ingredientes(*))")
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (orderError || !order) throw new Error("Orden no encontrada")
        if (order.estado !== "pendiente") throw new Error("La orden ya no está pendiente")

        const recipe = order.receta
        if (!recipe || !recipe.ingredientes || recipe.ingredientes.length === 0) {
            throw new Error("La receta no tiene ingredientes configurados")
        }

        const factor = order.cantidad_a_producir / recipe.rendimiento

        // 2. Validar Stock de ingredientes
        const ingredientIds = recipe.ingredientes.map((i: any) => i.ingrediente_id)
        const { data: products, error: productsError } = await supabase
            .from("productos")
            .select("id, nombre, stock_actual, unidad_medida")
            .in("id", ingredientIds)

        if (productsError) throw productsError

        type ProductType = {
            id: string
            nombre: string
            stock_actual: number
            unidad_medida: string
        }

        const stockMap = new Map((products as ProductType[]).map((p: ProductType) => [p.id, p]))
        const missingIngredients: string[] = []

        for (const ing of recipe.ingredientes) {
            const product = stockMap.get(ing.ingrediente_id)
            const requiredAmount = ing.cantidad * factor
            if (!product || Number(product.stock_actual) < requiredAmount) {
                missingIngredients.push(product?.nombre || "Ingrediente desconocido")
            }
        }

        if (missingIngredients.length > 0) {
            throw new Error(`Stock insuficiente para: ${missingIngredients.join(", ")}`)
        }

        // 3. Ejecutar actualizaciones (Simulando transacción)
        // Restar ingredientes
        for (const ing of recipe.ingredientes) {
            const requiredAmount = ing.cantidad * factor
            const { error: updateIngError } = await supabase.rpc('decrement_stock', {
                product_id: ing.ingrediente_id,
                amount: requiredAmount
            })
            // Si el RPC no existe, usaremos una actualización normal (menos optimizado/seguro pero funcional)
            if (updateIngError) {
                const currentStock = Number(stockMap.get(ing.ingrediente_id)?.stock_actual || 0)
                await supabase
                    .from("productos")
                    .update({ stock_actual: currentStock - requiredAmount })
                    .eq("id", ing.ingrediente_id)
            }
        }

        // Sumar producto terminado
        const { data: finishedProduct } = await supabase
            .from("productos")
            .select("stock_actual")
            .eq("id", order.producto_id)
            .single()

        await supabase
            .from("productos")
            .update({ stock_actual: Number(finishedProduct?.stock_actual || 0) + order.cantidad_a_producir })
            .eq("id", order.producto_id)

        // 4. Finalizar orden
        const { error: finalUpdateError } = await supabase
            .from("ordenes_produccion")
            .update({
                estado: "completada",
                fecha_completada: new Date().toISOString(),
                cantidad_producida: order.cantidad_a_producir,
                costo_ingredientes: recipe.costo_total * factor, // Snapshot de costo
                updated_at: new Date().toISOString()
            })
            .eq("id", id)

        if (finalUpdateError) throw finalUpdateError

        revalidatePath("/dashboard/produccion")
        revalidatePath("/dashboard/inventario")
        return { success: true }

    } catch (error: any) {
        console.error("Error completing production order:", error)
        return { success: false, error: error.message }
    }
}
