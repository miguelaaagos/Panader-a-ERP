"use client"

import { useState, useEffect } from "react"
import { getReporteFinancieroMensual, getProyeccionInventario } from "@/actions/reportes"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Loader2, TrendingUp, TrendingDown, Landmark, Wallet, Calculator } from "lucide-react"
import {
    BarChart,
    Bar,
    Cell,
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
    const [proyeccion, setProyeccion] = useState<any>(null)
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
        const [reporteRes, proyeccionRes] = await Promise.all([
            getReporteFinancieroMensual(monthISO),
            getProyeccionInventario()
        ])

        if (reporteRes.success && reporteRes.data) {
            setReporte(reporteRes.data)
        } else {
            toast.error("Error al cargar reporte: " + reporteRes.error)
        }

        if (proyeccionRes.success && proyeccionRes.data) {
            setProyeccion(proyeccionRes.data)
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

    const chartData = [
        {
            name: "Ventas Totales",
            Total: Math.round(reporte.ventas.bruto || 0),
            fill: "hsl(var(--primary))"
        },
        {
            name: "Compras y Gastos",
            Total: Math.round(reporte.gastos.bruto || 0),
            fill: "hsl(var(--destructive))"
        },
        {
            name: "Utilidad Neta",
            Total: Math.round(Math.abs(reporte.utilidad.neta)),
            fill: reporte.utilidad.neta >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"
        }
    ]

    const proyeccionChartData = proyeccion ? [
        {
            name: "Inversión",
            Monto: Math.round(proyeccion.total_inversion),
            fill: "hsl(var(--muted-foreground))"
        },
        {
            name: "Neto",
            Monto: Math.round(proyeccion.total_neto_potencial),
            fill: "hsl(var(--primary) / 0.6)"
        },
        {
            name: "Venta (B)",
            Monto: Math.round(proyeccion.total_venta_potencial),
            fill: "hsl(var(--primary))"
        }
    ] : []

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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales (Bruto)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(reporte.ventas.bruto)}</div>
                        <p className="text-xs text-muted-foreground">Incluye IVA: {formatter.format(reporte.ventas.iva_debito)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos Variables (Bruto)</CardTitle>
                        <Wallet className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(reporte.gastos.variables_bruto)}</div>
                        <p className="text-xs text-muted-foreground">Insumos, compras, etc.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Costos Fijos (Bruto)</CardTitle>
                        <Landmark className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(reporte.gastos.fijos_bruto)}</div>
                        {reporte.gastos.fijos_detalle?.length > 0 ? (
                            <div className="mt-2 space-y-1">
                                {reporte.gastos.fijos_detalle.map((g: any) => (
                                    <div key={g.id} className="text-[10px] flex justify-between text-muted-foreground border-t border-muted pt-1">
                                        <span className="truncate max-w-[100px]">{g.descripcion}</span>
                                        <span>{formatter.format(g.monto)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Sueldos, arriendos, luz.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad Neta del Mes</CardTitle>
                        <Calculator className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${reporte.utilidad.neta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatter.format(reporte.utilidad.neta)}
                        </div>
                        <p className="text-xs text-muted-foreground">Después de todos los gastos.</p>
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
                            Ventas: {formatter.format(reporte.ventas.iva_debito)} | Compras: {formatter.format(reporte.gastos.iva_credito)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-4 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Proyección de Inventario (Venta Potencial)</span>
                            <Calculator className="h-5 w-5 text-primary" />
                        </CardTitle>
                        <CardDescription>
                            Resultado esperado si se vendiera todo el stock actual {proyeccion && `(${proyeccion.conteo_productos} productos)`}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Inversión Actual</p>
                                <p className="text-xl font-bold">{proyeccion ? formatter.format(proyeccion.total_inversion) : '...'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Venta Proyectada (B)</p>
                                <p className="text-xl font-bold text-primary">{proyeccion ? formatter.format(proyeccion.total_venta_potencial) : '...'}</p>
                                {proyeccion && <p className="text-[10px] text-muted-foreground">IVA: {formatter.format(proyeccion.total_iva_debito_potencial)}</p>}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Neto Proyectado</p>
                                <p className="text-xl font-bold">{proyeccion ? formatter.format(proyeccion.total_neto_potencial) : '...'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Utilidad Potencial</p>
                                <p className="text-xl font-bold text-emerald-600">{proyeccion ? formatter.format(proyeccion.total_utilidad_potencial) : '...'}</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full mt-4">
                            {proyeccion && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={proyeccionChartData} margin={{ left: 40, right: 40 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value: any) => [formatter.format(Number(value)), "Monto"]}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="Monto" radius={[0, 4, 4, 0]} barSize={40}>
                                            {proyeccionChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-proy-${index}`} fill={entry.fill} />
                                            ))}
                                            <LabelList dataKey="Monto" position="right" formatter={(val: any) => formatter.format(Number(val))} fontSize={11} offset={10} fill="hsl(var(--foreground))" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Flujo de Caja - Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barSize={50}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`}
                                        width={60}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                        formatter={(value: any) => [formatter.format(Number(value)), "Total"]}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="Total" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Detalle Tributario Mensual (SII)</CardTitle>
                    <CardDescription>
                        El IVA de tus ventas se descuenta con el IVA de tus compras y gastos con factura.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Total Ventas (Neto)</span>
                                <span className="text-2xl font-semibold">{formatter.format(reporte.ventas.neto)}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Total Gastos (Neto)</span>
                                <span className="text-2xl font-semibold">{formatter.format(reporte.gastos.neto)}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">(+) IVA Ventas (19%)</span>
                                <span className="font-medium">{formatter.format(reporte.ventas.iva_debito)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">(-) IVA Compras (19%)</span>
                                <span className="font-medium">{formatter.format(reporte.gastos.iva_credito)}</span>
                            </div>
                            <div className={`mt-4 flex justify-between items-center p-3 rounded-md ${reporte.impuestos.iva_a_pagar > 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'}`}>
                                <span className="font-semibold">{reporte.impuestos.iva_a_pagar > 0 ? 'IVA a Pagar' : 'Remanente a Favor'}</span>
                                <span className="font-bold">{formatter.format(reporte.impuestos.iva_a_pagar > 0 ? reporte.impuestos.iva_a_pagar : reporte.impuestos.iva_a_favor)}</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center justify-center p-4 border rounded-xl bg-muted/50">
                            <div className="text-center">
                                <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground max-w-[200px]">Usa este resumen para tu declaración mensual de impuestos (F29).</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
