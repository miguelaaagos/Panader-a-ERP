"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { registrarGasto, getCategoriasGastos } from "@/actions/gastos"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

export default function NuevoGastoPage() {
    const router = useRouter()
    const [categorias, setCategorias] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [descripcion, setDescripcion] = useState("")
    const [categoriaId, setCategoriaId] = useState<string>("none")
    const [tipoDocumento, setTipoDocumento] = useState<"Factura" | "Boleta" | "Recibo" | "Otro">("Boleta")
    const [montoTotal, setMontoTotal] = useState("")
    const [montoNeto, setMontoNeto] = useState(0)
    const [montoIva, setMontoIva] = useState(0)
    const [fechaGasto, setFechaGasto] = useState(new Date().toISOString().split("T")[0])

    useEffect(() => {
        const fetchCategorias = async () => {
            const result = await getCategoriasGastos()
            if (result.success && result.data) {
                setCategorias(result.data)
            }
            setLoading(false)
        }
        fetchCategorias()
    }, [])

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

        const reqData = {
            descripcion,
            categoria_id: categoriaId !== "none" ? categoriaId : undefined,
            monto_neto: parseFloat(montoNeto.toFixed(2)),
            monto_iva: parseFloat(montoIva.toFixed(2)),
            monto_total: numMonto,
            tipo_documento: tipoDocumento,
            fecha_gasto: new Date(fechaGasto || new Date().toISOString()).toISOString()
        }

        const res = await registrarGasto(reqData)

        if (res.success) {
            toast.success("Gasto registrado correctamente")
            router.push("/dashboard/gastos")
        } else {
            toast.error("Error al registrar: " + res.error)
            setSubmitting(false)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/dashboard/gastos">
                    <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Nuevo Gasto 💸</h2>
            </div>

            <Card className="border-primary/20 bg-muted/20">
                <CardHeader>
                    <CardTitle>Información del Gasto</CardTitle>
                    <CardDescription>Añade un nuevo gasto operativo o egreso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Descripción / Concepto</Label>
                        <Textarea
                            placeholder="Ej. Pago recibo eléctrico, Compra de insumos oficina..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="h-20"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoría de Gasto</Label>
                            <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loading ? "Cargando..." : "Selecciona..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Sin Especificar --</SelectItem>
                                    {categorias.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.nombre}
                                        </SelectItem>
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
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Boleta">Boleta</SelectItem>
                                    <SelectItem value="Factura">Factura (Calcula IVA Crédito 19%)</SelectItem>
                                    <SelectItem value="Recibo">Recibo / Vales</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Monto Total ($)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="Ej. 15000"
                                value={montoTotal}
                                onChange={(e) => handleMontoTotalChange(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Resumen de Cálculos IVA */}
                    <div className="bg-muted min-h-24 p-4 rounded-md flex flex-col items-end space-y-2">
                        <div className="flex justify-between w-full max-w-[200px]">
                            <span className="text-muted-foreground mr-4">Neto:</span>
                            <span className="font-medium">${montoNeto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        {tipoDocumento === "Factura" && (
                            <div className="flex justify-between w-full max-w-[200px]">
                                <span className="text-muted-foreground mr-4">IVA (19%):</span>
                                <span className="font-medium text-emerald-600">${montoIva.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between w-full max-w-[200px] border-t border-border pt-2 mt-2">
                            <span className="font-bold mr-4">Total:</span>
                            <span className="font-bold text-lg">${(parseFloat(montoTotal) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="border-t bg-muted/10 p-4">
                    <Button
                        className="w-full h-12 text-lg font-medium shadow-sm transition-all"
                        disabled={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando Registro...
                            </>
                        ) : (
                            "Registrar Gasto"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
