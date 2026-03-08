import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ventipay } from "@/lib/ventipay";

/**
 * Handler para Webhooks de VentiPay
 * URL: /api/webhooks/ventipay
 */
export async function POST(req: NextRequest) {
    const payload = await req.json();
    const signature = req.headers.get("x-ventipay-signature");

    // TODO: Validar firma del webhook con VENTIPAY_WEBHOOK_SECRET
    // Por ahora procesamos basándonos en el evento
    const { type, data } = payload;

    const supabase = await createClient();

    try {
        switch (type) {
            case "subscription.updated":
            case "subscription.created": {
                const subscription = data;
                const tenantId = subscription.metadata?.tenant_id;

                if (!tenantId) {
                    console.error("Webhook VentiPay: Suscripción sin tenant_id en metadata");
                    return NextResponse.json({ error: "No tenant_id" }, { status: 400 });
                }

                // Actualizar el tier y estado en Supabase
                // El mapping de planes debe ser consistente (checkout_id o plan_id -> tier)
                let tier: 'initial' | 'advanced' | 'pro' = 'initial';
                if (subscription.plan?.name?.toLowerCase().includes("pro")) tier = "pro";
                else if (subscription.plan?.name?.toLowerCase().includes("avanzado")) tier = "advanced";

                const { error } = await supabase
                    .from("tenants")
                    .update({
                        subscription_tier: tier,
                        subscription_status: subscription.status,
                        ventipay_subscription_id: subscription.id
                    })
                    .eq("id", tenantId);

                if (error) throw error;
                break;
            }

            case "invoice.paid": {
                const invoice = data;
                // Lógica para marcar como pagado o extender periodo si fuera necesario
                console.log(`Factura pagada para suscripción: ${invoice.subscription}`);
                break;
            }

            case "subscription.canceled": {
                const subscription = data;
                const tenantId = subscription.metadata?.tenant_id;

                if (tenantId) {
                    await supabase
                        .from("tenants")
                        .update({ subscription_status: "canceled", subscription_tier: "initial" })
                        .eq("id", tenantId);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error procesando webhook de VentiPay:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}
