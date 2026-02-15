"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, Plus, Activity, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { getProductionOrders, completeProductionOrder, cancelProductionOrder } from "@/actions/production"
import { OrderList, ProductionOrder } from "@/components/produccion/order-list"
import { OrderFormDialog } from "@/components/produccion/order-form-dialog"

export default function ProduccionPage() {
    const [orders, setOrders] = useState<ProductionOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        const result = await getProductionOrders()
        if (result.success) {
            setOrders(result.data || [])
        } else {
            toast.error("Error al cargar órdenes: " + result.error)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const handleComplete = async (id: string) => {
        if (!confirm("¿Confirmas que se han utilizado los ingredientes y se ha terminado la producción?")) return

        setProcessingId(id)
        const result = await completeProductionOrder(id)
        if (result.success) {
            toast.success("Producción completada e inventario actualizado")
            fetchOrders()
        } else {
            toast.error("Error: " + result.error)
        }
        setProcessingId(null)
    }

    const handleCancel = async (id: string) => {
        if (!confirm("¿Estás seguro de cancelar esta orden?")) return

        setProcessingId(id)
        const result = await cancelProductionOrder(id)
        if (result.success) {
            toast.success("Orden cancelada")
            fetchOrders()
        } else {
            toast.error("Error: " + result.error)
        }
        setProcessingId(null)
    }

    const pendingOrders = orders.filter(o => o.estado === "pendiente").length
    const completedToday = orders.filter(o =>
        o.estado === "completada" &&
        new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length

    return (
        <RoleGuard
            permission="production.view"
            fallback={
                <div className="flex-1 flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground text-lg">No tienes permisos para acceder a Producción.</p>
                </div>
            }
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Producción ⚙️</h2>
                    <RoleGuard permission="production.manage">
                        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                        </Button>
                    </RoleGuard>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingOrders}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedToday}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estado de Cocina</CardTitle>
                            <Activity className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground"> {pendingOrders > 0 ? "En labor" : "Sin actividad"}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Historial de Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <OrderList
                            orders={orders}
                            loading={loading}
                            onComplete={handleComplete}
                            onCancel={handleCancel}
                            processingId={processingId}
                        />
                    </CardContent>
                </Card>

                <OrderFormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={fetchOrders}
                />
            </div>
        </RoleGuard>
    )
}
