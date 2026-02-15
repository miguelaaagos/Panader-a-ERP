"use server"

import { validateRequest } from "@/lib/server/auth"
import { startOfDay, subDays, format, parseISO } from "date-fns"

export async function getDashboardStats() {
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

        const criticalItems = allProducts?.filter((p: any) => Number(p.stock_actual) <= Number(p.stock_minimo)) || []
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
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error)
        return { success: false, error: error.message }
    }
}

export async function getCriticalStockItems() {
    try {
        const { supabase, profile } = await validateRequest()
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .eq("activo", true)
            .not("stock_minimo", "is", null)

        if (error) throw error

        const criticalItems = data.filter((p: any) => Number(p.stock_actual) <= Number(p.stock_minimo))

        return { success: true, data: criticalItems }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getSalesTrendData() {
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
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getTopProductsData() {
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

        data?.forEach((item: any) => {
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
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
