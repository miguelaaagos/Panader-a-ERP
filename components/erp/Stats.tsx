"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BakeryStats() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        ventasHoy: 0,
        transaccionesHoy: 0,
        totalProductos: 0,
        stockCritico: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Fecha de hoy a las 00:00:00
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Query 1: Ventas del día
            const { data: ventas } = await supabase
                .from("ventas")
                .select("total")
                .gte("created_at", today.toISOString())
                .eq("anulada", false);

            const ventasHoy = ventas?.reduce((sum: number, v: any) => sum + v.total, 0) || 0;
            const transaccionesHoy = ventas?.length || 0;

            // Query 2: Total de productos activos
            const { count: totalProductos } = await supabase
                .from("productos")
                .select("*", { count: "exact", head: true })
                .eq("activo", true);

            // Query 3: Productos con stock crítico
            // Solo productos unitarios (no pesables) y activos donde stock_cantidad <= stock_minimo
            const { data: productosStockBajo } = await supabase
                .from("productos")
                .select("id, nombre, stock_cantidad, stock_minimo")
                .eq("activo", true)
                .eq("es_pesable", false)
                .not("stock_minimo", "is", null);

            // Filtrar en el cliente donde stock_cantidad <= stock_minimo
            const stockCritico = productosStockBajo?.filter(
                (p: any) => p.stock_cantidad <= p.stock_minimo
            ).length || 0;

            setStats({
                ventasHoy,
                transaccionesHoy,
                totalProductos: totalProductos || 0,
                stockCritico
            });
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statsData = [
        {
            title: "Ventas de Hoy",
            value: loading ? "..." : `$${Math.round(stats.ventasHoy).toLocaleString('es-CL')}`,
            description: loading ? "Cargando..." : `${stats.transaccionesHoy} transacciones`,
            icon: "💰",
        },
        {
            title: "Productos",
            value: loading ? "..." : stats.totalProductos.toString(),
            description: "En catálogo",
            icon: "🍞",
        },
        {
            title: "Stock Crítico",
            value: loading ? "..." : stats.stockCritico.toString(),
            description: "Requieren atención",
            icon: "⚠️",
            alert: stats.stockCritico > 0
        },
        {
            title: "Cajeros Activos",
            value: "1",
            description: "En turno",
            icon: "👥",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => (
                <Card
                    key={stat.title}
                    className={`border-primary/10 shadow-sm hover:shadow-md transition-shadow ${stat.alert ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <span className="text-xl">{stat.icon}</span>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className={`text-2xl font-bold font-serif ${stat.alert ? 'text-amber-600 dark:text-amber-500' : 'text-primary'
                                }`}>
                                {stat.value}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
