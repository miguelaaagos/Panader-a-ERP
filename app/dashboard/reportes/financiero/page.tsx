"use client"

import { useState, useEffect } from "react"
import { getReporteFinancieroMensual } from "@/actions/reportes"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Loader2, TrendingUp, TrendingDown, Landmark, Wallet, Calculator } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from "recharts"

export default function ReporteFinancieroPage() {
    const [loading, setLoading] = useState(true)
    const [reporte, setReporte] = useState<any>(null)
    const [selectedMonth, setSelectedMonth] = useState<string>(startOfMonth(new Date()).toISOString())

    const monthOptions = Array.from({ length: 12 }).map((_, i) => {
        const d = subMonths(startOfMonth(new Date()), i)
        return {
            label: format(d, "MMMM yyyy", { locale: es }),
            value: d.toISOString()
        }
    })

    const fetchReport = async (monthISO: string) => {
        setLoading(true)
        const res = await getReporteFinancieroMensual(monthISO)
        if (res.success && res.data) {
            setReporte(res.data)
        } else {
            toast.error("Error al cargar reporte: " + res.error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchReport(selectedMonth)
    }, [selectedMonth])

    if (loading && !reporte) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Generando reporte financiero...</span>
            </div>
        )
    }

    if (!reporte) return null

    const formatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" })

    // Datos para el gráfico
    const chartData = [
        {
            name: "Ingresos Brutos",
            Ventas: Math.round(reporte.ventas.bruto || 0),
            Gastos: 0,
        },
        {
            name: "Gastos y Compras",
            Ventas: 0,
            Gastos: Math.round(reporte.gastos.bruto || 0),
        },
        {
            name: "Utilidad Neta",
            Ventas: Math.round(reporte.utilidad.neta > 0 ? reporte.utilidad.neta : 0),
            Gastos: Math.round(reporte.utilidad.neta < 0 ? Math.abs(reporte.utilidad.neta) : 0),
        }
    ]

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reporte Financiero y Tributario (SII)</h2>
                    <p className="text-muted-foreground">Consolidado de ventas, gastos, utilidades y cálculo de IVA mensual.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={loading}>
                        <SelectTrigger className="w-[200px] capitalize">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => (
                                <SelectItem key={m.value} value={m.value} className="capitalize">
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading && <div className="text-sm text-muted-foreground animate-pulse">Actualizando datos...</div>}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales (Bruto)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(reporte.ventas.bruto)}</div>
                        <p className="text-xs text-muted-foreground">Incluye IVA Débito: {formatter.format(reporte.ventas.iva_debito)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos Operativos (Bruto)</CardTitle>
                        <Wallet className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(reporte.gastos.bruto)}</div>
                        <p className="text-xs text-muted-foreground">Incluye IVA Crédito: {formatter.format(reporte.gastos.iva_credito)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
                        <Calculator className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${reporte.utilidad.neta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatter.format(reporte.utilidad.neta)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ventas (Neto) - Gastos (Neto)</p>
                    </CardContent>
                </Card>
                <Card className={reporte.impuestos.iva_a_pagar > 0 ? 'border-amber-500/50 bg-amber-500/10' : 'border-emerald-500/50 bg-emerald-500/10'}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{reporte.impuestos.iva_a_pagar > 0 ? 'IVA a Pagar (SII)' : 'Remanente IVA (A Favor)'}</CardTitle>
                        <Landmark className={`h-4 w-4 ${reporte.impuestos.iva_a_pagar > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatter.format(reporte.impuestos.iva_a_pagar > 0 ? reporte.impuestos.iva_a_pagar : reporte.impuestos.iva_a_favor)}
                        </div>
                        <p className="text-xs opacity-70">
                            Débito: {formatter.format(reporte.ventas.iva_debito)} | Crédito: {formatter.format(reporte.gastos.iva_credito)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Flujo de Caja - Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                        formatter={(value: any) => [formatter.format(Number(value)), ""]}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Ventas" position="top" formatter={(val: any) => Number(val) > 0 ? formatter.format(Number(val)) : ""} fontSize={11} fill="hsl(var(--foreground))" />
                                    </Bar>
                                    <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Gastos" position="top" formatter={(val: any) => Number(val) > 0 ? formatter.format(Number(val)) : ""} fontSize={11} fill="hsl(var(--foreground))" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Detalle Tributario Mensual (SII)</CardTitle>
                        <CardDescription>
                            El IVA Débito es generado por tus Ventas, el IVA Crédito por tus compras y gastos con factura.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Total Ventas (Neto)</span>
                                <span className="text-2xl font-semibold">{formatter.format(reporte.ventas.neto)}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Total Gastos (Neto)</span>
                                <span className="text-2xl font-semibold">{formatter.format(reporte.gastos.neto)}</span>
                            </div>
                            <div className="border-t border-border pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm">(+) IVA Débito (19%)</span>
                                    <span className="font-medium">{formatter.format(reporte.ventas.iva_debito)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm">(-) IVA Crédito (19%)</span>
                                    <span className="font-medium">{formatter.format(reporte.gastos.iva_credito)}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-md ${reporte.impuestos.iva_a_pagar > 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'}`}>
                                    <span className="font-semibold">{reporte.impuestos.iva_a_pagar > 0 ? 'IVA a Pagar' : 'Remanente a Favor'}</span>
                                    <span className="font-bold">{formatter.format(reporte.impuestos.iva_a_pagar > 0 ? reporte.impuestos.iva_a_pagar : reporte.impuestos.iva_a_favor)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
