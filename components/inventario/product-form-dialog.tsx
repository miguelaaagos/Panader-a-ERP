"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, AlertCircle } from "lucide-react"

interface Categoria {
    id: string
    nombre: string
}

interface ProductFormData {
    nombre: string
    codigo_barras: string
    categoria_id: string
    precio_venta: string
    precio_costo: string
    stock_cantidad: string
    stock_minimo: string
    es_pesable: boolean
    activo: boolean
}

interface ProductFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    producto?: any // Producto existente para editar (opcional)
    onSuccess: () => void
}

export function ProductFormDialog({ open, onOpenChange, producto, onSuccess }: ProductFormDialogProps) {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ProductFormData>({
        nombre: "",
        codigo_barras: "",
        categoria_id: "",
        precio_venta: "",
        precio_costo: "",
        stock_cantidad: "0",
        stock_minimo: "5",
        es_pesable: false,
        activo: true
    })

    const isEditing = !!producto

    useEffect(() => {
        if (open) {
            fetchCategorias()
            if (producto) {
                // Pre-llenar formulario si estamos editando
                setFormData({
                    nombre: producto.nombre || "",
                    codigo_barras: producto.codigo_barras || "",
                    categoria_id: producto.categoria_id || "",
                    precio_venta: producto.precio_venta?.toString() || "",
                    precio_costo: producto.precio_costo?.toString() || "",
                    stock_cantidad: producto.stock_cantidad?.toString() || "0",
                    stock_minimo: producto.stock_minimo?.toString() || "5",
                    es_pesable: producto.es_pesable || false,
                    activo: producto.activo !== undefined ? producto.activo : true
                })
            } else {
                // Resetear formulario si estamos creando
                setFormData({
                    nombre: "",
                    codigo_barras: "",
                    categoria_id: "",
                    precio_venta: "",
                    precio_costo: "",
                    stock_cantidad: "0",
                    stock_minimo: "5",
                    es_pesable: false,
                    activo: true
                })
            }
        }
    }, [open, producto])

    const fetchCategorias = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("categorias")
                .select("id, nombre")
                .order("nombre")

            if (error) throw error
            setCategorias(data || [])
        } catch (error: any) {
            console.error("Error fetching categorias:", error)
            toast.error("Error al cargar categorías")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validaciones
            if (!formData.nombre.trim()) {
                toast.error("El nombre es requerido")
                return
            }

            const precioVenta = parseFloat(formData.precio_venta)
            const precioCosto = parseFloat(formData.precio_costo)

            if (isNaN(precioVenta) || precioVenta <= 0) {
                toast.error("El precio de venta debe ser mayor a 0")
                return
            }

            if (isNaN(precioCosto) || precioCosto < 0) {
                toast.error("El precio de costo debe ser mayor o igual a 0")
                return
            }

            const stockCantidad = parseFloat(formData.stock_cantidad)
            const stockMinimo = parseFloat(formData.stock_minimo)

            if (!formData.es_pesable && (isNaN(stockCantidad) || stockCantidad < 0)) {
                toast.error("El stock debe ser mayor o igual a 0")
                return
            }

            if (!formData.es_pesable && (isNaN(stockMinimo) || stockMinimo < 0)) {
                toast.error("El stock mínimo debe ser mayor o igual a 0")
                return
            }

            const supabase = createClient()

            const productoData = {
                nombre: formData.nombre.trim(),
                codigo_barras: formData.codigo_barras.trim() || null,
                categoria_id: formData.categoria_id || null,
                precio_venta: precioVenta,
                precio_costo: precioCosto,
                stock_cantidad: formData.es_pesable ? 0 : stockCantidad,
                stock_minimo: formData.es_pesable ? 0 : stockMinimo,
                es_pesable: formData.es_pesable,
                activo: formData.activo
            }

            if (isEditing) {
                // Actualizar producto existente
                const { error } = await supabase
                    .from("productos")
                    .update(productoData)
                    .eq("id", producto.id)

                if (error) throw error

                toast.success("Producto actualizado correctamente")
            } else {
                // Crear nuevo producto
                const { error } = await supabase
                    .from("productos")
                    .insert([productoData])

                if (error) throw error

                toast.success("Producto creado correctamente")
            }

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error saving product:", error)
            toast.error("Error al guardar producto", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifica los datos del producto" : "Completa los datos del nuevo producto"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Pan Hallulla"
                            required
                        />
                    </div>

                    {/* Código de Barras */}
                    <div className="space-y-2">
                        <Label htmlFor="codigo_barras">Código de Barras</Label>
                        <Input
                            id="codigo_barras"
                            value={formData.codigo_barras}
                            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                            placeholder="Ej: 7891234567890"
                        />
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                        <Label htmlFor="categoria">Categoría (opcional)</Label>
                        <Select
                            value={formData.categoria_id}
                            onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sin categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categorias.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo de Producto */}
                    <div className="space-y-2">
                        <Label>Tipo de Producto *</Label>
                        <RadioGroup
                            value={formData.es_pesable ? "pesable" : "unitario"}
                            onValueChange={(value) => setFormData({ ...formData, es_pesable: value === "pesable" })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unitario" id="unitario" />
                                <Label htmlFor="unitario" className="font-normal cursor-pointer">
                                    Unitario (se vende por unidad)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pesable" id="pesable" />
                                <Label htmlFor="pesable" className="font-normal cursor-pointer">
                                    Pesable (se vende por peso/kg)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Estado Activo/Inactivo */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="activo">Estado del Producto</Label>
                                <p className="text-sm text-muted-foreground">
                                    {formData.activo ? "Producto activo (visible en POS)" : "Producto inactivo (oculto en POS)"}
                                </p>
                            </div>
                            <Switch
                                id="activo"
                                checked={formData.activo}
                                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                            />
                        </div>
                        {!formData.activo && isEditing && (
                            <div className="flex items-start gap-2 p-3 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-800 dark:text-amber-200">
                                    Al desactivar este producto, dejará de aparecer en el POS pero se mantendrá el historial de ventas.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="precio_venta">Precio de Venta *</Label>
                            <Input
                                id="precio_venta"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.precio_venta}
                                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="precio_costo">Precio de Costo *</Label>
                            <Input
                                id="precio_costo"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.precio_costo}
                                onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Stock (solo para unitarios) */}
                    {!formData.es_pesable && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock_cantidad">Stock Inicial *</Label>
                                <Input
                                    id="stock_cantidad"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={formData.stock_cantidad}
                                    onChange={(e) => setFormData({ ...formData, stock_cantidad: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                                <Input
                                    id="stock_minimo"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                                    placeholder="5"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                isEditing ? "Guardar Cambios" : "Crear Producto"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
