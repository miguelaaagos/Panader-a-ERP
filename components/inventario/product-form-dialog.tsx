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
    es_pesable: boolean
    mostrar_en_pos: boolean
}

interface ProductFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    producto?: any // Producto existente para editar (opcional)
    onSuccess: () => void
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ProductFormDialog({ open, onOpenChange, producto, onSuccess }: ProductFormDialogProps) {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(false)
    const [pricingType, setPricingType] = useState<"unit" | "weight">("unit")
    const [hasSales, setHasSales] = useState(false)

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
        margen_deseado: "0",
        es_pesable: false,
        mostrar_en_pos: true
    })

    const isEditing = !!producto

    useEffect(() => {
        if (open) {
            setLoading(false) // Reset loading state
            setHasSales(false) // Reset sales check
            fetchCategorias()

            if (producto) {
                // Check if product has sales history
                const checkSalesHistory = async () => {
                    try {
                        const supabase = createClient()
                        const { data, error } = await supabase
                            .from("venta_detalles")
                            .select("id")
                            .eq("producto_id", producto.id)
                            .limit(1)

                        if (!error && data && data.length > 0) {
                            setHasSales(true)
                        }
                    } catch (err) {
                        console.error("Error checking sales history:", err)
                    }
                }
                checkSalesHistory()

                // Determine initial pricing type
                const isUnit = producto.unidad_medida === 'unidades'
                setPricingType(isUnit ? "unit" : "weight")

                // Pre-llenar formulario
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
                    margen_deseado: producto.margen_deseado?.toString() || "0",
                    es_pesable: !!producto.es_pesable,
                    mostrar_en_pos: producto.tipo === 'ingrediente' ? false : (producto.mostrar_en_pos !== undefined ? producto.mostrar_en_pos : true),
                })
            } else {
                // Reset
                setPricingType("unit")
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
                    margen_deseado: "0",
                    es_pesable: false,
                    mostrar_en_pos: true
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

    const handlePricingTypeChange = (type: "unit" | "weight") => {
        setPricingType(type)
        if (type === "unit") {
            setFormData(prev => ({
                ...prev,
                unidad_medida: "unidades",
                es_pesable: false
            }))
        } else {
            // Default to kg if switching to weight and currently units
            if (formData.unidad_medida === 'unidades') {
                setFormData(prev => ({
                    ...prev,
                    unidad_medida: "kg",
                    es_pesable: true
                }))
            }
        }
    }

    const handleUnitChange = (newUnit: string) => {
        const oldUnit = formData.unidad_medida
        let factor = 1

        // Logic for conversion:
        // kg -> g: * 1000
        // g -> kg: / 1000
        // L -> ml: * 1000
        // ml -> L: / 1000

        if ((oldUnit === 'kg' && newUnit === 'g') || (oldUnit === 'L' && newUnit === 'ml')) {
            factor = 1000
        } else if ((oldUnit === 'g' && newUnit === 'kg') || (oldUnit === 'ml' && newUnit === 'L')) {
            factor = 0.001
        }

        if (factor !== 1) {
            // Stock multiplies/divides
            // Price/Cost usually inverse? 
            // Wait, if I have 1 kg of flour ($1000 cost), and I switch to grams:
            // Do I have 1000 grams? YES. Stock * 1000.
            // Does 1 gram cost $1000? NO. Cost / 1000.
            // User request: "multiply by 1000 or divide by 1000".
            // Context implies QUANTITY conversion (20kg -> 20000g).

            const currentStock = parseFloat(formData.stock_actual) || 0
            const currentMinSafe = parseFloat(formData.stock_minimo) || 0

            // Prices are per UNIT of measure. 
            // If cost is $1000/kg.
            // Cost per g is $1.
            const currentCost = parseFloat(formData.costo_unitario) || 0
            const currentPrice = parseFloat(formData.precio_venta) || 0

            setFormData(prev => ({
                ...prev,
                unidad_medida: newUnit as any,
                stock_actual: (currentStock * factor).toString(),
                stock_minimo: (currentMinSafe * factor).toString(),
                // Prices scale inversely to quantity
                costo_unitario: (currentCost / factor).toString(),
                precio_venta: (currentPrice / factor).toString()
            }))

            toast.info(`Valores convertidos de ${oldUnit} a ${newUnit}`)
        } else {
            setFormData(prev => ({ ...prev, unidad_medida: newUnit as any }))
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
                precio_venta: parseFloat(formData.precio_venta) || 0,
                costo_unitario: parseFloat(formData.costo_unitario) || 0,
                stock_actual: parseFloat(formData.stock_actual) || 0,
                stock_minimo: parseFloat(formData.stock_minimo) || 0,
                unidad_medida: formData.unidad_medida,
                activo: formData.activo,
                tipo: formData.tipo,
                margen_deseado: parseFloat(formData.margen_deseado) || 0,
                es_pesable: (pricingType === "weight" && formData.tipo !== 'ingrediente') ? formData.es_pesable : false, // Enforce intent
                mostrar_en_pos: formData.tipo === 'ingrediente' ? false : formData.mostrar_en_pos
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

            // Cerrar primero para evitar "rebote" visual por re-render del padre
            onOpenChange(false)

            // Luego actualizar datos
            onSuccess()

        } catch (error: any) {
            console.error("Error saving product:", error)
            toast.error("Error al guardar producto", {
                description: error.message
            })
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                    <DialogDescription>
                        Configura los detalles del producto para ventas e inventario.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sección 1: Identificación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre del Producto *</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Marraqueta, Torta, Harina..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría</Label>
                            <Select
                                value={formData.categoria_id}
                                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código (SKU/Barra)</Label>
                            <Input
                                id="codigo"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Uso del Producto</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(value: any) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        tipo: value,
                                        // Si es ingrediente, forzar mostrar_en_pos y es_pesable a false
                                        mostrar_en_pos: value === 'ingrediente' ? false : prev.mostrar_en_pos,
                                        es_pesable: value === 'ingrediente' ? false : prev.es_pesable
                                    }))
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="producto_terminado">Producto para Venta</SelectItem>
                                    <SelectItem value="ingrediente">Solo Ingrediente</SelectItem>
                                    <SelectItem value="ambos">Mixto (Venta + Ingrediente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sección 2: Definición de Unidad y Cobro */}
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">¿Cómo se vende/mide?</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={hasSales ? "opacity-50 pointer-events-none" : ""}>
                                            <RadioGroup
                                                value={pricingType}
                                                onValueChange={(v: "unit" | "weight") => handlePricingTypeChange(v)}
                                                className="flex gap-4"
                                                disabled={hasSales}
                                            >
                                                <div className={`flex items-center space-x-2 border rounded-md p-3 px-4 transition-all w-1/2 cursor-pointer ${pricingType === 'unit' ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-background hover:bg-muted'}`}>
                                                    <RadioGroupItem value="unit" id="r-unit" />
                                                    <Label htmlFor="r-unit" className="cursor-pointer font-medium">
                                                        Por Unidad
                                                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">Se vende por pieza (u)</span>
                                                    </Label>
                                                </div>
                                                <div className={`flex items-center space-x-2 border rounded-md p-3 px-4 transition-all w-1/2 cursor-pointer ${pricingType === 'weight' ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-background hover:bg-muted'}`}>
                                                    <RadioGroupItem value="weight" id="r-weight" />
                                                    <Label htmlFor="r-weight" className="cursor-pointer font-medium">
                                                        Por Peso / Medida
                                                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">Kg, Gramos, Litros...</span>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </TooltipTrigger>
                                    {hasSales && (
                                        <TooltipContent>
                                            <p>No se puede cambiar el tipo de venta porque el producto tiene historial de ventas.</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {pricingType === "weight" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <Label htmlFor="unidad_medida">Unidad Base</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={hasSales ? "opacity-50 pointer-events-none" : ""}>
                                                    <Select
                                                        value={formData.unidad_medida}
                                                        onValueChange={handleUnitChange}
                                                        disabled={hasSales}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                                            <SelectItem value="g">Gramos (g)</SelectItem>
                                                            <SelectItem value="L">Litros (L)</SelectItem>
                                                            <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TooltipTrigger>
                                            {hasSales && (
                                                <TooltipContent>
                                                    <p>Unidad bloqueada por historial de ventas.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <p className="text-[10px] text-muted-foreground">
                                        * Cambiar unidad ajustará stocks y costos automáticamente.
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Switch
                                        id="es_pesable"
                                        checked={formData.es_pesable}
                                        onCheckedChange={(c) => setFormData({ ...formData, es_pesable: c })}
                                        disabled={formData.tipo === 'ingrediente'}
                                    />
                                    <Label htmlFor="es_pesable" className={formData.tipo === 'ingrediente' ? 'text-muted-foreground' : ''}>Venta Pesable en Caja</Label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sección 3: Precios e Inventario */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Columna Costos */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Costos</h4>
                            <div className="space-y-2">
                                <Label htmlFor="costo_unitario">Costo x {formData.unidad_medida}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="costo_unitario"
                                        type="number"
                                        min="0"
                                        value={formData.costo_unitario}
                                        onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
                                        className="pl-7"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="margen">Margen %</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="margen"
                                        type="number"
                                        placeholder="%"
                                        value={formData.margen_deseado}
                                        onChange={(e) => setFormData({ ...formData, margen_deseado: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="px-3"
                                        onClick={() => {
                                            const costo = parseFloat(formData.costo_unitario) || 0
                                            const margin = parseFloat(formData.margen_deseado) || 0
                                            if (margin > 0 && margin < 100) {
                                                const sugerido = Math.round(costo / (1 - margin / 100))
                                                setFormData({ ...formData, precio_venta: sugerido.toString() })
                                            }
                                        }}
                                    >
                                        Aplicar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Columna Venta */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Venta</h4>
                            <div className="space-y-2">
                                <Label htmlFor="precio_venta">Precio x {formData.unidad_medida}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="precio_venta"
                                        type="number"
                                        min="0"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                        className="pl-7 font-bold"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="mostrar_en_pos"
                                    checked={formData.mostrar_en_pos}
                                    onCheckedChange={(c) => setFormData({ ...formData, mostrar_en_pos: c })}
                                    disabled={formData.tipo === 'ingrediente'}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="mostrar_en_pos" className={formData.tipo === 'ingrediente' ? 'text-muted-foreground' : ''}>
                                        Disponible en POS
                                    </Label>
                                    {formData.tipo === 'ingrediente' && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Ingredientes no se venden en POS
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="activo"
                                    checked={formData.activo}
                                    onCheckedChange={(c) => setFormData({ ...formData, activo: c })}
                                />
                                <Label htmlFor="activo">Producto Activo</Label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="stock_actual">Stock Actual ({formData.unidad_medida})</Label>
                            <Input
                                id="stock_actual"
                                type="number"
                                value={formData.stock_actual}
                                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock_minimo">Alerta Mínimo ({formData.unidad_medida})</Label>
                            <Input
                                id="stock_minimo"
                                type="number"
                                value={formData.stock_minimo}
                                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="min-w-[150px]">
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
