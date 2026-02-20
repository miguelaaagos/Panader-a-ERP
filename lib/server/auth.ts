import { createClient } from "@/lib/supabase/server"
import { Permission, hasPermission, UserRole } from "@/lib/roles"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export interface AuthContext {
    supabase: SupabaseClient<Database>
    user_id: string
    profile: {
        id: string
        tenant_id: string
        rol: UserRole
        nombre_completo: string
    }
}

/**
 * Validates that the current user is authenticated and optionally checks for a specific permission.
 * Returns the Supabase client, user_id, and full profile.
 */
export async function validateRequest(requiredPermission?: Permission): Promise<AuthContext> {
    const supabase = await createClient()
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
    const claims = claimsData?.claims

    if (claimsError || !claims) {
        throw new Error("No autenticado")
    }

    const { data: profileData, error: profileError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", claims.sub!)
        .single()

    if (profileError || !profileData) {
        throw new Error("Perfil de usuario no encontrado")
    }

    // Cast explicitly to solve "never" type issue from Supabase client inference in some contexts
    const profile = profileData as unknown as AuthContext['profile']

    if (requiredPermission) {
        if (!hasPermission(profile.rol, requiredPermission)) {
            throw new Error(`Acceso denegado. Se requiere el permiso: ${requiredPermission}`)
        }
    }

    return { supabase, user_id: claims.sub!, profile }
}
