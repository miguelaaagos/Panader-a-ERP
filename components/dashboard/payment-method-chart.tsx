"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from "recharts"

interface PaymentMethodData {
    name: string
    value: number
}

interface PaymentMethodChartProps {
    data: PaymentMethodData[]
}

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--primary)/0.8)',
    'hsl(var(--primary)/0.6)',
    'hsl(var(--primary)/0.4)',
    'hsl(var(--primary)/0.2)'
]

const LABEL_MAP: Record<string, string> = {
    "efectivo": "Efectivo",
    "tarjeta_debito": "Tarjeta Débito",
    "tarjeta_credito": "Tarjeta Crédito",
    "transferencia": "Transferencia",
    "otro": "Otro",
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
    if (data.length === 0) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-primary/10 shadow-sm">
                <CardDescription>No hay datos de pago para este periodo.</CardDescription>
            </Card>
        )
    }

    // Sort data from highest to lowest for better visualization
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <Card className="h-full border-primary/10 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold font-serif text-foreground">Ventas por Método de Pago</CardTitle>
                <CardDescription>Distribución de ingresos según el medio utilizado.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4 pl-2">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sortedData}
                            layout="vertical"
                            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={110}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                                tickFormatter={(value) => (LABEL_MAP[value.toLowerCase()] || value)}
                                className="font-serif font-medium"
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontFamily: 'serif'
                                }}
                                formatter={(value: unknown) => [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value || 0)), "Total"]}
                                labelFormatter={(label) => (LABEL_MAP[label.toLowerCase()] || label)}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={32}
                            >
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    offset={10}
                                    fill="hsl(var(--foreground))"
                                    fontSize={10}
                                    fontWeight="bold"
                                    className="font-serif"
                                    formatter={(value: unknown) => Number(value) > 0 ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value)) : ''}
                                />
                                {sortedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${entry.name}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
