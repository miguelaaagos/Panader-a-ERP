"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, Banknote, CreditCard, ArrowRightLeft, TrendingUp, ReceiptText } from "lucide-react"
import { getSessionSummary, getRecentShiftSales } from "@/actions/cash"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PastSession {
    id: string
    fecha_apertura: string
    fecha_cierre: string | null
    monto_inicial: number
    monto_final_real: number | null
    estado: string
    observaciones: string | null
}

interface Summary {
    efectivo: number
    tarjeta_debito: number
    tarjeta_credito: number
    transferencia: number
    total: number
}

interface Sale {
    id: string
    numero_venta: string
    fecha: string
    metodo_pago: string
    total: number
}

interface ShiftDetailsModalProps {
    session: PastSession | null
    isOpen: boolean
    onClose: () => void
}

export function ShiftDetailsModal({ session, isOpen, onClose }: ShiftDetailsModalProps) {
    const [summary, setSummary] = useState<Summary | null>(null)
    const [recentSales, setRecentSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && session) {
            const fetchData = async () => {
                setLoading(true)
                const [summaryRes, salesRes] = await Promise.all([
                    getSessionSummary(session.id),
                    getRecentShiftSales(session.id, 20)
                ])
                if (summaryRes.success && summaryRes.summary) {
                    setSummary({
                        efectivo: summaryRes.summary.efectivo ?? 0,
                        tarjeta_debito: summaryRes.summary.tarjeta_debito ?? 0,
                        tarjeta_credito: summaryRes.summary.tarjeta_credito ?? 0,
                        transferencia: summaryRes.summary.transferencia ?? 0,
                        total: summaryRes.summary.total ?? 0,
                    })
                }
                if (salesRes.success) setRecentSales((salesRes.data || []) as Sale[])
                setLoading(false)
            }
            fetchData()
        }
    }, [isOpen, session])

    if (!session) return null

    const initialAmount = Number(session.monto_inicial) || 0
    const salesTotal = summary?.total || 0
    const expectedFinalAmount = initialAmount + (summary?.efectivo || 0)
    const realFinalAmount = Number(session.monto_final_real) || 0
    const difference = realFinalAmount - expectedFinalAmount

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Detalles del Turno
                    </DialogTitle>
                    <DialogDescription>
                        Resumen completo de la actividad de caja el {format(new Date(session.fecha_apertura), "PPP", { locale: es })}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-6">
                        {/* Cabecera con Tiempos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Apertura</p>
                                    <p className="text-sm font-bold">{format(new Date(session.fecha_apertura), "HH:mm")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Cierre</p>
                                    <p className="text-sm font-bold">
                                        {session.fecha_cierre ? format(new Date(session.fecha_cierre), "HH:mm") : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Comparativa de Montos */}
                        <Card className="border-primary/10">
                            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 text-center">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Inicial</p>
                                    <p className="text-base font-bold">${initialAmount.toLocaleString("es-CL")}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Ventas Turno</p>
                                    <p className="text-base font-bold text-green-600">${salesTotal.toLocaleString("es-CL")}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Final Real</p>
                                    <p className="text-base font-bold text-primary">${realFinalAmount.toLocaleString("es-CL")}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Diferencia</p>
                                    <p className={`text-base font-bold ${difference === 0 ? "text-muted-foreground" : difference > 0 ? "text-blue-600" : "text-destructive"}`}>
                                        {difference > 0 ? "+" : ""}{difference.toLocaleString("es-CL")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Desglose por Método */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                Desglose por Método de Pago
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 border rounded-lg flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Banknote className="h-4 w-4" />
                                        <span className="text-[10px] uppercase font-bold">Efectivo</span>
                                    </div>
                                    <p className="font-bold">${(summary?.efectivo || 0).toLocaleString("es-CL")}</p>
                                </div>
                                <div className="p-3 border rounded-lg flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-[10px] uppercase font-bold">Tarjeta</span>
                                    </div>
                                    <p className="font-bold">
                                        ${((summary?.tarjeta_debito || 0) + (summary?.tarjeta_credito || 0)).toLocaleString("es-CL")}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-lg flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ArrowRightLeft className="h-4 w-4" />
                                        <span className="text-[10px] uppercase font-bold">Transfer</span>
                                    </div>
                                    <p className="font-bold">${(summary?.transferencia || 0).toLocaleString("es-CL")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Ventas del Turno */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                <ReceiptText className="h-4 w-4 text-muted-foreground" />
                                Últimas Transacciones del Turno
                            </h4>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : recentSales.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                                    No se registraron ventas en este turno.
                                </p>
                            ) : (
                                <div className="border rounded-lg divide-y bg-muted/10">
                                    {recentSales.map((sale) => (
                                        <div key={sale.id} className="flex items-center justify-between p-3">
                                            <div>
                                                <p className="text-xs font-bold">{sale.numero_venta}</p>
                                                <p className="text-[10px] text-muted-foreground">{format(new Date(sale.fecha), "HH:mm")} • {sale.metodo_pago}</p>
                                            </div>
                                            <span className="text-xs font-bold">${sale.total.toLocaleString("es-CL")}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {session.observaciones && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground">Observaciones</h4>
                                <div className="p-3 bg-muted/50 rounded-lg text-sm italic text-muted-foreground border-l-4 border-primary/20">
                                    "{session.observaciones}"
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 flex justify-end">
                    <Button onClick={onClose}>Cerrar Detalle</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
