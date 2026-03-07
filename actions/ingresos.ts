"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const IngresoDetalleSchema = z.object({
    producto_id: z.string().uuid("Producto inválido"),
    cantidad: z.number().positive("La cantidad a ingresar debe ser mayor a 0"),
    costo_unitario: z.number().min(0, "El costo unitario no puede ser negativo")
})

export type IngresoDetalle = z.infer<typeof IngresoDetalleSchema>

const IngresoSchema = z.object({
    detalles: z.array(IngresoDetalleSchema).min(1, "Debe agregar al menos un producto"),
    observaciones: z.string().optional(),
    subtotal: z.number().min(0).default(0),
    monto_iva: z.number().min(0).default(0),
    total: z.number().min(0).default(0),
    tipo_documento: z.enum(["Factura", "Boleta", "Otro"]).default("Otro"),
    generar_gasto: z.boolean().default(false),
    proveedor_id: z.string().uuid().optional()
})

/**
 * Registra un ingreso masivo de inventario mediante una función RPC atómica
 */
export async function registrarIngresoInventario(data: z.infer<typeof IngresoSchema>) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')
        const validatedData = IngresoSchema.parse(data)

        // El RPC procesar_ingreso_inventario espera un array de un tipo compuesto.
        // supabase-js automáticamente convierte un array de objetos JSON con las mismas
        // claves que el TYPE definido en postgres al llamar a rpc.
        const { data: result, error } = await supabase.rpc('procesar_ingreso_inventario', {
            p_tenant_id: profile.tenant_id,
            p_usuario_id: profile.id,
            p_detalles: validatedData.detalles,
            p_observaciones: validatedData.observaciones || undefined,
            p_subtotal: validatedData.subtotal,
            p_monto_iva: validatedData.monto_iva,
            p_total: validatedData.total,
            p_tipo_documento: validatedData.tipo_documento,
            p_generar_gasto: validatedData.generar_gasto,
            p_proveedor_id: validatedData.proveedor_id || null
        })

        if (error) {
            console.error("Error from RPC:", error)
            throw new Error(error.message)
        }

        revalidatePath("/dashboard/inventario")
        revalidatePath("/dashboard/inventario/ingresos")

        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error registrando ingreso de inventario:", error)
        const errorMessage = error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error
                ? error.message
                : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Obtiene el historial de ingresos de inventario (Cabeceras)
 */
export async function getHistorialIngresos() {
    try {
        const { supabase, profile } = await validateRequest('inventory.view')

        const { data, error } = await supabase
            .from("ingresos_inventario")
            .select(`
                id,
                codigo,
                observaciones,
                created_at,
                subtotal,
                monto_iva,
                total,
                tipo_documento,
                generar_gasto,
                estado,
                usuario:usuario_id (
                    nombre_completo
                ),
                proveedor:proveedor_id (
                    id,
                    nombre
                )
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Obtiene los detalles de un ingreso de inventario específico
 */
export async function getDetallesIngreso(ingresoId: string) {
    try {
        const { supabase, profile } = await validateRequest('inventory.view')

        // Seguridad: verificar que el ingreso existe y pertenece al tenant
        const { data: ingresoCheck, error: checkError } = await supabase
            .from("ingresos_inventario")
            .select("id")
            .eq("id", ingresoId)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (checkError || !ingresoCheck) {
            throw new Error("Ingreso no encontrado o acceso denegado")
        }

        const { data, error } = await supabase
            .from("ingreso_inventario_detalles")
            .select(`
                id,
                cantidad,
                costo_unitario,
                producto:producto_id (
                    nombre,
                    unidad_medida,
                    codigo
                )
            `)
            .eq("ingreso_id", ingresoId)

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Anula un ingreso de inventario (compra).
 * Revierte el stock físico y marca el ingreso y gasto asociado (si aplica) como 'anulada'.
 */
export async function anularIngreso(ingresoId: string) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        // 1. Obtener la compra y verificar que no esté anulada
        const { data: ingreso, error: checkError } = await supabase
            .from("ingresos_inventario")
            .select("id, generar_gasto, estado")
            .eq("id", ingresoId)
            .eq("tenant_id", profile.tenant_id)
            .single()

        if (checkError || !ingreso) {
            throw new Error("Ingreso no encontrado")
        }

        if (ingreso.estado === 'anulada') {
            throw new Error("Esta compra ya se encuentra anulada")
        }

        // 2. Obtener detalles para revertir stock
        const { data: detalles, error: detError } = await supabase
            .from("ingreso_inventario_detalles")
            .select("producto_id, cantidad")
            .eq("ingreso_id", ingresoId)

        if (detError) throw detError

        // 3. Revertir el stock mediante un loop conservador (no tenemos RPC nativa de anulación)
        for (const det of detalles) {
            // Obtenemos el stock actual
            const { data: prodData } = await supabase
                .from("productos")
                .select("stock_actual")
                .eq("id", det.producto_id)
                .single()

            if (prodData) {
                const newStock = Math.max(0, Number(prodData.stock_actual) - Number(det.cantidad))
                await supabase
                    .from("productos")
                    .update({ stock_actual: newStock })
                    .eq("id", det.producto_id)
            }
        }

        // 4. Marcar ingreso como anulada
        const { error: updIngresoError } = await supabase
            .from("ingresos_inventario")
            .update({ estado: 'anulada' })
            .eq("id", ingresoId)

        if (updIngresoError) throw updIngresoError

        // 5. Marcar gasto como anulada si correspondía
        if (ingreso.generar_gasto) {
            await supabase
                .from("gastos")
                .update({ estado: 'anulada' })
                .eq("ingreso_inventario_id", ingresoId)
                .eq("tenant_id", profile.tenant_id)
        }

        revalidatePath("/dashboard/inventario")
        revalidatePath("/dashboard/inventario/ingresos")
        revalidatePath("/dashboard/gastos")

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error.message || String(error) }
    }
}
