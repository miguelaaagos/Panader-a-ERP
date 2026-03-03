"use server"

import { validateRequest } from "@/lib/server/auth"
import { startOfDay, subDays, startOfMonth, format, parseISO, endOfMonth, endOfDay, getDate, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { connection } from "next/server"

export async function getDashboardStats(month?: number, year?: number) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = year !== undefined
        const targetDate = isHistorical
            ? month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
            : new Date()

        // Stock Crítico (siempre estado actual, independientemente de métricas históricas)
        const { data: allProducts } = await supabase
            .from("productos")
            .select("id, nombre, stock_actual, stock_minimo")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .not("stock_minimo", "is", null)

        interface ProductWithStock {
            id: string
            nombre: string
            stock_actual: number
            stock_minimo: number
        }

        const criticalItems = (allProducts || []).filter((p) =>
            (p.stock_actual !== null && p.stock_minimo !== null) &&
            Number(p.stock_actual) <= Number(p.stock_minimo)
        ) as unknown as ProductWithStock[]
        const stockCriticoCount = criticalItems.length

        const sinStockCount = (allProducts || []).filter((p) =>
            (p.stock_actual !== null) && Number(p.stock_actual) === 0
        ).length

        if (isHistorical) {
            let startOfTarget, endOfTarget
            if (month !== undefined) {
                startOfTarget = startOfMonth(targetDate)
                endOfTarget = endOfTarget = endOfMonth(targetDate)
            } else {
                startOfTarget = new Date(year, 0, 1)
                endOfTarget = new Date(year, 11, 31, 23, 59, 59)
            }

            // Ventas del periodo histórico (mes o año)
            const { data: salesPeriod } = await supabase
                .from("ventas")
                .select("total")
                .eq("tenant_id", profile.tenant_id)
                .gte("created_at", startOfTarget.toISOString())
                .lte("created_at", endOfTarget.toISOString())
                .neq("estado", "anulada")

            const totalPeriod = salesPeriod?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0
            const countPeriod = salesPeriod?.length || 0
            const ivaPeriod = totalPeriod - (totalPeriod / 1.19)

            return {
                success: true,
                data: {
                    totalToday: totalPeriod,
                    countToday: countPeriod,
                    percentageChange: 0,
                    stockCritico: stockCriticoCount,
                    sinStock: sinStockCount,
                    totalYesterday: 0,
                    totalMonth: totalPeriod,
                    ivaMonth: ivaPeriod,
                    criticalItems: criticalItems.slice(0, 5),
                    isHistorical: true
                }
            }
        }

        // Lógica normal de HOY y AYER
        const today = startOfDay(new Date())
        const yesterday = startOfDay(subDays(new Date(), 1))

        const { data: salesToday } = await supabase
            .from("ventas")
            .select("total")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", today.toISOString())
            .neq("estado", "anulada")

        const totalToday = salesToday?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0
        const countToday = salesToday?.length || 0

        const { data: salesYesterday } = await supabase
            .from("ventas")
            .select("total")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", yesterday.toISOString())
            .lt("created_at", today.toISOString())
            .neq("estado", "anulada")

        const totalYesterday = salesYesterday?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0

        const firstDayOfMonth = startOfMonth(new Date())
        const { data: salesMonth } = await supabase
            .from("ventas")
            .select("total")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", firstDayOfMonth.toISOString())
            .neq("estado", "anulada")

        const totalMonth = salesMonth?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0
        const ivaMonth = totalMonth - (totalMonth / 1.19)
        const percentageChange = totalYesterday === 0
            ? totalToday > 0 ? 100 : 0
            : ((totalToday - totalYesterday) / totalYesterday) * 100

        return {
            success: true,
            data: {
                totalToday,
                countToday,
                percentageChange: Math.round(percentageChange),
                stockCritico: stockCriticoCount,
                sinStock: sinStockCount,
                totalYesterday,
                totalMonth,
                ivaMonth,
                criticalItems: criticalItems.slice(0, 5),
                isHistorical: false
            }
        }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getCriticalStockItems() {
    await connection()
    try {
        const { supabase, profile } = await validateRequest()
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .not("stock_minimo", "is", null)

        if (error) throw error

        interface ProductBase {
            stock_actual: number
            stock_minimo: number
        }

        const criticalItems = (data || []).filter((p) =>
            (p.stock_actual !== null && p.stock_minimo !== null) &&
            Number(p.stock_actual) <= Number(p.stock_minimo)
        )

        return { success: true, data: criticalItems }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getSalesTrendData(month?: number, year?: number) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = year !== undefined
        const targetDate = isHistorical
            ? month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
            : new Date()

        let startDate, endDate, daysCount
        if (isHistorical) {
            if (month !== undefined) {
                startDate = startOfMonth(targetDate)
                endDate = endOfMonth(targetDate)
                daysCount = getDate(endDate)
            } else {
                startDate = new Date(year, 0, 1)
                endDate = new Date(year, 11, 31, 23, 59, 59)
                daysCount = 12 // Agruparemos por mes si es año completo
            }
        } else {
            startDate = startOfDay(subDays(new Date(), 13))
            endDate = new Date()
            daysCount = 14
        }

        const query = supabase
            .from("ventas")
            .select("total, created_at")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .neq("estado", "anulada")
            .order("created_at", { ascending: true })

        const { data: sales, error } = await query

        if (error) throw error

        // Agrupar por día o mes
        const dataGroup = Array.from({ length: daysCount }).map((_, i) => {
            let label, fullDate
            if (isHistorical && month === undefined) {
                const date = new Date(year, i, 1)
                label = format(date, "MMM", { locale: es })
                fullDate = format(date, "yyyy-MM")
            } else {
                const date = isHistorical ? addDays(startDate, i) : subDays(new Date(), daysCount - 1 - i)
                label = format(date, "dd/MM")
                fullDate = format(date, "yyyy-MM-dd")
            }
            return { date: label, fullDate, total: 0 }
        })

        sales?.forEach((sale: { created_at: string; total: number }) => {
            const formatStr = (isHistorical && month === undefined) ? "yyyy-MM" : "yyyy-MM-dd"
            const dayStr = format(parseISO(sale.created_at), formatStr)
            const match = dataGroup.find(d => d.fullDate === dayStr)
            if (match) match.total += sale.total
        })

        return { success: true, data: dataGroup }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getTopProductsData(month?: number, year?: number) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = year !== undefined
        const targetDate = isHistorical
            ? month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
            : new Date()

        let startDate, endDate
        if (isHistorical) {
            if (month !== undefined) {
                startDate = startOfMonth(targetDate)
                endDate = endOfMonth(targetDate)
            } else {
                startDate = new Date(year, 0, 1)
                endDate = new Date(year, 11, 31, 23, 59, 59)
            }
        } else {
            startDate = subDays(new Date(), 30)
            endDate = new Date()
        }

        const { data, error } = await supabase
            .from("venta_detalles")
            .select(`
                cantidad,
                total,
                producto:productos(nombre)
            `)
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())

        if (error) throw error

        // Agrupar por producto
        const productMap: Record<string, { nombre: string, cantidad: number, total: number }> = {}

        interface SaleDetailItem {
            cantidad: number
            total: number
            producto: { nombre: string } | null
        }

        (data as unknown as SaleDetailItem[])?.forEach((item) => {
            const nombre = item.producto?.nombre || "Desconocido"
            if (!productMap[nombre]) {
                productMap[nombre] = { nombre, cantidad: 0, total: 0 }
            }
            productMap[nombre].cantidad += Number(item.cantidad)
            productMap[nombre].total += Number(item.total)
        })

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 15)

        return { success: true, data: topProducts }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getTopProductsByUnitsData(month?: number, year?: number) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = year !== undefined
        const targetDate = isHistorical
            ? month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
            : new Date()

        let startDate, endDate
        if (isHistorical) {
            if (month !== undefined) {
                startDate = startOfMonth(targetDate)
                endDate = endOfMonth(targetDate)
            } else {
                startDate = new Date(year, 0, 1)
                endDate = new Date(year, 11, 31, 23, 59, 59)
            }
        } else {
            startDate = subDays(new Date(), 30)
            endDate = new Date()
        }

        const { data, error } = await supabase
            .from("venta_detalles")
            .select(`
                cantidad,
                total,
                producto:productos(nombre)
            `)
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())

        if (error) throw error

        const productMap: Record<string, { nombre: string, cantidad: number }> = {}

        interface SaleDetailItem {
            cantidad: number
            producto: { nombre: string } | null
        }

        (data as unknown as SaleDetailItem[])?.forEach((item) => {
            const nombre = item.producto?.nombre || "Desconocido"
            if (!productMap[nombre]) {
                productMap[nombre] = { nombre, cantidad: 0 }
            }
            productMap[nombre].cantidad += Number(item.cantidad)
        })

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 15)

        return { success: true, data: topProducts }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getPeakHoursData(month?: number, year?: number, days = 30) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = month !== undefined && year !== undefined
        const targetDate = isHistorical ? new Date(year, month - 1, 1) : new Date()

        let startDate, endDate
        if (isHistorical) {
            startDate = startOfMonth(targetDate)
            endDate = endOfMonth(targetDate)
        } else {
            startDate = subDays(new Date(), days)
            endDate = new Date()
        }

        const { data: sales, error } = await supabase
            .from("ventas")
            .select("total, created_at")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .neq("estado", "anulada")

        if (error) throw error

        // Initialize array for 24 hours (0-23)
        const hours = Array.from({ length: 24 }).map((_, i) => ({
            hourIndex: i,
            hourLabel: `${i.toString().padStart(2, '0')}:00`,
            transacciones: 0,
            ingresos: 0
        }))

        // Process each sale to its corresponding hour
        sales?.forEach((sale: { created_at: string; total: number }) => {
            const date = parseISO(sale.created_at)
            const hour = date.getHours() // Gets the local hour
            if (hours[hour]) {
                hours[hour].transacciones += 1
                hours[hour].ingresos += sale.total
            }
        })

        // Filter out extreme late night/early morning hours assuming bakery context (e.g. 06:00 to 22:00)
        const activeHours = hours.filter(h => h.hourIndex >= 6 && h.hourIndex <= 22)

        return { success: true, data: activeHours }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getPaymentMethodData(month?: number, year?: number) {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const isHistorical = year !== undefined
        const targetDate = isHistorical
            ? month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
            : new Date()

        let startDate, endDate
        if (isHistorical) {
            if (month !== undefined) {
                startDate = startOfMonth(targetDate)
                endDate = endOfMonth(targetDate)
            } else {
                startDate = new Date(year, 0, 1)
                endDate = new Date(year, 11, 31, 23, 59, 59)
            }
        } else {
            startDate = startOfMonth(new Date())
            endDate = new Date()
        }

        const { data: sales, error } = await supabase
            .from("ventas")
            .select("total, metodo_pago")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .neq("estado", "anulada")

        if (error) throw error

        const methodMap: Record<string, number> = {}

        sales?.forEach((sale: { total: number; metodo_pago: string | null }) => {
            const method = sale.metodo_pago || "Otro"
            methodMap[method] = (methodMap[method] || 0) + Number(sale.total)
        })

        const mappedData = Object.entries(methodMap).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value)

        return { success: true, data: mappedData }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
