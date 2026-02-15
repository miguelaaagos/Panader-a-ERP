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

        // 1. Validar Stock
        const productIds = validated.items.map(i => i.producto_id)
        const { data: products, error: productsError } = await supabase
            .from("productos")
            .select("id, nombre, stock_actual, precio_venta, costo_unitario")
            .in("id", productIds)

        if (productsError) throw new Error("Error al validar stock: " + productsError.message)

        type ProductType = {
            id: string
            nombre: string
            stock_actual: number
            precio_venta: number
            costo_unitario: number
        }

        const productMap = new Map((products as ProductType[]).map((p: ProductType) => [p.id, p]))

        for (const item of validated.items) {
            const product = productMap.get(item.producto_id)
            if (!product) throw new Error(`Producto no encontrado: ${item.producto_id}`)
            if (Number(product.stock_actual) < item.cantidad) {
                throw new Error(`Stock insuficiente para: ${product.nombre}`)
            }
        }

        // 2. Calcular Totales
        let subtotalVenta = 0
        const itemsToInsert = validated.items.map(item => {
            const product = productMap.get(item.producto_id)
            const subtotalLine = item.cantidad * item.precio_unitario
            const totalLine = subtotalLine - (item.descuento || 0)
            subtotalVenta += subtotalLine

            return {
                tenant_id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: subtotalLine,
                descuento: item.descuento,
                total: totalLine,
                costo_unitario: product?.costo_unitario || 0
            }
        })

        const totalVenta = subtotalVenta - (validated.descuento_global || 0)

        // 3. Generar número de venta (V-AAAAMMDD-XXX)
        // Usar la fecha local para el número de venta para evitar saltos de día por UTC
        const now = new Date()
        const datePart = now.toLocaleDateString('en-CA') // YYYY-MM-DD
        const dateStr = datePart.replace(/-/g, '')

        const { count, error: countError } = await supabase
            .from("ventas")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant_id)
            .gte("created_at", datePart)

        if (countError) console.warn("Error counting sales for today:", countError)

        const saleNumber = `V-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`

        // 4. Iniciar Registro
        // Crear la Venta
        const { data: sale, error: saleError } = await supabase
            .from("ventas")
            .insert([{
                tenant_id,
                numero_venta: saleNumber,
                fecha: now.toISOString(),
                cliente_nombre: validated.cliente_nombre || null,
                cliente_rut: validated.cliente_rut || null,
                subtotal: subtotalVenta,
                descuento: validated.descuento_global,
                total: totalVenta,
                metodo_pago: validated.metodo_pago,
                estado: "completada",
                usuario_id: user.id,
                notas: validated.notas || null
            }])
            .select()
            .single()

        if (saleError) throw new Error("Error al crear venta: " + saleError.message)

        // Crear los Detalles
        const detailsWithSaleId = itemsToInsert.map(item => ({ ...item, venta_id: sale.id }))
        const { error: detailsError } = await supabase
            .from("venta_detalles")
            .insert(detailsWithSaleId)

        if (detailsError) {
            // Intentar limpiar la venta si fallan los detalles
            await supabase.from("ventas").delete().eq("id", sale.id)
            throw new Error("Error al crear detalles de venta: " + detailsError.message)
        }

        // 5. Actualizar Stock (Security Definer RPC)
        for (const item of validated.items) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                product_id: item.producto_id,
                amount: item.cantidad
            })

            if (stockError) {
                console.error(`Error updating stock for ${item.producto_id}:`, stockError)
                // Notificamos pero no fallamos toda la venta ya que el dinero ya se procesó.
                // En un sistema ideal esto sería una transacción atómica.
            }
        }

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/inventario")
        revalidatePath("/dashboard/ventas")

        return { success: true, saleId: sale.id }

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
