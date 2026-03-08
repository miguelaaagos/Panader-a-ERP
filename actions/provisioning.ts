"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Aprovisiona un nuevo tenant con datos base para que sea operativo de inmediato.
 * Se debe llamar después de la creación exitosa del tenant (ej. vía webhook o registro).
 */
export async function provisionTenant(tenantId: string) {
    const supabase = await createClient()

    try {
        // 1. Insertar Categorías de Gastos por Defecto
        const defaultExpenseCategories = [
            { name: "Insumos y Materias Primas", description: "Compras directas para producción", tenant_id: tenantId },
            { name: "Sueldos y Previsión", description: "Pagos de personal y leyes sociales", tenant_id: tenantId },
            { name: "Servicios Básicos", description: "Luz, Agua, Gas, Internet", tenant_id: tenantId },
            { name: "Arriendo y Local", description: "Gastos de inmueble", tenant_id: tenantId },
            { name: "Mantenimiento y Equipos", description: "Reparaciones y maquinaria", tenant_id: tenantId },
            { name: "Impuestos y Gastos Bancarios", description: "IVA, comisiones, seguros", tenant_id: tenantId },
        ]

        await supabase.from("categorias_gastos").insert(defaultExpenseCategories)

        // 2. Insertar Configuración Base del Local
        await supabase.from("configuraciones").insert({
            tenant_id: tenantId,
            nombre_negocio: "Mi Panadería", // Placeholder que el usuario cambiará
            moneda: "CLP",
            timezone: "America/Santiago",
            iva_default: 19
        })

        // 3. Insertar Unidades de Medida Estándar (opcional si son globales)
        // ...

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Error provisioning tenant:", error)
        return { success: false, error: "Error al configurar datos iniciales del local" }
    }
}
