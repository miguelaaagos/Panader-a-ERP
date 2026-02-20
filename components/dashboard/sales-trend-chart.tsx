"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SalesTrendItem {
    date: string
    total: number
}

interface SalesTrendChartProps {
    data: SalesTrendItem[]
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Ventas Últimos 14 Días</CardTitle>
                <CardDescription>Rendimiento diario de ingresos.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis
                                dataKey="date"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                stroke="hsl(var(--border))"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                stroke="hsl(var(--border))"
                                tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    color: "hsl(var(--foreground))"
                                }}
                                itemStyle={{
                                    color: "hsl(var(--foreground))"
                                }}
                                formatter={(value: number | string | undefined) => [`$${Number(value || 0).toLocaleString('es-CL')}`, "Total"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            >
                                <LabelList
                                    dataKey="total"
                                    position="top"
                                    offset={10}
                                    fill="hsl(var(--foreground))"
                                    fontSize={12}
                                    formatter={(value: any) => `$${Number(value) >= 1000 ? (Number(value) / 1000).toFixed(1) + 'k' : value}`}
                                />
                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
