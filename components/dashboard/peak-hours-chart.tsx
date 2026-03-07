"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PeakHourItem {
    hourIndex: number
    hourLabel: string
    transacciones: number
    ingresos: number
}

interface PeakHoursChartProps {
    data: PeakHourItem[]
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Horarios Peak (Últimos 30 días)</CardTitle>
                <CardDescription>Volumen de transacciones distribuidas por hora del día.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis
                                dataKey="hourLabel"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                stroke="hsl(var(--border))"
                            />
                            <YAxis
                                yAxisId="left"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                stroke="hsl(var(--border))"
                                allowDecimals={false}
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
                                formatter={(value: number, name: string) => {
                                    if (name === "ingresos") return [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value || 0)), "Ingresos Totales"]
                                    if (name === "transacciones") return [value, "N° Ventas"]
                                    return [value, name]
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="transacciones"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            >
                                <LabelList
                                    dataKey="transacciones"
                                    position="top"
                                    offset={10}
                                    fill="hsl(var(--foreground))"
                                    fontSize={12}
                                    formatter={(value: number) => Number(value) > 0 ? value : ''}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
