"use server"

import { validateRequest } from "@/lib/server/auth"
import { hasPermission } from "@/lib/roles"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const saleItemSchema = z.object({
    producto_id: z.string().uuid(),
    cantidad: z.number().min(0.01),
    precio_unitario: z.number().min(0),
    descuento: z.number().optional().default(0),
})

const saleSchema = z.object({
    cliente_nombre: z.string().optional(),
    cliente_rut: z.string().optional(),
    metodo_pago: z.enum(["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia"]),
    notas: z.string().optional(),
    items: z.array(saleItemSchema).min(1, "Debe agregar al menos un producto"),
    descuento_global: z.number().optional().default(0),
    arqueo_id: z.string().uuid().optional().nullable(),
})

export type SaleFormData = z.infer<typeof saleSchema>

// Replace legacy checkAuth with validateRequest inside functions.

export async function getProductsForPOS() {
    try {
        const { supabase, profile } = await validateRequest('sales.create') // Permite ver productos al que pueda crear ventas
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .in("tipo", ["producto_terminado", "ambos"])
            .order("nombre", { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createSale(data: SaleFormData) {
    try {
        const { supabase, user, profile } = await validateRequest('sales.create')
        const tenant_id = profile.tenant_id

        // 0. Validar Schema con Zod
        const validationResult = saleSchema.safeParse(data)
        if (!validationResult.success) {
            const errorMsg = validationResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(", ")
            return { success: false, error: "Datos inválidos: " + errorMsg }
        }
        const validated = validationResult.data

        // 1. Llamada atómica al RPC
        // Esto maneja: Validar stock, Decrementar stock, Insertar Venta e Insertar Detalles en UNA sola transacción.
        const { data: saleId, error: rpcError } = await supabase.rpc('create_sale_v1', {
            p_tenant_id: tenant_id,
            p_usuario_id: user.id,
            p_cliente_nombre: validated.cliente_nombre || null,
            p_cliente_rut: validated.cliente_rut || null,
            p_metodo_pago: validated.metodo_pago,
            p_notas: validated.notas || null,
            p_descuento_global: validated.descuento_global || 0,
            p_arqueo_id: validated.arqueo_id || null,
            p_items: validated.items.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                descuento: item.descuento || 0
            }))
        })

        if (rpcError) {
            console.error("RPC Sale Error:", rpcError)
            return { success: false, error: rpcError.message }
        }

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/inventario")
        revalidatePath("/dashboard/ventas")

        return { success: true, saleId }

    } catch (error: any) {
        console.error("Critical Error in createSale:", error)
        return { success: false, error: error.message || "Error desconocido en el servidor" }
    }
}

export async function getRecentSales(limit = 10) {
    try {
        const { supabase, profile } = await validateRequest()

        // 1. Check if view_all (Admin)
        if (hasPermission(profile.rol, 'sales.view_all')) {
            const { data, error } = await supabase
                .from("ventas")
                .select("*, usuario:usuarios(nombre_completo)")
                .eq("tenant_id", profile.tenant_id)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (error) throw error
            return { success: true, data }
        }

        // 2. Check if view_own (Cajero)
        if (hasPermission(profile.rol, 'sales.view_own')) {
            const { data, error } = await supabase
                .from("ventas")
                .select("*, usuario:usuarios(nombre_completo)")
                .eq("tenant_id", profile.tenant_id)
                .eq("usuario_id", profile.id)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (error) throw error
            return { success: true, data }
        }

        throw new Error("No tienes permisos para ver ventas")
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function anularVenta(id: string) {
    try {
        // Solo admin puede anular
        const { supabase, profile } = await validateRequest('sales.annul')

        // 1. Obtener la venta y sus detalles
        const { data: sale, error: saleError } = await supabase
            .from("ventas")
            .select("*, detalles:venta_detalles(*)")
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (saleError || !sale) throw new Error("Venta no encontrada")
        if (sale.estado === "anulada") throw new Error("La venta ya está anulada")

        // 2. Marcar como anulada
        const { error: updateError } = await supabase
            .from("ventas")
            .update({ estado: "anulada", updated_at: new Date().toISOString() })
            .eq("id", id)

        if (updateError) throw updateError

        // 3. Restaurar Stock
        for (const detail of sale.detalles) {
            const { error: stockError } = await supabase.rpc('increment_stock', {
                product_id: detail.producto_id,
                amount: detail.cantidad
            })

            if (stockError) {
                console.error(`Error restoring stock for ${detail.producto_id}:`, stockError)
                throw new Error(`Error al restaurar stock: ${stockError.message}`)
            }
        }

        revalidatePath("/dashboard/ventas")
        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/inventario")

        return { success: true }
    } catch (error: any) {
        console.error("Error anularVenta:", error)
        return { success: false, error: error.message }
    }
}

export async function getSaleDetails(id: string) {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("ventas")
            .select(`
                *,
                usuario:usuarios(nombre_completo),
                detalles:venta_detalles(
                    *,
                    producto:productos(nombre, codigo)
                )
            `)
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
