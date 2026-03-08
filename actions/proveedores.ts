"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"

export interface Proveedor {
    id: string
    nombre: string
    telefono: string | null
    email: string | null
    rut: string | null
    direccion: string | null
    banco: string | null
    tipo_cuenta: string | null
    numero_cuenta: string | null
    rut_pago: string | null
    email_pago: string | null
    created_at: string
}

export interface UltimoPrecioProducto {
    costo_unitario: number
    proveedor_id: string | null
    proveedor_nombre: string | null
    fecha: string
}

/**
 * Obtiene todos los proveedores del tenant
 */
export async function getProveedores(): Promise<{ success: boolean; data?: Proveedor[]; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.view')

        const { data, error } = await supabase
            .from("proveedores")
            .select("id, nombre, telefono, email, rut, direccion, banco, tipo_cuenta, numero_cuenta, rut_pago, email_pago, created_at")
            .eq("tenant_id", profile.tenant_id)
            .order("nombre")

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Crea un nuevo proveedor para el tenant
 */
export async function crearProveedor(
    nombre: string,
    telefono?: string,
    email?: string,
    rut?: string,
    direccion?: string,
    banco?: string,
    tipo_cuenta?: string,
    numero_cuenta?: string,
    rut_pago?: string,
    email_pago?: string
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
                telefono: telefono?.trim() || null,
                email: email?.trim() || null,
                rut: rut?.trim() || null,
                direccion: direccion?.trim() || null,
                banco: banco?.trim() || null,
                tipo_cuenta: tipo_cuenta?.trim() || null,
                numero_cuenta: numero_cuenta?.trim() || null,
                rut_pago: rut_pago?.trim() || null,
                email_pago: email_pago?.trim() || null,
            })
            .select("id, nombre, telefono, email, rut, direccion, banco, tipo_cuenta, numero_cuenta, rut_pago, email_pago, created_at")
            .single()

        if (error) throw error

        revalidatePath("/dashboard/inventario/ingresos")

        return { success: true, data }
    } catch (error: unknown) {
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

        const ingreso = data.ingreso as { created_at: string; proveedor_id: string | null; proveedor: { nombre: string } | null } | null

        return {
            success: true,
            data: {
                costo_unitario: data.costo_unitario,
                proveedor_id: ingreso?.proveedor_id || null,
                proveedor_nombre: ingreso?.proveedor?.nombre || null,
                fecha: ingreso?.created_at || ""
            }
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Actualiza un proveedor existente
 */
export async function updateProveedor(
    id: string,
    data: {
        nombre: string,
        telefono?: string,
        email?: string,
        rut?: string,
        direccion?: string,
        banco?: string,
        tipo_cuenta?: string,
        numero_cuenta?: string,
        rut_pago?: string,
        email_pago?: string
    }
): Promise<{ success: boolean; data?: Proveedor; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.edit')

        if (!data.nombre?.trim()) {
            throw new Error("El nombre del proveedor es requerido")
        }

        const { data: updatedData, error } = await supabase
            .from("proveedores")
            .update({
                nombre: data.nombre.trim(),
                telefono: data.telefono?.trim() || null,
                email: data.email?.trim() || null,
                rut: data.rut?.trim() || null,
                direccion: data.direccion?.trim() || null,
                banco: data.banco?.trim() || null,
                tipo_cuenta: data.tipo_cuenta?.trim() || null,
                numero_cuenta: data.numero_cuenta?.trim() || null,
                rut_pago: data.rut_pago?.trim() || null,
                email_pago: data.email_pago?.trim() || null,
            })
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)
            .select("id, nombre, telefono, email, rut, direccion, banco, tipo_cuenta, numero_cuenta, rut_pago, email_pago, created_at")
            .single()

        if (error) throw error

        revalidatePath("/dashboard/inventario/proveedores")
        revalidatePath("/dashboard/inventario/ingresos")
        revalidatePath("/dashboard/inventario/ingresos/nuevo")

        return { success: true, data: updatedData }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

/**
 * Elimina un proveedor del tenant.
 */
export async function deleteProveedor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, profile } = await validateRequest('inventory.delete')

        // Chequear si el proveedor tiene ingresos asociados
        const { count, error: countError } = await supabase
            .from("ingresos_inventario")
            .select("*", { count: "exact", head: true })
            .eq("proveedor_id", id)

        if (countError) throw countError
        if (count && count > 0) {
            throw new Error("No se puede eliminar un proveedor que tiene compras asociadas. Edítalo en su lugar.")
        }

        const { error } = await supabase
            .from("proveedores")
            .delete()
            .eq("id", id)
            .eq("tenant_id", profile.tenant_id)

        if (error) throw error

        revalidatePath("/dashboard/inventario/proveedores")
        revalidatePath("/dashboard/inventario/ingresos")

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}
