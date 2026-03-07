"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProducts } from "@/actions/inventory"
import { registrarIngresoInventario } from "@/actions/ingresos"
import { getProveedores, crearProveedor, getUltimoPrecioProducto } from "@/actions/proveedores"
import type { Proveedor, UltimoPrecioProducto } from "@/actions/proveedores"
import { ProductFormDialog } from "@/components/inventario/product-form-dialog"
import { ProveedorFormDialog } from "@/components/inventario/proveedor-form-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, ArrowLeft, Building2, X, Pencil } from "lucide-react"
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
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
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

    // Proveedor
    const [selectedProveedorId, setSelectedProveedorId] = useState("")
    const [showNuevoProveedor, setShowNuevoProveedor] = useState(false)
    const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState("")
    const [nuevoProveedorContacto, setNuevoProveedorContacto] = useState("")
    const [creandoProveedor, setCreandoProveedor] = useState(false)

    // Hint último precio
    const [ultimoPrecio, setUltimoPrecio] = useState<UltimoPrecioProducto | null>(null)
    const [loadingPrecio, setLoadingPrecio] = useState(false)

    // Nuevo producto inline
    const [productFormOpen, setProductFormOpen] = useState(false)
    const [editProveedorOpen, setEditProveedorOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const [prodResult, provResult] = await Promise.all([
                getProducts(),
                getProveedores()
            ])
            if (prodResult.success && prodResult.data) setProductos(prodResult.data)
            if (provResult.success && provResult.data) setProveedores(provResult.data)
            setLoading(false)
        }
        fetchData()
    }, [])

    const refreshProductos = async () => {
        const result = await getProducts()
        if (result.success && result.data) setProductos(result.data)
    }

    const refreshProveedores = async () => {
        const result = await getProveedores()
        if (result.success && result.data) setProveedores(result.data)
    }

    const handleProductSelect = async (id: string) => {
        const prod = productos.find(p => p.id === id)
        if (prod) {
            setSelectedProductId(prod.id)
            setCurrentUnit(prod.unidad_medida)
            setCurrentCantidad("")
            setCurrentCosto("")
            setUltimoPrecio(null)

            // Buscar último precio
            setLoadingPrecio(true)
            const result = await getUltimoPrecioProducto(prod.id)
            if (result.success && result.data) {
                setUltimoPrecio(result.data)
                // Pre-llenar costo si hay cantidad ingresada (no pre-llenamos aún porque cantidad está vacía)
            }
            setLoadingPrecio(false)
        }
    }

    const handleCantidadChange = (val: string) => {
        let newCantidad = val;
        if (currentUnit === "unidades") {
            const intVal = parseInt(val, 10);
            newCantidad = isNaN(intVal) ? "" : intVal.toString();
        }
        setCurrentCantidad(newCantidad);

        const prod = productos.find(p => p.id === selectedProductId);
        if (prod && newCantidad && !isNaN(parseFloat(newCantidad))) {
            const numCantidad = parseFloat(newCantidad);
            const cantidadBase = convertToDisplayUnit(numCantidad, currentUnit as AppUnit, prod.unidad_medida as AppUnit);

            // Si hay último precio, usarlo para auto-calcular; sino usar costo actual del producto
            const costoBase = ultimoPrecio?.costo_unitario ?? (prod.costo_unitario || 0);
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
        setSelectedProductId("")
        setCurrentCantidad("")
        setCurrentCosto("")
        setCurrentUnit("")
        setUltimoPrecio(null)
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const handleCrearProveedor = async () => {
        if (!nuevoProveedorNombre.trim()) {
            toast.error("Ingresa el nombre del proveedor")
            return
        }
        setCreandoProveedor(true)
        const result = await crearProveedor(nuevoProveedorNombre.trim(), nuevoProveedorContacto.trim() || undefined)
        if (result.success && result.data) {
            await refreshProveedores()
            setSelectedProveedorId(result.data.id)
            setNuevoProveedorNombre("")
            setNuevoProveedorContacto("")
            setShowNuevoProveedor(false)
            toast.success(`Proveedor "${result.data.nombre}" creado`)
        } else {
            toast.error("Error al crear proveedor: " + result.error)
        }
        setCreandoProveedor(false)
    }

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error("Debes agregar al menos un ítem a la compra")
            return
        }

        const confirmacion = window.confirm(`¿Estás seguro de registrar la compra de ${items.length} producto(s) al inventario?`)
        if (!confirmacion) return

        setSubmitting(true)

        const detalles = items.map(item => {
            const numCantidad = parseFloat(item.cantidad)
            const numCostoTotal = parseFloat(item.costoTotal)

            const cantidadBase = convertToDisplayUnit(
                numCantidad,
                item.enteredUnit as AppUnit,
                item.baseUnit as AppUnit
            )

            const costoUnitarioBase = calculateBaseCost(
                numCostoTotal,
                numCantidad,
                item.enteredUnit as AppUnit,
                item.baseUnit as AppUnit
            )

            return {
                producto_id: item.producto_id,
                cantidad: cantidadBase,
                costo_unitario: costoUnitarioBase
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
            generar_gasto: generarGasto,
            proveedor_id: selectedProveedorId || undefined
        }

        const res = await registrarIngresoInventario(reqData)

        if (res.success) {
            toast.success("Compra registrada correctamente")
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
                <h2 className="text-3xl font-bold tracking-tight">Nueva Compra</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panel izquierdo: Agregar producto */}
                <Card className="col-span-1 md:col-span-1 border-primary/20 bg-muted/20 h-fit">
                    <CardHeader>
                        <CardTitle>Agregar Producto</CardTitle>
                        <CardDescription>Selecciona un producto y sus detalles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Producto a Comprar</Label>
                            <div className="flex gap-2">
                                <Select value={selectedProductId} onValueChange={handleProductSelect} disabled={loading}>
                                    <SelectTrigger className="flex-1">
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
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setProductFormOpen(true)}
                                    title="Crear nuevo producto"
                                    type="button"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Hint último precio */}
                        {selectedProductId && (
                            <div className="min-h-[28px]">
                                {loadingPrecio ? (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Buscando último precio...
                                    </p>
                                ) : ultimoPrecio ? (
                                    <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 border border-border/50">
                                        <span className="font-medium text-foreground/70">Última compra:</span>{" "}
                                        ${ultimoPrecio.costo_unitario.toLocaleString("es-CL")} / {productos.find(p => p.id === selectedProductId)?.unidad_medida}
                                        {ultimoPrecio.proveedor_nombre && (
                                            <> · {ultimoPrecio.proveedor_nombre}</>
                                        )}
                                        {" · "}{new Date(ultimoPrecio.fecha).toLocaleDateString("es-CL")}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Sin historial de compras</p>
                                )}
                            </div>
                        )}

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

                {/* Panel derecho: Listado + configuración */}
                <Card className="col-span-1 md:col-span-2 flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Listado de Compra</CardTitle>
                        <CardDescription>Ítems que serán sumados al inventario</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {/* Selector de proveedor — siempre visible */}
                        <div className="mb-4 space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Proveedor (Opcional)
                            </Label>
                            {!showNuevoProveedor ? (
                                <div className="flex gap-2">
                                    <Select value={selectedProveedorId} onValueChange={setSelectedProveedorId}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Sin proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin proveedor</SelectItem>
                                            {proveedores.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.nombre}
                                                    {p.telefono && <span className="text-muted-foreground"> · {p.telefono}</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedProveedorId && selectedProveedorId !== "none" && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setEditProveedorOpen(true)}
                                            title="Editar proveedor seleccionado"
                                            type="button"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowNuevoProveedor(true)}
                                        title="Agregar nuevo proveedor"
                                        type="button"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium">Nuevo proveedor</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => { setShowNuevoProveedor(false); setNuevoProveedorNombre(""); setNuevoProveedorContacto("") }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Nombre del proveedor *"
                                        value={nuevoProveedorNombre}
                                        onChange={(e) => setNuevoProveedorNombre(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCrearProveedor()}
                                    />
                                    <Input
                                        placeholder="Teléfono / Email / RUT (opcional)"
                                        value={nuevoProveedorContacto}
                                        onChange={(e) => setNuevoProveedorContacto(e.target.value)}
                                    />
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={handleCrearProveedor}
                                        disabled={creandoProveedor || !nuevoProveedorNombre.trim()}
                                    >
                                        {creandoProveedor ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                        Crear Proveedor
                                    </Button>
                                </div>
                            )}
                        </div>

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
                                                {item.cantidad} {item.enteredUnit} por ${parseFloat(item.costoTotal).toLocaleString("es-CL")}
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
                                            <Label htmlFor="generar-gasto" className="text-sm font-medium">Automatizar Gasto</Label>
                                            <p className="text-[10px] text-muted-foreground">Genera un registro automático en Gastos Operativos</p>
                                        </div>
                                    </div>

                                    <div className="bg-muted min-h-24 p-4 rounded-md flex flex-col items-end space-y-2">
                                        <div className="flex justify-between w-full max-w-[200px]">
                                            <span className="text-muted-foreground mr-4">Subtotal Neto:</span>
                                            <span className="font-medium">${subtotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        {tipoDocumento === "Factura" && (
                                            <div className="flex justify-between w-full max-w-[200px]">
                                                <span className="text-muted-foreground mr-4">IVA (19%):</span>
                                                <span className="font-medium text-emerald-600">${monto_iva.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between w-full max-w-[200px] border-t border-border pt-2 mt-2">
                                            <span className="font-bold mr-4">Total:</span>
                                            <span className="font-bold text-lg">${total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
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
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando Compra...
                                </>
                            ) : (
                                "Registrar Compra"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Dialog para crear nuevo producto inline */}
            <ProductFormDialog
                open={productFormOpen}
                onOpenChange={setProductFormOpen}
                producto={null}
                onSuccess={async (newProductId?: string) => {
                    await refreshProductos()
                    if (newProductId) {
                        // Auto-seleccionar el producto recién creado
                        await handleProductSelect(newProductId)
                    }
                }}
            />

            {/* Dialog para editar el proveedor seleccionado */}
            <ProveedorFormDialog
                open={editProveedorOpen}
                onOpenChange={setEditProveedorOpen}
                proveedorSelected={proveedores.find(p => p.id === selectedProveedorId) || null}
                onSuccess={refreshProveedores}
            />
        </div>
    )
}
