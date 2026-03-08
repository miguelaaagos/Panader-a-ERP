"use server"

import { validateRequest } from "@/lib/server/auth"
import { startOfMonth, endOfMonth, parseISO, isValid } from "date-fns"

export async function getReporteFinancieroMensual(monthISO?: string) {
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        // Determinar fechas de inicio y fin del mes
        let startDate: Date
        let endDate: Date

        if (monthISO && isValid(parseISO(monthISO))) {
            const parsed = parseISO(monthISO)
            startDate = startOfMonth(parsed)
            endDate = endOfMonth(parsed)
        } else {
            const now = new Date()
            startDate = startOfMonth(now)
            endDate = endOfMonth(now)
        }

        const startStr = startDate.toISOString()
        const endStr = endDate.toISOString()

        // 1. Obtener Ventas del Mes
        const { data: ventasData, error: ventasError } = await supabase
            .from("ventas")
            .select("total, metodo_pago")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startStr)
            .lte("created_at", endStr)

        if (ventasError) throw ventasError

        let totalVentas = 0
        let totalIvaDebito = 0

        ventasData.forEach(v => {
            totalVentas += Number(v.total || 0)
            // Asumiendo que las ventas siempre tienen IVA incluido si somos responsables
            // Por requerimiento: Total IVA Débito (Ventas * 19%) -> Esto asume que el Total NO INCLUYE el IVA o es el NETO?
            // "Monto Iva Débito (Ventas * 19%)". Si "Total" es BRUTO, el Neto es Total / 1.19.
            // Si Total ya es Neto, entonces Iva es Total * 0.19. Asumiremos que el "Total" de ventas es el Bruto que paga el cliente.
            // Por lo tanto, el Neto es Total / 1.19, y el IVA es Bruto - Neto.
            // Ajustaremos esto para ser un cálculo simple de Neto y Bruto.
            const neto = Number(v.total || 0) / 1.19
            const iva = Number(v.total || 0) - neto
            totalIvaDebito += iva
        })

        // 2. Obtener Gastos del Mes
        const { data: gastosData, error: gastosError } = await supabase
            .from("gastos")
            .select("id, descripcion, monto_neto, monto_iva, monto_total, tipo_gasto")
            .eq("tenant_id", profile.tenant_id)
            .gte("fecha_gasto", startStr)
            .lte("fecha_gasto", endStr)

        if (gastosError) throw gastosError

        let totalGastosNeto = 0
        let totalIvaCredito = 0
        let totalGastosBruto = 0

        // Diferenciar gastos
        let totalFijosBruto = 0
        let totalFijosNeto = 0
        let totalVariablesBruto = 0
        let totalVariablesNeto = 0

        gastosData.forEach(g => {
            totalGastosNeto += Number(g.monto_neto || 0)
            totalIvaCredito += Number(g.monto_iva || 0)
            totalGastosBruto += Number(g.monto_total || 0)

            if (g.tipo_gasto === 'fijo') {
                totalFijosBruto += Number(g.monto_total || 0)
                totalFijosNeto += Number(g.monto_neto || 0)
            } else {
                totalVariablesBruto += Number(g.monto_total || 0)
                totalVariablesNeto += Number(g.monto_neto || 0)
            }
        })

        // Resumen
        const resumen = {
            periodo: {
                inicio: startStr,
                fin: endStr
            },
            ventas: {
                bruto: totalVentas,
                neto: totalVentas - totalIvaDebito,
                iva_debito: totalIvaDebito
            },
            gastos: {
                bruto: totalGastosBruto,
                neto: totalGastosNeto,
                iva_credito: totalIvaCredito,
                fijos_bruto: totalFijosBruto,
                fijos_neto: totalFijosNeto,
                variables_bruto: totalVariablesBruto,
                variables_neto: totalVariablesNeto,
                fijos_detalle: gastosData
                    .filter(g => g.tipo_gasto === 'fijo')
                    .map(g => ({
                        descripcion: g.descripcion,
                        monto: g.monto_total,
                        id: g.id
                    }))
            },
            impuestos: {
                iva_a_pagar: Math.max(0, totalIvaDebito - totalIvaCredito),
                iva_a_favor: Math.max(0, totalIvaCredito - totalIvaDebito)
            },
            utilidad: {
                bruta: (totalVentas - totalIvaDebito) - totalVariablesNeto,
                neta: (totalVentas - totalIvaDebito) - totalVariablesNeto - totalFijosNeto
            }
        }

        return { success: true, data: resumen }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}

export async function getProyeccionInventario() {
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const { data: productos, error } = await supabase
            .from("productos")
            .select("id, nombre, stock_actual, precio_venta, costo_unitario")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .gt("stock_actual", 0)

        if (error) throw error

        let totalInversion = 0
        let totalVentaPotencial = 0
        let totalIvaDebitoPotencial = 0

        productos?.forEach(p => {
            const stock = Number(p.stock_actual || 0)
            const costo = Number(p.costo_unitario || 0)
            const precio = Number(p.precio_venta || 0)

            totalInversion += stock * costo
            totalVentaPotencial += stock * precio

            // Cálculo IVA (Asumiendo que precio_venta es BRUTO)
            const neto = precio / 1.19
            totalIvaDebitoPotencial += stock * (precio - neto)
        })

        const totalNetoPotencial = totalVentaPotencial - totalIvaDebitoPotencial
        const totalUtilidadPotencial = totalNetoPotencial - totalInversion

        return {
            success: true,
            data: {
                total_inversion: totalInversion,
                total_venta_potencial: totalVentaPotencial,
                total_iva_debito_potencial: totalIvaDebitoPotencial,
                total_neto_potencial: totalNetoPotencial,
                total_utilidad_potencial: totalUtilidadPotencial,
                conteo_productos: productos?.length || 0
            }
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
    }
}
