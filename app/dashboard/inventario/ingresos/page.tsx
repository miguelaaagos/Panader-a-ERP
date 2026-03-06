"use client"

import { useState, useEffect, useCallback } from "react"
import { getHistorialIngresos } from "@/actions/ingresos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { RoleGuard } from "@/components/auth/RoleGuard"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function HistorialIngresosPage() {
    const [ingresos, setIngresos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchIngresos = useCallback(async () => {
        setLoading(true)
        const result = await getHistorialIngresos()
        if (result.success && result.data) {
            setIngresos(result.data)
        } else if (!result.success) {
            toast.error("Error al cargar el historial de compras: " + result.error)
        }
        setLoading(false)
    }, [])

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
                                <div className="grid grid-cols-4 md:grid-cols-6 p-4 bg-muted/50 font-medium text-sm border-b">
                                    <div>Codigo</div>
                                    <div>Fecha</div>
                                    <div className="hidden md:block">Usuario</div>
                                    <div className="hidden md:block">Proveedor</div>
                                    <div className="text-right hidden md:block">Total</div>
                                    <div>Observaciones</div>
                                </div>
                                <div className="divide-y">
                                    {ingresos.map((ingreso) => (
                                        <div key={ingreso.id} className="grid grid-cols-4 md:grid-cols-6 p-4 text-sm items-center hover:bg-muted/30 transition-colors">
                                            <div className="font-medium text-primary">{ingreso.codigo}</div>
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
                                            <div className="truncate text-muted-foreground" title={ingreso.observaciones}>
                                                {ingreso.observaciones || "-"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    )
}
