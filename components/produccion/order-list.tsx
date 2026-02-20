"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RoleGuard } from "@/components/auth/RoleGuard"

export type ProductionOrder = {
    id: string
    numero_orden: string
    created_at: string
    cantidad_a_producir: number
    estado: "pendiente" | "en_proceso" | "completada" | "cancelada"
    notas: string | null
    receta: { nombre: string, rendimiento: number, costo_total: number | null }
    producto: { nombre: string, unidad_medida: string }
    usuario: { nombre_completo: string }
}

interface OrderListProps {
    orders: ProductionOrder[]
    loading: boolean
    onComplete: (id: string) => void
    onCancel: (id: string) => void
    processingId: string | null
}

export function OrderList({ orders, loading, onComplete, onCancel, processingId }: OrderListProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pendiente":
                return <Badge variant="outline" className="flex w-fit gap-1 border-yellow-500 text-yellow-600"><Clock className="h-3 w-3" /> Pendiente</Badge>
            case "completada":
                return <Badge variant="outline" className="flex w-fit gap-1 border-green-500 text-green-600"><CheckCircle2 className="h-3 w-3" /> Completada</Badge>
            case "cancelada":
                return <Badge variant="outline" className="flex w-fit gap-1 border-red-500 text-red-600"><XCircle className="h-3 w-3" /> Cancelada</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando órdenes de producción...</div>
    }

    if (orders.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No se encontraron órdenes de producción.</div>
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>N° Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto / Receta</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.numero_orden}</TableCell>
                            <TableCell className="text-sm">
                                {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: es })}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{order.producto?.nombre}</span>
                                    <span className="text-muted-foreground text-xs">{order.receta?.nombre}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">
                                {order.cantidad_a_producir} {order.producto?.unidad_medida}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(order.estado)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {order.estado === "pendiente" && (
                                        <>
                                            <RoleGuard permission="production.manage">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                                    onClick={() => onCancel(order.id)}
                                                    disabled={processingId === order.id}
                                                >
                                                    {processingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancelar"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-green-600 hover:bg-green-700"
                                                    onClick={() => onComplete(order.id)}
                                                    disabled={processingId === order.id}
                                                >
                                                    {processingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Completar"}
                                                </Button>
                                            </RoleGuard>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
