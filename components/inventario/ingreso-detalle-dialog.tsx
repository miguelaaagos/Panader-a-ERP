"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDetallesIngreso } from "@/actions/ingresos"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Package, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Ingreso {
    id: string
    codigo: string
    observaciones: string | null
    created_at: string
    subtotal: number
    monto_iva: number
    total: number
    tipo_documento: string
    generar_gasto: boolean
    usuario: { nombre_completo: string } | null
    proveedor: { id: string; nombre: string } | null
}

interface IngresoDetalleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ingreso: Ingreso | null
}

export function IngresoDetalleDialog({
    open,
    onOpenChange,
    ingreso
}: IngresoDetalleDialogProps) {
    const [detalles, setDetalles] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open && ingreso) {
            fetchDetalles(ingreso.id)
        } else {
            setDetalles([])
            setError(null)
        }
    }, [open, ingreso])

    const fetchDetalles = async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            const result = await getDetallesIngreso(id)
            if (result.success && result.data) {
                setDetalles(result.data)
            } else {
                setError(result.error || "No se pudieron cargar los detalles")
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado"
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (!ingreso) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-2">
                    <div className="flex items-center justify-between mt-2">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Receipt className="h-5 w-5" />
                            Detalle de Compra {ingreso.codigo ? `#${ingreso.codigo}` : ""}
                        </DialogTitle>
                        <Badge variant="outline" className="text-sm font-normal">
                            {new Date(ingreso.created_at).toLocaleDateString("es-CL", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Badge>
                    </div>
                    <DialogDescription>
                        Registrado por {ingreso.usuario?.nombre_completo || "Usuario Desconocido"}
                    </DialogDescription>
                </DialogHeader>

                {/* Metadata principal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/40 mb-4">
                    <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">Documento</p>
                        <div className="font-medium">{ingreso.tipo_documento}</div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">Proveedor</p>
                        <div className="font-medium">{ingreso.proveedor?.nombre || "Sin proveedor"}</div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">Estado Gasto</p>
                        <div className="font-medium">
                            {ingreso.generar_gasto ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-transparent text-xs">Generado</Badge>
                            ) : (
                                <span className="text-muted-foreground">No Aplica</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">Monto Total</p>
                        <div className="font-bold text-lg">${ingreso.total?.toLocaleString("es-CL")}</div>
                    </div>
                </div>

                {ingreso.observaciones && (
                    <div className="mb-4 text-sm border-l-2 border-primary/50 pl-3 py-1 bg-muted/20">
                        <p className="text-muted-foreground font-medium mb-1 shrink-0">Observaciones:</p>
                        <p className="text-foreground/90 whitespace-pre-wrap">{ingreso.observaciones}</p>
                    </div>
                )}

                {/* Tabla de ítems */}
                <div className="border rounded-md">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[40%]">Producto</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo Unit.</TableHead>
                                <TableHead className="text-right font-medium">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Cargando productos...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-destructive">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : detalles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No hay productos registrados en esta compra.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                detalles.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.producto?.nombre}</span>
                                                <span className="text-xs text-muted-foreground uppercase opacity-80 flex items-center gap-1">
                                                    <Package className="h-3 w-3" />
                                                    {item.producto?.codigo || "S/C"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.cantidad} <span className="text-muted-foreground text-xs">{item.producto?.unidad_medida}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${item.costo_unitario?.toLocaleString("es-CL", { maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${(item.cantidad * item.costo_unitario).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Resumen Totales */}
                <div className="mt-4 flex flex-col items-end gap-1 text-sm">
                    {ingreso.tipo_documento === "Factura" ? (
                        <>
                            <div className="flex justify-between w-full max-w-[200px] text-muted-foreground">
                                <span>Subtotal Neto:</span>
                                <span>${ingreso.subtotal?.toLocaleString("es-CL")}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[200px] text-muted-foreground">
                                <span>IVA (19%):</span>
                                <span>${ingreso.monto_iva?.toLocaleString("es-CL")}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[200px] font-bold text-base border-t mt-1 pt-1">
                                <span>Total:</span>
                                <span>${ingreso.total?.toLocaleString("es-CL")}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-between w-full max-w-[200px] font-bold text-base bg-muted px-3 py-2 rounded-md">
                            <span>Total Pagado:</span>
                            <span>${ingreso.total?.toLocaleString("es-CL")}</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
