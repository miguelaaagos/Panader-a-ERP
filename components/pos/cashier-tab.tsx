"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    openCashSession,
    closeCashSession,
    getCurrentCashSession,
    getSessionSummary,
    getRecentShiftSales
} from "@/actions/cash"
import { toast } from "sonner"
import {
    Coins,
    Lock,
    Unlock,
    AlertCircle,
    Clock,
    TrendingUp,
    CreditCard,
    Banknote,
    ArrowRightLeft,
    ReceiptText,
    Eye
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SaleDetailsModal } from "./sale-details-modal"

interface CashierTabProps {
    onSessionChange?: () => void
}

export function CashierTab({ onSessionChange }: CashierTabProps) {
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<any>(null)
    const [recentSales, setRecentSales] = useState<any[]>([])

    const [opening, setOpening] = useState(false)
    const [closing, setClosing] = useState(false)

    const [montoInicial, setMontoInicial] = useState("")
    const [montoFinal, setMontoFinal] = useState("")
    const [observaciones, setObservaciones] = useState("")

    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const res = await getCurrentCashSession()
        if (res.success && res.session) {
            setSession(res.session)
            // Cargar resumen y actividad
            const [summaryRes, salesRes] = await Promise.all([
                getSessionSummary(res.session.id),
                getRecentShiftSales(res.session.id)
            ])
            if (summaryRes.success) setSummary(summaryRes.summary)
            if (salesRes.success) setRecentSales(salesRes.data || [])
        } else {
            setSession(null)
            setSummary(null)
            setRecentSales([])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleOpen = async () => {
        if (!montoInicial || isNaN(Number(montoInicial))) {
            toast.error("Ingrese un monto inicial válido")
            return
        }
        setOpening(true)
        const res = await openCashSession(Number(montoInicial), observaciones)
        if (res.success) {
            toast.success("Caja abierta correctamente")
            setMontoInicial("")
            setObservaciones("")
            fetchData()
            onSessionChange?.()
        } else {
            toast.error(res.error)
        }
        setOpening(false)
    }

    const handleClose = async () => {
        if (!montoFinal || isNaN(Number(montoFinal))) {
            toast.error("Ingrese el monto final contado")
            return
        }
        setClosing(true)
        const res = await closeCashSession(Number(montoFinal), observaciones)
        if (res.success) {
            toast.success("Caja cerrada correctamente")
            setMontoFinal("")
            setObservaciones("")
            fetchData()
            onSessionChange?.()
        } else {
            toast.error(res.error)
        }
        setClosing(false)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Cargando estado del turno...</p>
        </div>
    )

    const expectedCash = session ? Number(session.monto_inicial) + (summary?.efectivo || 0) : 0

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
            {/* Control Principal */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="overflow-hidden border-orange-500/20">
                    <CardHeader className="bg-orange-500/5 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Coins className="h-5 w-5 text-orange-600" />
                                Control de Turno
                            </CardTitle>
                            {session ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <CardDescription>
                            {session ? "Mantenimiento del turno actual" : "Inicia un nuevo turno de caja"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!session ? (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="monto-inicial">Monto Inicial en Efectivo</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input
                                            id="monto-inicial"
                                            type="number"
                                            className="pl-7"
                                            placeholder="50000"
                                            value={montoInicial}
                                            onChange={(e) => setMontoInicial(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="obs">Observaciones de Apertura</Label>
                                    <Input
                                        id="obs"
                                        placeholder="Ej: Cambio recibido..."
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 h-11"
                                    onClick={handleOpen}
                                    disabled={opening}
                                >
                                    {opening ? "Abriendo..." : "Abrir Turno de Caja"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="monto-final">Conteo Final de Efectivo</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                            <Input
                                                id="monto-final"
                                                type="number"
                                                className="pl-7"
                                                placeholder="Total efectivo físico"
                                                value={montoFinal}
                                                onChange={(e) => setMontoFinal(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Esperado en caja: <strong>${expectedCash.toLocaleString('es-CL')}</strong>
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="obs-cierre">Notas de Cierre</Label>
                                        <Input
                                            id="obs-cierre"
                                            placeholder="Novedades o discrepancias..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    className="w-full h-11"
                                    onClick={handleClose}
                                    disabled={closing}
                                >
                                    {closing ? "Cerrando..." : "Cerrar Turno y Arqueo"}
                                </Button>
                                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>Al cerrar se bloquea la facturación para este turno.</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Resumen y Métricas */}
            <div className="lg:col-span-8 space-y-6">
                {session ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-primary/5 border-primary/10">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Clock className="h-5 w-5 text-primary mb-1" />
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Inicio</p>
                                    <p className="text-lg font-bold">{format(new Date(session.fecha_apertura), 'HH:mm', { locale: es })}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-green-500/5 border-green-500/10">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <TrendingUp className="h-5 w-5 text-green-600 mb-1" />
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Ventas Totales</p>
                                    <p className="text-lg font-bold text-green-700">
                                        ${(summary?.total || 0).toLocaleString('es-CL')}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-500/5 border-orange-500/10">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Banknote className="h-5 w-5 text-orange-600 mb-1" />
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Efectivo Turno</p>
                                    <p className="text-lg font-bold text-orange-700">
                                        ${(summary?.efectivo || 0).toLocaleString('es-CL')}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-500/5 border-blue-500/10">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <ReceiptText className="h-5 w-5 text-blue-600 mb-1" />
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Transacciones</p>
                                    <p className="text-lg font-bold text-blue-700">{recentSales.length}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Ventas por Método */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Ventas por Método
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-green-100 rounded text-green-700">
                                                <Banknote className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm">Efectivo</span>
                                        </div>
                                        <span className="font-bold">${(summary?.efectivo || 0).toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm">Débito / Crédito</span>
                                        </div>
                                        <span className="font-bold">
                                            ${((summary?.tarjeta_debito || 0) + (summary?.tarjeta_credito || 0)).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-purple-100 rounded text-purple-700">
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm">Transferencia</span>
                                        </div>
                                        <span className="font-bold">${(summary?.transferencia || 0).toLocaleString('es-CL')}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Últimas Ventas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ReceiptText className="h-4 w-4" />
                                        Últimas Ventas (Turno)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentSales.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentSales.map((sale) => (
                                                <div key={sale.id} className="group flex justify-between items-center text-sm p-2 hover:bg-muted/50 rounded-md transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setSelectedSaleId(sale.id)
                                                                setIsDetailsOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <div>
                                                            <p className="font-medium">#{sale.numero_venta.slice(-6)}</p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {format(new Date(sale.fecha), 'HH:mm', { locale: es })} • {sale.metodo_pago.replace('_', ' ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-primary">${Number(sale.total).toLocaleString('es-CL')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                                            <p className="text-sm">No hay ventas registradas</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12 bg-muted/20 border border-dashed rounded-xl">
                        <div className="p-4 bg-muted rounded-full">
                            <Lock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="max-w-xs">
                            <h3 className="text-lg font-bold">Turno no iniciado</h3>
                            <p className="text-sm text-muted-foreground">
                                Debes abrir la caja para comenzar a procesar ventas y ver estadísticas en tiempo real.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <SaleDetailsModal
                saleId={selectedSaleId}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    )
}
