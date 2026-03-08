import { createClient } from "@/lib/supabase/server"
import { SubscriptionTier } from "@/lib/subscription"

export interface TenantBranding {
    name: string;
    slogan: string | null;
    logo_url: string | null;
    tier: SubscriptionTier;
}

/**
 * Obtiene el nivel de suscripción y branding actual para el tenant del usuario autenticado.
 */
export async function getTenantBranding(): Promise<TenantBranding> {
    const supabase = await createClient()

    // 1. Obtener el tenant_id del usuario actual (basado en claims o perfil)
    // Nota: En este proyecto el tenant_id está en la tabla 'usuarios'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { name: "Simple ERP", logo_url: null, slogan: null, tier: "initial" }

    const { data: profile } = await supabase
        .from("usuarios")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) return { name: "Simple ERP", logo_url: null, slogan: null, tier: "initial" }

    // 2. Consultar la suscripción y branding del tenant
    const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_tier, name, logo_url, slogan")
        .eq("id", profile.tenant_id)
        .single()

    return {
        tier: (tenant?.subscription_tier as SubscriptionTier) ?? "initial",
        name: tenant?.name ?? "Simple ERP",
        logo_url: tenant?.logo_url ?? null,
        slogan: tenant?.slogan ?? null
    }
}

/**
 * @deprecated Use getTenantBranding instead
 */
export async function getTenantTier(): Promise<SubscriptionTier> {
    const branding = await getTenantBranding();
    return branding.tier;
}
