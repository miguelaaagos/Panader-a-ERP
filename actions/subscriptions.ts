"use server"

import { ventipay } from "@/lib/ventipay"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Inicia el flujo de suscripción para un tenant.
 * Crea el cliente en VentiPay si no existe y retorna la URL de pago.
 */
export async function createVentiPaySubscription(planId: string, tenantId: string) {
    const supabase = await createClient()

    try {
        console.log("[createVentiPaySubscription] Iniciando para tenantId:", tenantId);

        // 1. Obtener datos del tenant
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("name, ventipay_customer_id")
            .eq("id", tenantId)
            .single()

        if (tenantError) {
            console.error("[createVentiPaySubscription] Error de Supabase:", tenantError);
            throw new Error(`Tenant no encontrado: ${tenantError.message}`);
        }
        if (!tenant) throw new Error("Tenant no encontrado (sin datos)");

        console.log("[createVentiPaySubscription] Tenant encontrado:", tenant.name);

        let customerId = tenant.ventipay_customer_id

        // 2. Crear cliente en VentiPay si no tiene uno
        if (!customerId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuario no autenticado")

            const ventiCustomer = await ventipay.createCustomer({
                email: user.email!,
                name: tenant.name,
            })
            customerId = ventiCustomer.id

            // Guardar ID en Supabase
            await supabase
                .from("tenants")
                .update({ ventipay_customer_id: customerId })
                .eq("id", tenantId)
        }

        // 3. Crear Suscripción (VentiPay retornará un checkout o link)
        const subscription = await ventipay.createSubscription({
            customer: customerId!,
            plan: planId,
            currency: "clp",
            interval: "month",
            metadata: {
                tenant_id: tenantId
            }
        })

        return {
            success: true,
            checkoutUrl: (subscription as any).checkout_url || (subscription as any).url
        }

    } catch (error: any) {
        console.error("--- ERROR EN CREATE VENTIPAY SUBSCRIPTION ---");
        console.error("Mensaje:", error.message);
        if (error.response) {
            console.error("Respuesta completa de VentiPay:", JSON.stringify(error.response, null, 2));
        }
        console.error("---------------------------------------------");
        return {
            success: false,
            error: error.message || "Error al procesar la suscripción"
        }
    }
}

/**
 * Sincroniza el estado de la suscripción manualmente
 */
export async function syncSubscription(tenantId: string) {
    const supabase = await createClient()

    try {
        const { data: tenant } = await supabase
            .from("tenants")
            .select("ventipay_subscription_id")
            .eq("id", tenantId)
            .single()

        if (!tenant?.ventipay_subscription_id) throw new Error("No hay suscripción activa para sincronizar")

        const status = await ventipay.getSubscription(tenant.ventipay_subscription_id)

        await supabase
            .from("tenants")
            .update({ subscription_status: status.status })
            .eq("id", tenantId)

        revalidatePath("/dashboard/configuracion")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
