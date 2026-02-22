"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProducts } from "@/actions/inventory"
import { registrarIngresoInventario } from "@/actions/ingresos"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import { convertToDisplayUnit, calculateBaseCost, AppUnit } from "@/lib/utils/inventory-units"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface SelectedItem {
    id: string
    producto_id: string
    nombre: string
    baseUnit: string
    enteredUnit: string
    cantidad: string
    costoTotal: string
}

export default function NuevoIngresoPage() {
    const router = useRouter()
    const [productos, setProductos] = useState<any[]>([])
    const [items, setItems] = useState<SelectedItem[]>([])
    const [observaciones, setObservaciones] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form inputs temporales
    const [selectedProductId, setSelectedProductId] = useState("")
    const [currentUnit, setCurrentUnit] = useState<string>("")
    const [currentCantidad, setCurrentCantidad] = useState("")
    const [currentCosto, setCurrentCosto] = useState("")
    const [tipoDocumento, setTipoDocumento] = useState<"Factura" | "Boleta" | "Otro">("Factura")
    const [generarGasto, setGenerarGasto] = useState(true)

    useEffect(() => {
        const fetchProductos = async () => {
            setLoading(true)
            const result = await getProducts()
            if (result.success && result.data) {
                setProductos(result.data)
            }
            setLoading(false)
        }
        fetchProductos()
    }, [])

    const handleProductSelect = (id: string) => {
        const prod = productos.find(p => p.id === id)
        if (prod) {
            setSelectedProductId(prod.id)
            setCurrentUnit(prod.unidad_medida)
            setCurrentCantidad("")
            setCurrentCosto("")
        }
    }

    const handleCantidadChange = (val: string) => {
        let newCantidad = val;
        if (currentUnit === "unidades") {
            const intVal = parseInt(val, 10);
            newCantidad = isNaN(intVal) ? "" : intVal.toString();
        }
        setCurrentCantidad(newCantidad);

        // Auto-calcular costo
        const prod = productos.find(p => p.id === selectedProductId);
        if (prod && newCantidad && !isNaN(parseFloat(newCantidad))) {
            const numCantidad = parseFloat(newCantidad);
            const cantidadBase = convertToDisplayUnit(numCantidad, currentUnit as AppUnit, prod.unidad_medida as AppUnit);
            const costoBase = prod.costo_unitario || 0;
            const costoTotalCalc = cantidadBase * costoBase;
            setCurrentCosto(costoTotalCalc.toFixed(2));
        } else {
            setCurrentCosto("");
        }
    }

    const getUnitOptions = (baseUnit: string) => {
        if (baseUnit === "kg" || baseUnit === "g") return ["kg", "g"]
        if (baseUnit === "L" || baseUnit === "ml") return ["L", "ml"]
        return ["unidades"]
    }

    const addItem = () => {
        if (!selectedProductId || !currentCantidad || !currentCosto) {
            toast.error("Completa todos los campos del producto")
            return
        }

        const prod = productos.find(p => p.id === selectedProductId)
        if (!prod) return

        if (currentUnit === "unidades" && currentCantidad.includes(".")) {
            toast.error("Para 'unidades' no se permiten decimales")
            return
        }

        const numCantidad = parseFloat(currentCantidad)
        const numCosto = parseFloat(currentCosto)

        if (numCantidad <= 0) {
            toast.error("La cantidad debe ser mayor a 0")
            return
        }
        if (numCosto < 0) {
            toast.error("El costo total no puede ser negativo")
            return
        }

        const newItem: SelectedItem = {
            id: Math.random().toString(36).substring(7),
            producto_id: selectedProductId,
            nombre: prod.nombre,
            baseUnit: prod.unidad_medida,
            enteredUnit: currentUnit,
            cantidad: currentCantidad,
            costoTotal: currentCosto
        }

        setItems([...items, newItem])

        // Limpiar
        setSelectedProductId("")
        setCurrentCantidad("")
        setCurrentCosto("")
        setCurrentUnit("")
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error("Debes agregar al menos un ítem al ingreso")
            return
        }

        const confirmacion = window.confirm(`¿Estás seguro de registrar el ingreso de ${items.length} productos al inventario?`)
        if (!confirmacion) return

        setSubmitting(true)

        // Convertir items a tipo de BD
        const detalles = items.map(item => {
            const numCantidad = parseFloat(item.cantidad)
            const numCostoTotal = parseFloat(item.costoTotal)

            // Cantidad en unidad base
            const cantidadBase = convertToDisplayUnit(
                numCantidad,
                item.enteredUnit as AppUnit,
                item.baseUnit as AppUnit
            )

            // Costo unitario en base a la unidad base
            const costoUnitarioBase = calculateBaseCost(
                numCostoTotal,
                numCantidad,
                item.enteredUnit as AppUnit,
                item.baseUnit as AppUnit
            )

            return {
                producto_id: item.producto_id,
                cantidad: cantidadBase, // Enviamos en KG o L
                costo_unitario: costoUnitarioBase // Enviamos el costo unitario real
            }
        })

        const subtotal = items.reduce((acc, item) => acc + parseFloat(item.costoTotal), 0)
        const monto_iva = tipoDocumento === "Factura" ? subtotal * 0.19 : 0
        const total = subtotal + monto_iva

        const reqData = {
            detalles,
            observaciones,
            subtotal,
            monto_iva,
            total,
            tipo_documento: tipoDocumento,
            generar_gasto: generarGasto
        }

        const res = await registrarIngresoInventario(reqData)

        if (res.success) {
            toast.success("Ingreso registrado correctamente")
            router.push("/dashboard/inventario/ingresos")
        } else {
            toast.error("Error al registrar: " + res.error)
            setSubmitting(false)
        }
    }

    const subtotal = items.reduce((acc, item) => acc + parseFloat(item.costoTotal), 0)
    const monto_iva = tipoDocumento === "Factura" ? subtotal * 0.19 : 0
    const total = subtotal + monto_iva

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/dashboard/inventario/ingresos">
                    <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Nuevo Ingreso 📥</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-1 border-primary/20 bg-muted/20 h-fit">
                    <CardHeader>
                        <CardTitle>Agregar Producto</CardTitle>
                        <CardDescription>Selecciona un producto y sus detalles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Producto a Ingresar</Label>
                            <Select value={selectedProductId} onValueChange={handleProductSelect} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loading ? "Cargando..." : "Selecciona..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {productos.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.nombre} ({p.unidad_medida})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedProductId && (
                            <>
                                <div className="space-y-2">
                                    <Label>Unidad de Medida (Ingresada)</Label>
                                    <Select value={currentUnit} onValueChange={(val) => setCurrentUnit(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getUnitOptions(productos.find(p => p.id === selectedProductId)?.unidad_medida || "").map(u => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cantidad (en {currentUnit})</Label>
                                    <Input
                                        type="number"
                                        step={currentUnit === "unidades" ? "1" : "0.01"}
                                        placeholder="Ej. 10"
                                        value={currentCantidad}
                                        onChange={(e) => handleCantidadChange(e.target.value)}
                                        min="0"
                                    />
                                    <p className="text-[10px] text-muted-foreground">La conversión a unidad base es automática.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Costo Total (Monto pagado)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 5000"
                                        value={currentCosto}
                                        onChange={(e) => setCurrentCosto(e.target.value)}
                                        min="0"
                                    />
                                </div>

                                <Button className="w-full mt-2" onClick={addItem} variant="secondary">
                                    <Plus className="mr-2 h-4 w-4" /> Agregar a la lista
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Listado de Ingreso</CardTitle>
                        <CardDescription>Ítems que serán sumados al inventario</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {items.length === 0 ? (
                            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-md bg-muted/10">
                                <p className="text-muted-foreground text-sm">No has agregado productos a la lista</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md group hover:border-primary/50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {idx + 1}. {item.nombre}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Ingresando {item.cantidad} {item.enteredUnit} por ${parseFloat(item.costoTotal).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="pt-4 border-t mt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tipo de Documento</Label>
                                            <Select value={tipoDocumento} onValueChange={(v: "Factura" | "Boleta" | "Otro") => setTipoDocumento(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Factura">Factura (Cálculo 19% IVA)</SelectItem>
                                                    <SelectItem value="Boleta">Boleta</SelectItem>
                                                    <SelectItem value="Otro">Otro (Vale / Recibo)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Observaciones (Opcional)</Label>
                                            <Textarea
                                                placeholder="Ej. Factura #1234, recepción incompleta, etc."
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                className="h-10 min-h-10 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 border border-border p-3 rounded-md bg-background/50">
                                        <Switch
                                            id="generar-gasto"
                                            checked={generarGasto}
                                            onCheckedChange={setGenerarGasto}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="generar-gasto" className="text-sm font-medium">Automaticar Gasto</Label>
                                            <p className="text-[10px] text-muted-foreground">Genera un registro automático en Gastos Operativos</p>
                                        </div>
                                    </div>

                                    {/* Resumen de Total e IVA */}
                                    <div className="bg-muted min-h-24 p-4 rounded-md flex flex-col items-end space-y-2">
                                        <div className="flex justify-between w-full max-w-[200px]">
                                            <span className="text-muted-foreground mr-4">Subtotal Neto:</span>
                                            <span className="font-medium">${subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        {tipoDocumento === "Factura" && (
                                            <div className="flex justify-between w-full max-w-[200px]">
                                                <span className="text-muted-foreground mr-4">IVA (19%):</span>
                                                <span className="font-medium text-emerald-600">${monto_iva.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between w-full max-w-[200px] border-t border-border pt-2 mt-2">
                                            <span className="font-bold mr-4">Total:</span>
                                            <span className="font-bold text-lg">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t bg-muted/10 p-4">
                        <Button
                            className="w-full h-12 text-lg font-medium shadow-sm transition-all"
                            disabled={items.length === 0 || submitting}
                            onClick={handleSubmit}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando Ingreso Múltiple...
                                </>
                            ) : (
                                "Guardar Ingreso de Inventario"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
