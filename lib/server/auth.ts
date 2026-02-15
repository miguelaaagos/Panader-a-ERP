import { createClient } from "@/lib/supabase/server"
import { Permission, hasPermission, UserRole } from "@/lib/roles"

export type AuthContext = {
    supabase: any
    user: any
    profile: {
        id: string
        tenant_id: string
        rol: UserRole
        nombre_completo: string
    }
}

/**
 * Validates that the current user is authenticated and optionally checks for a specific permission.
 * Returns the Supabase client, user, and full profile.
 */
export async function validateRequest(requiredPermission?: Permission): Promise<AuthContext> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("No autenticado")
    }

    const { data: profile } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single()

    if (!profile || !profile.tenant_id) {
        throw new Error("Perfil de usuario no válido o sin tenant asignado")
    }

    const userRole = profile.rol as UserRole

    if (requiredPermission) {
        if (!hasPermission(userRole, requiredPermission)) {
            throw new Error(`Acceso denegado. Se requiere el permiso: ${requiredPermission}`)
        }
    }

    return { supabase, user, profile }
}
