"use client"

import { useState, useEffect } from "react"
import { updateGasto, getCategoriasGastos } from "@/actions/gastos"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

interface GastoEditarDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    gasto: unknown | null
    onEdited: () => void
}

export function GastoEditarDialog({ open, onOpenChange, gasto, onEdited }: GastoEditarDialogProps) {
    const [categorias, setCategorias] = useState<any[]>([])
    const [loadingCats, setLoadingCats] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [descripcion, setDescripcion] = useState("")
    const [categoriaId, setCategoriaId] = useState<string>("none")
    const [tipoDocumento, setTipoDocumento] = useState<"Factura" | "Boleta" | "Recibo" | "Otro">("Boleta")
    const [tipoGasto, setTipoGasto] = useState<"fijo" | "variable">("variable")
    const [montoTotal, setMontoTotal] = useState("")
    const [montoNeto, setMontoNeto] = useState(0)
    const [montoIva, setMontoIva] = useState(0)
    const [fechaGasto, setFechaGasto] = useState("")

    useEffect(() => {
        if (open) {
            setLoadingCats(true)
            getCategoriasGastos().then(res => {
                if (res.success && res.data) setCategorias(res.data)
                setLoadingCats(false)
            })

            if (gasto) {
                setDescripcion(gasto.descripcion || "")
                // Handle different ways category might be populated
                const catId = gasto.categoria?.id || gasto.categoria_id || "none"
                setCategoriaId(catId)

                setTipoDocumento((gasto.tipo_documento as unknown) || "Boleta")
                setTipoGasto((gasto.tipo_gasto as unknown) || "variable")
                setMontoTotal(gasto.monto_total?.toString() || "")
                setMontoNeto(gasto.monto_neto || 0)
                setMontoIva(gasto.monto_iva || 0)
                setFechaGasto(gasto.fecha_gasto ? format(new Date(gasto.fecha_gasto), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
            }
        }
    }, [open, gasto])

    const handleMontoTotalChange = (val: string) => {
        setMontoTotal(val)
        const numVal = parseFloat(val)
        if (isNaN(numVal) || numVal < 0) {
            setMontoNeto(0)
            setMontoIva(0)
            return
        }
        if (tipoDocumento === "Factura") {
            const neto = numVal / 1.19
            setMontoNeto(neto)
            setMontoIva(numVal - neto)
        } else {
            setMontoNeto(numVal)
            setMontoIva(0)
        }
    }

    const handleTipoDocChange = (val: "Factura" | "Boleta" | "Recibo" | "Otro") => {
        setTipoDocumento(val)
        const numVal = parseFloat(montoTotal)
        if (!isNaN(numVal) && numVal >= 0) {
            if (val === "Factura") {
                const neto = numVal / 1.19
                setMontoNeto(neto)
                setMontoIva(numVal - neto)
            } else {
                setMontoNeto(numVal)
                setMontoIva(0)
            }
        }
    }

    const handleSubmit = async () => {
        if (!gasto) return
        if (!descripcion || !montoTotal) {
            toast.error("Descripción y Monto Total son obligatorios")
            return
        }

        const numMonto = parseFloat(montoTotal)
        if (isNaN(numMonto) || numMonto < 0) {
            toast.error("Monto total inválido")
            return
        }

        setSubmitting(true)
        try {
            // Find real category ID
            let finalCatId = categoriaId !== "none" ? categoriaId : undefined
            // Si el select no cambió y recibimos obj categoria, intentar matchear el id
            if (categoriaId === "none" && gasto.categoria?.id) {
                finalCatId = gasto.categoria.id;
            } else if (categoriaId === "none" && gasto.categoria_id) {
                finalCatId = gasto.categoria_id;
            }

            const reqData = {
                descripcion,
                categoria_id: finalCatId,
                monto_neto: parseFloat(montoNeto.toFixed(2)),
                monto_iva: parseFloat(montoIva.toFixed(2)),
                monto_total: numMonto,
                tipo_documento: tipoDocumento,
                tipo_gasto: tipoGasto,
                fecha_gasto: new Date(fechaGasto).toISOString()
            }

            const res = await updateGasto(gasto.id, reqData)
            if (res.success) {
                toast.success("Gasto actualizado correctamente")
                onEdited()
                onOpenChange(false)
            } else {
                toast.error("Error al actualizar: " + res.error)
            }
        } catch (error: unknown) {
            toast.error("Ocurrió un error inesperado al guardar")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Gasto</DialogTitle>
                    <DialogDescription>Modifica los datos del gasto. Esta acción quedará registrada en el sistema.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descripción / Concepto</Label>
                        <Textarea
                            placeholder="Ej. Pago recibo eléctrico..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoría de Gasto</Label>
                            <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loadingCats}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingCats ? "Cargando..." : (gasto?.categoria?.nombre || "Selecciona...")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Sin Especificar --</SelectItem>
                                    {categorias.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha del Gasto</Label>
                            <Input
                                type="date"
                                value={fechaGasto}
                                onChange={(e) => setFechaGasto(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Documento</Label>
                            <Select value={tipoDocumento} onValueChange={handleTipoDocChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Boleta">Boleta</SelectItem>
                                    <SelectItem value="Factura">Factura (Calcula IVA Crédito 19%)</SelectItem>
                                    <SelectItem value="Recibo">Recibo / Vales</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Gasto</Label>
                            <Select value={tipoGasto} onValueChange={(val: unknown) => setTipoGasto(val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="variable">Gasto Variable</SelectItem>
                                    <SelectItem value="fijo">Costo Fijo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Monto Total ($)</Label>
                            <Input
                                type="number" step="any"
                                value={montoTotal}
                                onChange={(e) => handleMontoTotalChange(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
