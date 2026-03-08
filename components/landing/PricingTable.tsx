"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export function PricingTable() {
    return (
        <section id="pricing" className="py-20 bg-black/20">
            <div className="container px-6 mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">Planes diseñados para tu negocio</h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Elige el plan que mejor se adapte al tamaño de tu negocio y escala cuando estés listo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02]",
                                plan.popular
                                    ? "bg-white/10 border-primary shadow-2xl shadow-primary/10"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Más Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-serif text-white mb-2">{plan.name}</h3>
                                <p className="text-white/50 text-sm leading-relaxed mb-6">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                                    <span className="text-white/40 text-sm">/ mes</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex gap-3 text-white/70 text-sm items-start">
                                        <div className="mt-1 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={cn(
                                    "w-full py-3 rounded-full text-center font-medium transition-all",
                                    plan.popular
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
