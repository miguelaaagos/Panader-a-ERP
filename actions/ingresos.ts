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
    generar_gasto: z.boolean().default(false)
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
            p_generar_gasto: validatedData.generar_gasto
        })

        if (error) {
            console.error("Error from RPC:", error)
            throw new Error(error.message)
        }

        revalidatePath("/dashboard/inventario")
        revalidatePath("/dashboard/inventario/ingresos")

        return { success: true, data: result }
    } catch (error: any) {
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
                usuario:usuario_id (
                    nombre_completo
                )
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
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
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}
