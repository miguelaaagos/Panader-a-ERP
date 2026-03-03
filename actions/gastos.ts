"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { GastoSchema } from "@/schemas/gastos"

/**
 * Obtiene todas las categorías de gastos
 */
export async function crearCategoriaGasto(nombre: string, descripcion?: string) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        if (!nombre || nombre.trim().length === 0) {
            return { success: false, error: "El nombre de la categoría es obligatorio" }
        }

        const { data, error } = await supabase
            .from("categorias_gastos")
            .insert({
                tenant_id: profile.tenant_id,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null
            })
            .select("id, nombre, descripcion")
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

/**
 * Obtiene todas las categorías de gastos
 */
export async function getCategoriasGastos() {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        const { data, error } = await supabase
            .from("categorias_gastos")
            .select("id, nombre, descripcion")
            .eq("tenant_id", profile.tenant_id)
            .order("nombre", { ascending: true })

        if (error) throw error
        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

/**
 * Registra un nuevo gasto manual
 */
export async function registrarGasto(data: z.infer<typeof GastoSchema>) {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')
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
                tipo_gasto: validated.tipo_gasto,
                fecha_gasto: validated.fecha_gasto
            })
            .select("id")
            .single()

        if (error) throw error

        revalidatePath("/dashboard/gastos")
        return { success: true, data: result }
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors.map((e) => e.message).join(", ") }
        }
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

/**
 * Obtiene el historial de gastos con filtrado básico
 */
export async function getGastos() {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

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
                tipo_gasto,
                created_at,
                categoria:categoria_id(nombre),
                usuario:usuario_id(nombre_completo)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("fecha_gasto", { ascending: false })
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
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
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

/**
 * Genera y clona automáticamente los gastos fijos del mes pasado si no se han clonado en el mes actual.
 * Esto evita tener que escribirlos a mano cada primero de mes.
 */
export async function generarGastosFijosDelMes() {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        const now = new Date()
        const mesActualISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // 1. Verificar si ya se ingresaron gastos fijos para este mes (para evitar duplicarlos recursivamente)
        const { data: gastosMensuales, error: checkError } = await supabase
            .from("gastos")
            .select("id")
            .eq("tenant_id", profile.tenant_id)
            .eq("tipo_gasto", "fijo")
            .gte("fecha_gasto", mesActualISO)

        if (checkError) throw checkError

        if (gastosMensuales && gastosMensuales.length > 0) {
            return { success: true, message: "Los gastos fijos de este mes ya han sido ingresados previamente.", count: 0 }
        }

        // 2. Obtener los gastos fijos creados en cualquier mes ANTERIOR pero quedándose sólo con los más recientes.
        // Debido a la simplicidad lógica, copiaremos todos los gastos marcados como "fijo" del MES PASADO.
        const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const mesAnteriorFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

        const { data: gastosPasados, error: fetchError } = await supabase
            .from("gastos")
            .select("descripcion, categoria_id, monto_neto, monto_iva, monto_total, tipo_documento")
            .eq("tenant_id", profile.tenant_id)
            .eq("tipo_gasto", "fijo")
            .gte("fecha_gasto", mesAnterior.toISOString())
            .lte("fecha_gasto", mesAnteriorFin.toISOString())

        if (fetchError) throw fetchError

        if (!gastosPasados || gastosPasados.length === 0) {
            return { success: true, message: "No se encontraron gastos fijos en el mes anterior para clonar.", count: 0 }
        }

        // 3. Crear los nuevos gastos para la fecha actual
        const nuevosGastos = gastosPasados.map(g => ({
            tenant_id: profile.tenant_id,
            usuario_id: profile.id, // El admin que pulsa el botón
            descripcion: g.descripcion,
            categoria_id: g.categoria_id,
            monto_neto: g.monto_neto,
            monto_iva: g.monto_iva,
            monto_total: g.monto_total,
            tipo_documento: g.tipo_documento,
            tipo_gasto: "fijo" as const,
            fecha_gasto: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
            .from("gastos")
            .insert(nuevosGastos)

        if (insertError) throw insertError

        revalidatePath("/dashboard/gastos")
        revalidatePath("/dashboard/reportes/financiero")

        return { success: true, message: `Se generaron exitosamente ${nuevosGastos.length} gastos fijos recurrentes para este mes.`, count: nuevosGastos.length }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
