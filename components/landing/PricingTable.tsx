"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { createVentiPaySubscription } from "@/actions/subscriptions";
import { toast } from "sonner";

interface PricingTableProps {
    isDashboard?: boolean;
    tenantId?: string;
}

const planIdMap: Record<string, string> = {
    "Inicial": "pl_90hH4zpKo5zMSkU3DazKNFaw",
    "Avanzado": "plan_9z8x7c6v5b4a3_test", // Actualizar cuando tengas este ID
    "Pro": "plan_1q2w3e4r5t6y7_test"
};

const plans = [
    {
        name: "Inicial",
        price: "19.990",
        description: "Ideal para negocios pequeños o emprendimientos.",
        features: [
            "Punto de Venta (POS)",
            "Gestión de Inventario base",
            "Reportes diarios",
            "1 Usuario",
            "Soporte por email"
        ],
        cta: "Empezar ahora",
        href: "/register?plan=initial",
        popular: false
    },
    {
        name: "Avanzado",
        price: "34.990",
        description: "Para negocios en crecimiento que necesitan control total.",
        features: [
            "Todo lo del plan Inicial",
            "Módulo de Producción y Recetas",
            "Gestión de Gastos",
            "Hasta 5 Usuarios",
            "Soporte prioritario",
            "Analítica avanzada"
        ],
        cta: "Prueba gratuita",
        href: "/register?plan=advanced",
        popular: true
    },
    {
        name: "Pro",
        price: "59.990",
        description: "La solución completa para tu negocio a gran escala.",
        features: [
            "Todo lo del plan Avanzado",
            "Multi-sucursal",
            "API de integración",
            "Usuarios ilimitados",
            "Account Manager dedicado",
            "Personalización de reportes"
        ],
        cta: "Contactar ventas",
        href: "/register?plan=pro",
        popular: false
    }
];

export function PricingTable({ isDashboard, tenantId }: PricingTableProps) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planName: string) => {
        if (!isDashboard) return;
        if (!tenantId) {
            toast.error("No se pudo identificar el local");
            return;
        }

        const planId = planIdMap[planName];
        if (!planId && planName !== "Inicial") {
            toast.error("ID de plan no configurado");
            return;
        }

        setLoadingPlan(planName);
        try {
            const result = await createVentiPaySubscription(planId || "initial", tenantId);
            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                toast.error(result.error || "Error al iniciar el pago");
            }
        } catch (error) {
            toast.error("Error inesperado en la conexión");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className={cn("py-20", isDashboard ? "bg-transparent" : "bg-muted/20")}>
            <div className="container px-6 mx-auto">
                {!isDashboard && (
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Planes diseñados para tu negocio</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
                            Elige el plan que mejor se adapte al tamaño de tu negocio y escala cuando estés listo.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02]",
                                plan.popular
                                    ? "bg-card border-primary shadow-2xl shadow-primary/10"
                                    : "bg-card border-border hover:border-primary/30"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Más Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-serif text-foreground mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-light">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-primary italic">Consultar</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex gap-3 text-muted-foreground text-sm items-start font-medium">
                                        <div className="mt-1 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {isDashboard ? (
                                <button
                                    onClick={() => handleSubscribe(plan.name)}
                                    disabled={loadingPlan !== null}
                                    className={cn(
                                        "w-full py-3 rounded-full text-center font-medium transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2",
                                        plan.popular
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            : "bg-muted text-foreground border border-border hover:bg-muted/80"
                                    )}
                                >
                                    {loadingPlan === plan.name && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {plan.name === "Pro" ? "Contactar Ventas" : "Seleccionar Plan"}
                                </button>
                            ) : (
                                <Link
                                    href={plan.href}
                                    className={cn(
                                        "w-full py-3 rounded-full text-center font-medium transition-all text-sm uppercase tracking-wider",
                                        plan.popular
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            : "bg-muted text-foreground border border-border hover:bg-muted/80"
                                    )}
                                >
                                    {plan.name === "Pro" ? "Contactar Ventas" : "Solicitar Información"}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
