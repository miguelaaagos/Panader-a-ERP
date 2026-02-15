"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { openCashSession, closeCashSession, getCurrentCashSession } from "@/actions/cash"
import { toast } from "sonner"
import { Coins, Lock, Unlock, AlertCircle } from "lucide-react"

export function CashSessionManager() {
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [opening, setOpening] = useState(false)
    const [closing, setClosing] = useState(false)

    const [montoInicial, setMontoInicial] = useState("")
    const [montoFinal, setMontoFinal] = useState("")
    const [observaciones, setObservaciones] = useState("")

    const fetchSession = useCallback(async () => {
        setLoading(true)
        const res = await getCurrentCashSession()
        if (res.success) {
            setSession(res.session)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchSession()
    }, [fetchSession])

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
            fetchSession()
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
            fetchSession()
        } else {
            toast.error(res.error)
        }
        setClosing(false)
    }

    if (loading) return <div>Cargando estado de caja...</div>

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Control de Caja
                    </CardTitle>
                    <CardDescription>
                        {session ? "Tienes un turno activo" : "No hay un turno de caja iniciado"}
                    </CardDescription>
                </div>
                {session ? (
                    <Unlock className="h-5 w-5 text-green-500" />
                ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent>
                {!session ? (
                    <div className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="monto-inicial">Monto Inicial (Efectivo)</Label>
                            <Input
                                id="monto-inicial"
                                type="number"
                                placeholder="Ej: 50000"
                                value={montoInicial}
                                onChange={(e) => setMontoInicial(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="obs">Observaciones (Opcional)</Label>
                            <Input
                                id="obs"
                                placeholder="Notas de apertura..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={handleOpen}
                            disabled={opening}
                        >
                            {opening ? "Abriendo..." : "Abrir Turno de Caja"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-4">
                        <div className="bg-muted p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Iniciado a las</p>
                                <p className="font-medium">{new Date(session.fecha_apertura).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Monto Inicial</p>
                                <p className="font-medium">${Number(session.monto_inicial).toLocaleString('es-CL')}</p>
                            </div>
                        </div>

                        <div className="grid gap-2 pt-2">
                            <Label htmlFor="monto-final">Efectivo Real en Caja (Conteo Final)</Label>
                            <Input
                                id="monto-final"
                                type="number"
                                placeholder="Ingrese cuánto dinero físico hay"
                                value={montoFinal}
                                onChange={(e) => setMontoFinal(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="obs-cierre">Notas de Cierre</Label>
                            <Input
                                id="obs-cierre"
                                placeholder="Novedades del turno..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleClose}
                            disabled={closing}
                        >
                            {closing ? "Cerrando..." : "Cerrar Turno / Realizar Arqueo"}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Al cerrar se registrarán las ventas acumuladas del periodo.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
