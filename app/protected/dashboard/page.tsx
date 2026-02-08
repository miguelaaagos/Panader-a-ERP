"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, Users, FileText, Receipt } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { TopProducts } from "@/components/dashboard/top-products"

export default function DashboardPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalVentas: 0,
        totalTransacciones: 0,
        promedioVenta: 0,
        totalBoletas: 0,
        totalFacturas: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            // Obtener ventas del día actual
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: ventas, error } = await supabase
                .from("ventas")
                .select("total, tipo_documento, created_at")
                .gte("created_at", today.toISOString())
                .eq("anulada", false)

            if (error) {
                console.error("Error en query de ventas:", error)
                throw error
            }

            if (ventas) {
                const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)
                const totalTransacciones = ventas.length
                const promedioVenta = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0
                const totalBoletas = ventas.filter(v => v.tipo_documento === "Boleta").length
                const totalFacturas = ventas.filter(v => v.tipo_documento === "Factura").length

                setStats({
                    totalVentas,
                    totalTransacciones,
                    promedioVenta,
                    totalBoletas,
                    totalFacturas
                })
            }
        } catch (error: any) {
            console.error("Error loading dashboard:", error?.message || error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Resumen de ventas del día</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Ventas del Día"
                    value={`$${Math.round(stats.totalVentas).toLocaleString('es-CL')}`}
                    icon={DollarSign}
                    loading={loading}
                />
                <StatsCard
                    title="Transacciones"
                    value={stats.totalTransacciones.toString()}
                    icon={ShoppingCart}
                    loading={loading}
                />
                <StatsCard
                    title="Promedio por Venta"
                    value={`$${Math.round(stats.promedioVenta).toLocaleString('es-CL')}`}
                    icon={TrendingUp}
                    loading={loading}
                />
                <StatsCard
                    title="Documentos"
                    value={`${stats.totalBoletas}B / ${stats.totalFacturas}F`}
                    icon={FileText}
                    loading={loading}
                    description="Boletas / Facturas"
                />
            </div>

            {/* Charts and Tables */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Ventas por Hora</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <SalesChart />
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Productos Más Vendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TopProducts />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Transacciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <RecentTransactions />
                </CardContent>
            </Card>
        </div>
    )
}
