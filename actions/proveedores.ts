"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"

export interface Proveedor {
    id: string
    nombre: string
    contacto: string | null
    activo: boolean
    created_at: string
}

export interface UltimoPrecioProducto {
    costo_unitario: number
    proveedor_id: string | null
    proveedor_nombre: string | null
    fecha: string
}

/**
 * Obtiene todos los proveedores activos del tenant
 */
export async function getProveedores(): Promise<{ success: boolean; data?: Proveedor[]; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.view')

        const { data, error } = await supabase
            .from("proveedores")
            .select("id, nombre, contacto, activo, created_at")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .order("nombre")

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Crea un nuevo proveedor para el tenant
 */
export async function crearProveedor(
    nombre: string,
    contacto?: string
): Promise<{ success: boolean; data?: Proveedor; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        if (!nombre?.trim()) {
            throw new Error("El nombre del proveedor es requerido")
        }

        const { data, error } = await supabase
            .from("proveedores")
            .insert({
                tenant_id: profile.tenant_id,
                nombre: nombre.trim(),
                contacto: contacto?.trim() || null,
                activo: true
            })
            .select("id, nombre, contacto, activo, created_at")
            .single()

        if (error) throw error

        revalidatePath("/dashboard/inventario/ingresos")

        return { success: true, data }
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Obtiene el último precio pagado por un producto y el proveedor asociado,
 * derivado del historial de compras existente.
 */
export async function getUltimoPrecioProducto(
    productoId: string
): Promise<{ success: boolean; data?: UltimoPrecioProducto | null; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.view')

        const { data, error } = await supabase
            .from("ingreso_inventario_detalles")
            .select(`
                costo_unitario,
                ingreso:ingreso_id (
                    created_at,
                    proveedor_id,
                    proveedor:proveedor_id (
                        nombre
                    )
                )
            `)
            .eq("producto_id", productoId)
            .order("ingreso_id", { ascending: false })
            .limit(1)
            .single()

        if (error) {
            // PGRST116 = no rows found, not a real error
            if (error.code === 'PGRST116') {
                return { success: true, data: null }
            }
            throw error
        }

        if (!data) return { success: true, data: null }

        const ingreso = data.ingreso as any

        return {
            success: true,
            data: {
                costo_unitario: data.costo_unitario,
                proveedor_id: ingreso?.proveedor_id || null,
                proveedor_nombre: ingreso?.proveedor?.nombre || null,
                fecha: ingreso?.created_at || ""
            }
        }
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}
