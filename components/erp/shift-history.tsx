"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, History, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getPastCashSessions } from "@/actions/cash"
import { toast } from "sonner"
import { ShiftDetailsModal } from "./shift-details-modal"

interface PastSession {
    id: string
    fecha_apertura: string
    fecha_cierre: string
    monto_inicial: number
    monto_final_real: number
    estado: string
    observaciones: string | null
    usuarios?: { nombre_completo: string } | null
}

export function ShiftHistory() {
    const [sessions, setSessions] = useState<PastSession[]>([])
    const [loading, setLoading] = useState(true)
    const [limit, setLimit] = useState(5)

    const [selectedSession, setSelectedSession] = useState<PastSession | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchSessions = useCallback(async (currentLimit: number) => {
        setLoading(true)
        const res = await getPastCashSessions(currentLimit)
        if (res.success && res.sessions) {
            setSessions(res.sessions as PastSession[])
        } else {
            toast.error("Error al cargar el historial de turnos")
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchSessions(limit)
    }, [fetchSessions, limit])

    const handleViewMore = () => {
        setLimit(20)
    }

    const handleOpenDetails = (sess: PastSession) => {
        setSelectedSession(sess)
        setIsModalOpen(true)
    }

    if (loading && sessions.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (sessions.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <History className="h-12 w-12 mb-4 opacity-20" />
                    <p>No hay turnos anteriores registrados</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Turnos Anteriores
                </h3>
                <Button variant="secondary" size="sm" onClick={() => fetchSessions(limit)} disabled={loading} className="text-xs">
                    Actualizar
                </Button>
            </div>

            <div className="space-y-3">
                {sessions.map((sess) => (
                    <Card key={sess.id} className="overflow-hidden hover:border-primary/30 transition-colors group">
                        <CardContent className="p-0">
                            <div className="flex items-center p-4 gap-4">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Calendar className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-bold text-sm truncate">
                                            {format(new Date(sess.fecha_apertura), "PPP", { locale: es })}
                                        </p>
                                        <p className="text-xs font-mono text-muted-foreground">
                                            ID: {sess.id.slice(0, 8)}
                                        </p>
                                    </div>
                                    {sess.usuarios?.nombre_completo && (
                                        <p className="text-sm text-muted-foreground mb-1">
                                            👤 {sess.usuarios.nombre_completo}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            Abierto: {format(new Date(sess.fecha_apertura), "HH:mm")}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            Cerrado: {sess.fecha_cierre ? format(new Date(sess.fecha_cierre), "HH:mm") : '--:--'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="flex items-center gap-1 justify-end text-sm font-black">
                                        <span className="text-primary">${sess.monto_final_real?.toLocaleString("es-CL") || "0"}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                        Monto Final
                                    </p>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shrink-0"
                                    onClick={() => handleOpenDetails(sess)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>

                            {sess.observaciones && (
                                <div className="px-4 pb-3 pt-0">
                                    <div className="bg-muted/50 rounded p-2 text-[10px] italic text-muted-foreground border-l-2 border-muted">
                                        "{sess.observaciones}"
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {limit === 5 && sessions.length === 5 && (
                <Button
                    variant="outline"
                    className="w-full text-xs font-bold text-muted-foreground hover:text-foreground"
                    onClick={handleViewMore}
                >
                    VER HISTORIAL COMPLETO
                </Button>
            )}

            <ShiftDetailsModal
                session={selectedSession}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
