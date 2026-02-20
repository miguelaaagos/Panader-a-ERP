"use server"

import { validateRequest } from "@/lib/server/auth"
import { startOfDay, subDays, format, parseISO } from "date-fns"
import { connection } from "next/server"

export async function getDashboardStats() {
    await connection()
    try {
        // Solo admins ven KPIs financieros completos por ahora
        // Podríamos crear un permiso 'analytics.view_basic' para cajeros si fuera necesario
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const today = startOfDay(new Date())
        const yesterday = startOfDay(subDays(new Date(), 1))

        // Ventas hoy
        const { data: salesToday } = await supabase
            .from("ventas")
            .select("total")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", today.toISOString())
            .neq("estado", "anulada")

        const totalToday = salesToday?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0
        const countToday = salesToday?.length || 0

        // Ventas ayer (para comparación)
        const { data: salesYesterday } = await supabase
            .from("ventas")
            .select("total")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", yesterday.toISOString())
            .lt("created_at", today.toISOString())
            .neq("estado", "anulada")

        const totalYesterday = salesYesterday?.reduce((sum: number, v: { total: number }) => sum + v.total, 0) || 0
        const percentageChange = totalYesterday === 0
            ? totalToday > 0 ? 100 : 0
            : ((totalToday - totalYesterday) / totalYesterday) * 100

        // Stock Crítico (Fetch and filter to compare columns)
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

        return {
            success: true,
            data: {
                totalToday,
                countToday,
                percentageChange: Math.round(percentageChange),
                stockCritico: stockCriticoCount,
                totalYesterday,
                criticalItems: criticalItems.slice(0, 5) // Send some items for the alert
            }
        }
    } catch (error: unknown) {
        console.error("Error fetching dashboard stats:", error)
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

export async function getSalesTrendData() {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')

        const fourteenDaysAgo = startOfDay(subDays(new Date(), 13))

        const { data: sales } = await supabase
            .from("ventas")
            .select("total, created_at")
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", fourteenDaysAgo.toISOString())
            .neq("estado", "anulada")
            .order("created_at", { ascending: true })

        // Agrupar por día
        const days = Array.from({ length: 14 }).map((_, i) => {
            const date = subDays(new Date(), 13 - i)
            return {
                date: format(date, "dd/MM"),
                fullDate: format(date, "yyyy-MM-dd"),
                total: 0
            }
        })

        sales?.forEach((sale: { created_at: string; total: number }) => {
            const dayStr = format(parseISO(sale.created_at), "yyyy-MM-dd")
            const day = days.find(d => d.fullDate === dayStr)
            if (day) day.total += sale.total
        })

        return { success: true, data: days }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getTopProductsData() {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')
        const thirtyDaysAgo = subDays(new Date(), 30)

        // Query compleja: Unir venta_detalles con productos
        const { data, error } = await supabase
            .from("venta_detalles")
            .select(`
                cantidad,
                total,
                producto:productos(nombre)
            `)
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", thirtyDaysAgo.toISOString())

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
            .slice(0, 5)

        return { success: true, data: topProducts }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getTopProductsByUnitsData() {
    await connection()
    try {
        const { supabase, profile } = await validateRequest('analytics.view_full')
        const thirtyDaysAgo = subDays(new Date(), 30)

        const { data, error } = await supabase
            .from("venta_detalles")
            .select(`
                cantidad,
                total,
                producto:productos(nombre)
            `)
            .eq("tenant_id", profile.tenant_id)
            .gte("created_at", thirtyDaysAgo.toISOString())

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
            .slice(0, 5)

        return { success: true, data: topProducts }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
