"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function SalesChart() {
    const supabase = createClient()
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        loadChartData()
    }, [])

    const loadChartData = async () => {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: ventas, error } = await supabase
                .from("ventas")
                .select("total, created_at")
                .gte("created_at", today.toISOString())
                .eq("anulada", false)

            if (error) {
                console.error("Error en query de ventas:", error)
                throw error
            }

            // Agrupar por hora
            const hourlyData: { [key: string]: number } = {}

            for (let i = 0; i < 24; i++) {
                hourlyData[`${i}:00`] = 0
            }

            ventas?.forEach(venta => {
                const hour = new Date(venta.created_at).getHours()
                const hourKey = `${hour}:00`
                hourlyData[hourKey] += venta.total
            })

            const chartData = Object.entries(hourlyData).map(([hora, total]) => ({
                hora,
                total: Math.round(total)
            }))

            setData(chartData)
        } catch (error: any) {
            console.error("Error loading chart data:", error?.message || error)
            // Establecer datos vacíos en caso de error
            setData([])
        }
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="hora"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`}
                />
                <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, "Ventas"]}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
