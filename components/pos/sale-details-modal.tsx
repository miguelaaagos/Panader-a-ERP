"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getSaleDetails } from "@/actions/sales"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    FileText,
    Calendar,
    User,
    CreditCard,
    Banknote,
    Landmark,
    Package,
    ArrowLeft,
    Tag,
    Info,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { toast } from "sonner"

interface SaleDetailsModalProps {
    saleId: string | null
    isOpen: boolean
    onClose: () => void
}

export function SaleDetailsModal({ saleId, isOpen, onClose }: SaleDetailsModalProps) {
    const [sale, setSale] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && saleId) {
            fetchDetails()
        } else {
            setSale(null)
        }
    }, [isOpen, saleId])

    const fetchDetails = async () => {
        if (!saleId) return
        setLoading(true)
        const result = await getSaleDetails(saleId)
        if (result.success) {
            setSale(result.data)
        } else {
            toast.error("Error al cargar detalles: " + result.error)
            console.error(result.error)
        }
        setLoading(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completada":
                return <Badge variant="outline" className="flex gap-1 border-green-500 text-green-600 bg-green-50"><CheckCircle2 className="h-3.5 w-3.5" /> Completada</Badge>
            case "anulada":
                return <Badge variant="outline" className="flex gap-1 border-red-500 text-red-600 bg-red-50"><XCircle className="h-3.5 w-3.5" /> Anulada</Badge>
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-mono flex items-center gap-2">
                                {sale?.numero_venta || "Cargando..."}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {sale ? format(new Date(sale.fecha), "eeee dd 'de' MMMM, yyyy - HH:mm", { locale: es }) : "..."}
                            </DialogDescription>
                        </div>
                        {sale && getStatusBadge(sale.estado)}
                    </div>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Package className="h-8 w-8 animate-pulse" />
                            <p>Obteniendo detalles de la venta...</p>
                        </div>
                    ) : sale ? (
                        <>
                            {/* Información General */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold">Cliente:</span>
                                        <span>{sale.cliente_nombre || "Público General"}</span>
                                    </div>
                                    {sale.cliente_rut && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold">RUT:</span>
                                            <span>{sale.cliente_rut}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            {getPaymentIcon(sale.metodo_pago)}
                                            <span>Método de Pago:</span>
                                        </div>
                                        <span className="capitalize">{sale.metodo_pago.replace("_", " ")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold">Atendido por:</span>
                                        <span>{sale.usuario?.nombre_completo || "Sistema"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detalles de Items */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    Productos Vendidos
                                </h3>
                                <div className="border rounded-md overflow-hidden">
                                    <div className="grid grid-cols-12 bg-muted/50 p-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="col-span-6">Producto</div>
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-2 text-right">Precio</div>
                                        <div className="col-span-2 text-right">Subtotal</div>
                                    </div>
                                    <ScrollArea className="max-h-[300px]">
                                        <div className="divide-y">
                                            {sale.detalles?.map((item: any) => (
                                                <div key={item.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/30 transition-colors">
                                                    <div className="col-span-6">
                                                        <div className="font-medium">{item.producto?.nombre}</div>
                                                        {item.producto?.codigo && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Cód: {item.producto.codigo}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 text-center font-mono">{item.cantidad}</div>
                                                    <div className="col-span-2 text-right font-mono">${Number(item.precio_unitario).toLocaleString("es-CL")}</div>
                                                    <div className="col-span-2 text-right font-bold font-mono">
                                                        ${Number(item.total).toLocaleString("es-CL")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>

                            {/* Resumen Final */}
                            <div className="flex flex-col items-end pt-2">
                                <div className="w-full md:w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-mono">${Number(sale.subtotal).toLocaleString("es-CL")}</span>
                                    </div>
                                    {Number(sale.descuento) > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Descuento Global:</span>
                                            <span className="font-mono">-${Number(sale.descuento).toLocaleString("es-CL")}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-primary font-mono">${Number(sale.total).toLocaleString("es-CL")}</span>
                                    </div>
                                </div>
                            </div>

                            {sale.notas && (
                                <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex gap-2">
                                    <Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <span className="font-bold">Notas: </span>
                                        {sale.notas}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-red-500 italic">
                            No se pudo cargar la información de la venta.
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t flex justify-end">
                    <Button onClick={onClose} variant="secondary">Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
