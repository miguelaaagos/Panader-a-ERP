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
import { createProduct, updateProduct, type ProductFormData } from "@/actions/inventory"

interface Categoria {
    id: string
    nombre: string
}

interface ProductFormDataUI {
    nombre: string
    codigo: string
    categoria_id: string
    precio_venta: string
    costo_unitario: string
    stock_actual: string
    stock_minimo: string
    unidad_medida: "kg" | "g" | "L" | "ml" | "unidades"
    activo: boolean
    tipo: "ingrediente" | "producto_terminado" | "ambos"
    margen_deseado: string
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
    const [formData, setFormData] = useState<ProductFormDataUI>({
        nombre: "",
        codigo: "",
        categoria_id: "",
        precio_venta: "",
        costo_unitario: "",
        stock_actual: "0",
        stock_minimo: "5",
        unidad_medida: "unidades",
        activo: true,
        tipo: "producto_terminado",
        margen_deseado: "0"
    })

    const isEditing = !!producto

    useEffect(() => {
        if (open) {
            fetchCategorias()
            if (producto) {
                // Pre-llenar formulario si estamos editando
                setFormData({
                    nombre: producto.nombre || "",
                    codigo: producto.codigo || "",
                    categoria_id: producto.categoria_id || "",
                    precio_venta: producto.precio_venta?.toString() || "",
                    costo_unitario: producto.costo_unitario?.toString() || "",
                    stock_actual: producto.stock_actual?.toString() || "0",
                    stock_minimo: producto.stock_minimo?.toString() || "5",
                    unidad_medida: (producto.unidad_medida as any) || "unidades",
                    activo: producto.activo !== undefined ? producto.activo : true,
                    tipo: producto.tipo || "producto_terminado",
                    margen_deseado: producto.margen_deseado?.toString() || "0"
                })
            } else {
                // Resetear formulario si estamos creando
                setFormData({
                    nombre: "",
                    codigo: "",
                    categoria_id: "",
                    precio_venta: "",
                    costo_unitario: "",
                    stock_actual: "0",
                    stock_minimo: "5",
                    unidad_medida: "unidades",
                    activo: true,
                    tipo: "producto_terminado",
                    margen_deseado: "0"
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
            const dataToSubmit: ProductFormData = {
                nombre: formData.nombre.trim(),
                codigo: formData.codigo.trim() || null,
                categoria_id: formData.categoria_id || null,
                precio_venta: parseFloat(formData.precio_venta),
                costo_unitario: parseFloat(formData.costo_unitario),
                stock_actual: parseFloat(formData.stock_actual),
                stock_minimo: parseFloat(formData.stock_minimo),
                unidad_medida: formData.unidad_medida,
                activo: formData.activo,
                tipo: formData.tipo,
                margen_deseado: parseFloat(formData.margen_deseado) || 0
            }

            let result
            if (isEditing) {
                result = await updateProduct(producto.id, dataToSubmit)
            } else {
                result = await createProduct(dataToSubmit)
            }

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success(isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente")
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

                    {/* Código */}
                    <div className="space-y-2">
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                            id="codigo"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            placeholder="Ej: ABC-123"
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

                    {/* Tipo de Producto (Uso) */}
                    <div className="space-y-2">
                        <Label htmlFor="tipo">Uso del Producto *</Label>
                        <Select
                            value={formData.tipo}
                            onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar uso" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="producto_terminado">Producto Terminado (Venta)</SelectItem>
                                <SelectItem value="ingrediente">Ingrediente (Producción)</SelectItem>
                                <SelectItem value="ambos">Ambos (Venta y Producción)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Unidad de Medida */}
                    <div className="space-y-2">
                        <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                        <Select
                            value={formData.unidad_medida}
                            onValueChange={(value: any) => setFormData({ ...formData, unidad_medida: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unidades">Unidades (uds)</SelectItem>
                                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                <SelectItem value="g">Gramos (g)</SelectItem>
                                <SelectItem value="L">Litros (L)</SelectItem>
                                <SelectItem value="ml">Mililitros (ml)</SelectItem>
                            </SelectContent>
                        </Select>
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

                    {/* Precios y Margen */}
                    <div className="space-y-4 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="costo_unitario">Costo Unitario *</Label>
                                <Input
                                    id="costo_unitario"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.costo_unitario}
                                    onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                                {producto?.tiene_receta && (
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Basado en costo de receta: ${Number(producto.costo_receta || 0).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="margen_deseado">Margen Deseado (%)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="margen_deseado"
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={formData.margen_deseado}
                                        onChange={(e) => setFormData({ ...formData, margen_deseado: e.target.value })}
                                        className="w-24"
                                    />
                                    <div className="flex-1 text-right self-center">
                                        <span className="text-xs text-muted-foreground mr-1">Sugerido:</span>
                                        <span className="text-sm font-bold text-green-600">
                                            ${(() => {
                                                const costo = parseFloat(formData.costo_unitario) || 0
                                                const margin = parseFloat(formData.margen_deseado) || 0
                                                const sugerido = margin < 100
                                                    ? Math.round(costo / (1 - margin / 100))
                                                    : Math.round(costo * 2)
                                                return sugerido.toLocaleString()
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="precio_venta">Precio de Venta *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="precio_venta"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                        placeholder="0.00"
                                        className="flex-1"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-10 text-[10px] px-2"
                                        onClick={() => {
                                            const costo = parseFloat(formData.costo_unitario) || 0
                                            const margin = parseFloat(formData.margen_deseado) || 0
                                            const sugerido = margin < 100
                                                ? Math.round(costo / (1 - margin / 100))
                                                : Math.round(costo * 2)
                                            setFormData({ ...formData, precio_venta: sugerido.toString() })
                                        }}
                                    >
                                        Aplicar Sugerido
                                    </Button>
                                </div>
                                {producto?.tiene_receta && (
                                    <p className="text-[10px] text-amber-600 italic">
                                        ⚠️ Este producto tiene una receta vinculada.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_actual">Stock Inicial / Actual *</Label>
                            <Input
                                id="stock_actual"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.stock_actual}
                                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                            <Input
                                id="stock_minimo"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.stock_minimo}
                                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                                placeholder="5.00"
                                required
                            />
                        </div>
                    </div>

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
