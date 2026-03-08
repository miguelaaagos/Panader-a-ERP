import { createClient } from "@/lib/supabase/server"
import { SubscriptionTier } from "@/lib/subscription"

/**
 * Obtiene el nivel de suscripción actual para el tenant del usuario autenticado.
 * Usa caché de Next.js por defecto si se llama dentro de la misma request.
 */
export async function getTenantTier(): Promise<SubscriptionTier> {
    const supabase = await createClient()

    // 1. Obtener el tenant_id del usuario actual (basado en claims o perfil)
    // Nota: En este proyecto el tenant_id está en la tabla 'usuarios'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "initial"

    const { data: profile } = await supabase
        .from("usuarios")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) return "initial"

    // 2. Consultar la suscripción del tenant
    const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_tier")
        .eq("id", profile.tenant_id)
        .single()

    return tenant?.subscription_tier ?? "initial"
}
