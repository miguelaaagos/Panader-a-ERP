"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface TopProductItem {
    nombre: string
    total: number
}

interface TopProductsChartProps {
    data: TopProductItem[]
}

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--primary)/0.8)',
    'hsl(var(--primary)/0.6)',
    'hsl(var(--primary)/0.4)',
    'hsl(var(--primary)/0.2)'
]

export function TopProductsChart({ data }: TopProductsChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Productos (30 días)</CardTitle>
                <CardDescription>Por volumen de ventas CLP.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="nombre"
                                type="category"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={100}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                stroke="hsl(var(--border))"
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    color: "hsl(var(--foreground))"
                                }}
                                itemStyle={{
                                    color: "hsl(var(--foreground))"
                                }}
                                formatter={(value: number | string | undefined) => [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value || 0)), "Total"]}
                            />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                <LabelList
                                    dataKey="total"
                                    position="right"
                                    fill="hsl(var(--foreground))"
                                    fontSize={12}
                                    formatter={(value: any) => Number(value) > 0 ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value)) : ''}
                                />
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${entry.nombre}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
