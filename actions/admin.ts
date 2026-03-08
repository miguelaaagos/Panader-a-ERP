"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Verifica si el usuario actual es un super_admin.
 * Lanza un error si no lo es.
 */
async function ensureSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("No autenticado")
    }

    const { data: profile } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single()

    if (profile?.rol !== "super_admin") {
        throw new Error("No autorizado. Se requiere rol super_admin.")
    }

    return { supabase, adminId: user.id }
}

export async function updateTenantSubscription(tenantId: string, newTier: 'initial' | 'advanced' | 'pro') {
    try {
        const { supabase, adminId } = await ensureSuperAdmin()

        // Llamar a la función RPC que definimos en la migración
        // para asegurar el logging atómico y el bypass de RLS.
        const { error } = await supabase.rpc('update_tenant_subscription_tier', {
            p_tenant_id: tenantId,
            p_new_tier: newTier,
            p_admin_id: adminId
        })

        if (error) throw error

        revalidatePath("/dashboard/admin/tenants")
        revalidatePath("/dashboard/admin")

        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating subscription:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido al actualizar suscripción"
        }
    }
}

export async function getGlobalAuditLogs() {
    try {
        const { supabase } = await ensureSuperAdmin()

        const { data, error } = await supabase
            .from("global_audit_logs")
            .select(`
                id,
                created_at,
                action,
                entity_type,
                entity_id,
                old_data,
                new_data,
                metadata,
                usuarios!user_id (nombre_completo, email)
            `)
            .order("created_at", { ascending: false })
            .limit(50)

        if (error) {
            console.error("Supabase error in getGlobalAuditLogs:", error)
            throw new Error(error.message)
        }

        return { success: true, data }
    } catch (error: unknown) {
        console.error("Error in getGlobalAuditLogs action:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al obtener logs de auditoría"
        }
    }
}

export async function getTenantsList() {
    try {
        const { supabase } = await ensureSuperAdmin()

        const { data, error } = await supabase
            .from("tenants")
            .select("id, name, subscription_tier")
            .order("name", { ascending: true })

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        console.error("Error fetching tenants list:", error)
        return { success: false, error: "No se pudo cargar la lista de locales" }
    }
}

export async function switchTenantContext(tenantId: string | null) {
    try {
        const { supabase } = await ensureSuperAdmin()

        // Llamar a la función RPC que creamos
        const { error } = await supabase.rpc('switch_tenant_context', {
            p_target_tenant_id: tenantId as any // Cast a any para permitir null según definición SQL
        })

        if (error) throw error

        // Revalidamos todo para que el cambio de contexto se note en todo el dashboard
        revalidatePath("/", "layout")

        return { success: true }
    } catch (error: unknown) {
        console.error("Error switching tenant context:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al cambiar de contexto"
        }
    }
}

export async function getMyImpersonation() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false }

        const { data: profile } = await supabase
            .from("usuarios")
            .select("impersonated_tenant_id, tenants(name)")
            .eq("id", user.id)
            .single()

        return {
            success: true,
            impersonatedId: profile?.impersonated_tenant_id,
            tenantName: (profile?.tenants as any)?.name
        }
    } catch {
        return { success: false }
    }
}
