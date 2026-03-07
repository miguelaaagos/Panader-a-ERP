"use client"

import { useState, useEffect, useCallback } from "react"
import { getHistorialIngresos, anularIngreso } from "@/actions/ingresos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { RoleGuard } from "@/components/auth/RoleGuard"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IngresoDetalleDialog } from "@/components/inventario/ingreso-detalle-dialog"
import { Badge } from "@/components/ui/badge"

type IngresoRow = {
    id: string
    codigo: string | null
    observaciones: string | null
    created_at: string
    subtotal: number
    monto_iva: number
    total: number
    tipo_documento: string
    generar_gasto: boolean
    estado: string | null
    usuario: { nombre_completo: string } | null
    proveedor: { id: string; nombre: string } | null
}

export default function HistorialIngresosPage() {
    const [ingresos, setIngresos] = useState<IngresoRow[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIngreso, setSelectedIngreso] = useState<IngresoRow | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const fetchIngresos = useCallback(async () => {
        setLoading(true)
        const result = await getHistorialIngresos()
        if (result.success && result.data) {
            setIngresos(result.data as IngresoRow[])
        } else if (!result.success) {
            toast.error("Error al cargar el historial de compras: " + result.error)
        }
        setLoading(false)
    }, [])

    const handleAnular = async (ingreso: IngresoRow) => {
        if (!confirm(`¿Estás seguro que deseas ANULAR la compra #${ingreso.codigo}? Esta acción revertirá el stock ingresado y marcará el gasto asociado como anulado. No se puede deshacer.`)) return

        setLoading(true)
        const res = await anularIngreso(ingreso.id)
        if (res.success) {
            toast.success("Compra anulada exitosamente.")
            fetchIngresos()
        } else {
            toast.error(res.error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIngresos()
    }, [fetchIngresos])

    return (
        <RoleGuard
            permission="inventory.view"
            fallback={
                <div className="flex-1 flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground text-lg">No tienes permisos para acceder al historial de compras.</p>
                </div>
            }
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/inventario">
                                <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h2 className="text-3xl font-bold tracking-tight">Historial de Compras</h2>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">Registro de toda la mercancia y materias primas recibidas.</p>
                    </div>

                    <RoleGuard permission="inventory.restock">
                        <Link href="/dashboard/inventario/ingresos/nuevo">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nueva Compra
                            </Button>
                        </Link>
                    </RoleGuard>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Compras Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : ingresos.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No hay compras registradas aun.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <div className="grid grid-cols-4 md:grid-cols-8 p-4 bg-muted/50 font-medium text-sm border-b gap-4">
                                    <div>Codigo</div>
                                    <div>Estado</div>
                                    <div>Fecha</div>
                                    <div className="hidden md:block">Usuario</div>
                                    <div className="hidden md:block">Proveedor</div>
                                    <div className="text-right hidden md:block">Total</div>
                                    <div className="hidden md:block">Observaciones</div>
                                    <div className="text-center">Acciones</div>
                                </div>
                                <div className="divide-y">
                                    {ingresos.map((ingreso) => (
                                        <div key={ingreso.id} className={`grid grid-cols-4 md:grid-cols-8 p-4 text-sm items-center hover:bg-muted/30 transition-colors gap-4 ${ingreso.estado === 'anulada' ? 'opacity-60 bg-muted/20' : ''}`}>
                                            <div className={`font-medium text-primary ${ingreso.estado === 'anulada' ? 'line-through' : ''}`}>{ingreso.codigo}</div>
                                            <div>
                                                <Badge variant={ingreso.estado === 'anulada' ? 'destructive' : 'outline'} className={ingreso.estado === 'anulada' ? '' : 'border-emerald-500 text-emerald-600'}>
                                                    {ingreso.estado === 'anulada' ? 'Anulada' : 'Completada'}
                                                </Badge>
                                            </div>
                                            <div className="whitespace-nowrap">
                                                {format(new Date(ingreso.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                            </div>
                                            <div className="hidden md:block truncate">
                                                {ingreso.usuario?.nombre_completo || "Desconocido"}
                                            </div>
                                            <div className="hidden md:block truncate text-muted-foreground">
                                                {ingreso.proveedor?.nombre || "-"}
                                            </div>
                                            <div className="text-right hidden md:block font-medium">
                                                {ingreso.total > 0 ? `$${ingreso.total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}` : "-"}
                                            </div>
                                            <div className="hidden md:block truncate text-muted-foreground" title={ingreso.observaciones}>
                                                {ingreso.observaciones || "-"}
                                            </div>
                                            <div className="flex justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedIngreso(ingreso)
                                                        setIsDetailOpen(true)
                                                    }}
                                                    title="Ver Detalles"
                                                >
                                                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleAnular(ingreso)}
                                                    title="Anular Compra"
                                                    disabled={ingreso.estado === 'anulada'}
                                                    className="text-destructive hover:bg-destructive/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <IngresoDetalleDialog
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    ingreso={selectedIngreso}
                />
            </div>
        </RoleGuard>
    )
}
