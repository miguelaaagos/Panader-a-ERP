import { Metadata } from "next"
import { validateRequest } from "@/lib/server/auth"
import { PricingTable } from "@/components/landing/PricingTable"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
    title: "Suscripción | Simple ERP",
    description: "Gestiona el plan de tu negocio",
}

export default async function SubscriptionPage() {
    const { profile } = await validateRequest()
    const supabase = await createClient()

    // Obtener estado actual del tenant
    const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_tier, subscription_status, name")
        .eq("id", profile.tenant_id)
        .single()

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif text-primary">Planes y Suscripción</h1>
                <p className="text-muted-foreground">
                    Tu plan actual es: <span className="font-bold text-foreground uppercase">{tenant?.subscription_tier || 'Initial'}</span>
                    {tenant?.subscription_status && (
                        <span className={tenant.subscription_status === 'active' ? 'text-green-500 ml-2' : 'text-yellow-500 ml-2'}>
                            ({tenant.subscription_status})
                        </span>
                    )}
                </p>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden p-1 shadow-sm">
                <PricingTable isDashboard={true} tenantId={profile.tenant_id} />
            </div>
        </div>
    )
}
