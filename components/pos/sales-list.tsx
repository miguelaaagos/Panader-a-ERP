"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Eye,
    XCircle,
    CheckCircle2,
    Clock,
    Loader2,
    Calendar,
    User as UserIcon,
    CreditCard,
    Banknote,
    Landmark
} from "lucide-react"
import { RoleGuard } from "@/components/auth/RoleGuard"

interface Sale {
    id: string
    numero_venta: string
    fecha: string
    cliente_nombre?: string | null
    cliente_rut?: string | null
    metodo_pago: string
    total: number
    estado: string
    usuario?: {
        nombre_completo: string
    } | null
}

interface SalesListProps {
    sales: Sale[]
    loading: boolean
    onAnular: (id: string) => void
    onView?: (id: string) => void
    processingId: string | null
}

export function SalesList({ sales, loading, onAnular, onView, processingId }: SalesListProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completada":
                return <Badge variant="outline" className="flex w-fit gap-1 border-green-500 text-green-600"><CheckCircle2 className="h-3 w-3" /> Completada</Badge>
            case "anulada":
                return <Badge variant="outline" className="flex w-fit gap-1 border-red-500 text-red-600"><XCircle className="h-3 w-3" /> Anulada</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "efectivo": return <Banknote className="h-4 w-4 text-emerald-600" />
            case "tarjeta_debito":
            case "tarjeta_credito": return <CreditCard className="h-4 w-4 text-blue-600" />
            case "transferencia": return <Landmark className="h-4 w-4 text-purple-600" />
            default: return null
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando historial de ventas...</div>
    }

    if (sales.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No se encontraron ventas registradas.</div>
    }

    return (
        <div className="border rounded-lg bg-background overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead>N° Venta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                        <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                        <TableHead className="hidden md:table-cell">Pago</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden sm:table-cell">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => (
                        <TableRow key={sale.id}>
                            <TableCell className="font-mono text-xs font-bold">{sale.numero_venta}</TableCell>
                            <TableCell className="text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {format(new Date(sale.fecha), "dd MMM, HH:mm", { locale: es })}
                                    </div>
                                    <span className="sm:hidden text-xs text-muted-foreground capitalize">
                                        {sale.metodo_pago.replace("_", " ")}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{sale.cliente_nombre || "Cliente General"}</span>
                                    {sale.cliente_rut && <span className="text-xs text-muted-foreground">{sale.cliente_rut}</span>}
                                </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                    {sale.usuario?.nombre_completo || "Sistema"}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2 text-xs font-medium capitalize bg-muted/50 px-2 py-1 rounded-md w-fit">
                                    {getPaymentIcon(sale.metodo_pago)}
                                    {sale.metodo_pago.replace("_", " ")}
                                </div>
                            </TableCell>
                            <TableCell className="font-bold text-sm">
                                ${sale.total.toLocaleString("es-CL")}
                                {sale.estado === "anulada" && (
                                    <span className="block sm:hidden text-[10px] text-red-500 font-normal">Anulada</span>
                                )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                {getStatusBadge(sale.estado)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => onView && onView(sale.id)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>

                                    {sale.estado === "completada" && (
                                        <RoleGuard permission="sales.annul">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => onAnular(sale.id)}
                                                disabled={processingId === sale.id}
                                            >
                                                {processingId === sale.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </RoleGuard>
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
