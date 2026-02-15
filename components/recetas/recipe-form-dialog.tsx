"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Calculator, Info } from "lucide-react"
import { upsertRecipe, type RecipeFormData } from "@/actions/recipes"

interface Producto {
    id: string
    nombre: string
    unidad_medida: string
    costo_unitario: number
    tipo: "ingrediente" | "producto_terminado" | "ambos"
}

interface IngredienteSeleccionado {
    ingrediente_id: string
    cantidad: number
    costo_unitario: number // Para cálculo local
    unidad_medida: string
}

interface RecipeFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipe?: any // Recipe detallada para editar
    onSuccess: () => void
}

export function RecipeFormDialog({ open, onOpenChange, recipe, onSuccess }: RecipeFormDialogProps) {
    const [products, setProducts] = useState<Producto[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [productoId, setProductoId] = useState("")
    const [nombre, setNombre] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [rendimiento, setRendimiento] = useState("1")
    const [ingredientes, setIngredientes] = useState<IngredienteSeleccionado[]>([])
    const [margenDeseado, setMargenDeseado] = useState<string>("0")
    const [actualizarPrecio, setActualizarPrecio] = useState(false)

    const isEditing = !!recipe

    useEffect(() => {
        if (open) {
            fetchProducts()
            if (recipe) {
                setProductoId(recipe.producto_id)
                setNombre(recipe.nombre)
                setDescripcion(recipe.descripcion || "")
                setRendimiento(recipe.rendimiento.toString())
                setIngredientes(
                    recipe.ingredientes.map((ing: any) => ({
                        ingrediente_id: ing.ingrediente_id,
                        cantidad: Number(ing.cantidad),
                        costo_unitario: Number(ing.producto.costo_unitario),
                        unidad_medida: ing.producto.unidad_medida
                    }))
                )
                // Usar margen de la receta o del producto (si está disponible)
                setMargenDeseado(recipe.producto?.margen_deseado?.toString() || "0")
            } else {
                // Reset
                setProductoId("")
                setNombre("")
                setDescripcion("")
                setRendimiento("1")
                setIngredientes([])
                setMargenDeseado("0")
                setActualizarPrecio(false)
            }
        }
    }, [open, recipe])

    // Efecto para cargar margen cuando se selecciona un producto nuevo
    useEffect(() => {
        if (productoId && !isEditing) {
            const product = products.find(p => p.id === productoId)
            if (product) {
                // Podríamos buscar el margen actual del producto aquí
                // Para ahora, asumiremos 0 o lo que venga en el array de productos si agregamos el campo
            }
        }
    }, [productoId, products, isEditing])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("productos")
                .select("id, nombre, unidad_medida, costo_unitario, tipo, margen_deseado, precio_venta")
                .eq("activo", true)
                .order("nombre")

            if (error) throw error
            setProducts(data || [])
        } catch (error: any) {
            toast.error("Error al cargar productos")
        } finally {
            setLoading(false)
        }
    }

    // Filtros de productos
    const targetProducts = useMemo(() =>
        products.filter(p => p.tipo === "producto_terminado" || p.tipo === "ambos"),
        [products])

    const ingredientOptions = useMemo(() =>
        products.filter(p => p.tipo === "ingrediente" || p.tipo === "ambos"),
        [products])

    // Cálculos dinámicos
    const costoTotal = useMemo(() => {
        return ingredientes.reduce((acc, ing) => acc + (ing.cantidad * ing.costo_unitario), 0)
    }, [ingredientes])

    const yieldNum = parseFloat(rendimiento) || 1
    const costoPorUnidad = costoTotal / yieldNum

    const marginNum = parseFloat(margenDeseado) || 0
    const precioSugerido = marginNum < 100
        ? Math.round(costoPorUnidad / (1 - marginNum / 100))
        : Math.round(costoPorUnidad * 2)

    // Información del producto seleccionado
    const selectedProduct = useMemo(() =>
        products.find(p => p.id === productoId),
        [products, productoId])

    const addIngredient = () => {
        setIngredientes([...ingredientes, { ingrediente_id: "", cantidad: 0, costo_unitario: 0, unidad_medida: "" }])
    }

    const removeIngredient = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index))
    }

    const updateIngredient = (index: number, field: keyof IngredienteSeleccionado, value: any) => {
        const newIngredientes = [...ingredientes]
        if (field === "ingrediente_id") {
            const product = products.find(p => p.id === value)
            if (product) {
                newIngredientes[index] = {
                    ...newIngredientes[index],
                    ingrediente_id: value,
                    costo_unitario: Number(product.costo_unitario),
                    unidad_medida: product.unidad_medida
                }
            }
        } else {
            newIngredientes[index] = { ...newIngredientes[index], [field]: value }
        }
        setIngredientes(newIngredientes)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!productoId || ingredientes.length === 0) {
            toast.error("Completa los campos obligatorios y añade al menos un ingrediente")
            return
        }

        setSubmitting(true)
        const data: RecipeFormData = {
            producto_id: productoId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            rendimiento: yieldNum,
            activa: true,
            ingredientes: ingredientes.map((ing, idx) => ({
                ingrediente_id: ing.ingrediente_id,
                cantidad: ing.cantidad,
                orden: idx
            })),
            margen_deseado: marginNum,
            actualizar_precio_venta: actualizarPrecio
        }

        const result = await upsertRecipe(data, recipe?.id)
        if (result.success) {
            toast.success(isEditing ? "Receta actualizada" : "Receta creada")
            onSuccess()
            onOpenChange(false)
        } else {
            toast.error("Error: " + result.error)
        }
        setSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{isEditing ? "Editar Receta" : "Nueva Receta"}</DialogTitle>
                    <DialogDescription>Define los ingredientes y proporciones para tu producto.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Producto Destino */}
                            <div className="space-y-2">
                                <Label>Producto Final *</Label>
                                <Select value={productoId} onValueChange={setProductoId} disabled={isEditing}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar producto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetProducts.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.unidad_medida})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Nombre de la Receta */}
                            <div className="space-y-2">
                                <Label>Nombre de Receta *</Label>
                                <Input
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder="Ej: Receta base para pan"
                                    required
                                />
                            </div>

                            {/* Rendimiento */}
                            <div className="space-y-2">
                                <Label>Rendimiento (unidades producidas) *</Label>
                                <Input
                                    type="number"
                                    value={rendimiento}
                                    onChange={e => setRendimiento(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    required
                                />
                            </div>
                        </div>

                        {/* Lista de Ingredientes */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold">Ingredientes</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                                    <Plus className="h-4 w-4 mr-2" /> Añadir Ingrediente
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {ingredientes.map((ing, index) => (
                                    <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-end bg-muted/30 p-2 rounded-md border border-dashed">
                                        <div className="flex-1 min-w-[200px]">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Ingrediente</Label>
                                            <Select
                                                value={ing.ingrediente_id}
                                                onValueChange={(val) => updateIngredient(index, "ingrediente_id", val)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ingredientOptions.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Cantidad</Label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                className="h-9"
                                                value={ing.cantidad}
                                                onChange={e => updateIngredient(index, "cantidad", parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Unid.</Label>
                                            <div className="h-9 flex items-center px-1 text-sm bg-muted rounded-sm border truncate">
                                                {ing.unidad_medida || "?"}
                                            </div>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Costo</Label>
                                            <div className="h-9 flex items-center px-2 text-sm font-medium">
                                                ${(ing.cantidad * ing.costo_unitario).toLocaleString()}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive"
                                            onClick={() => removeIngredient(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {ingredientes.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground italic text-sm">
                                        No has añadido ingredientes todavía.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resumen de Costos */}
                    <div className="bg-muted/50 p-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center">
                                <Calculator className="h-3 w-3 mr-1" /> Costo Total Receta
                            </span>
                            <div className="text-xl font-bold">${costoTotal.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Costo por Unidad</span>
                            <div className="text-xl font-bold text-primary">${costoPorUnidad.toLocaleString()}</div>
                        </div>

                        {/* Nueva sección de fijación de precios */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t md:border-t-0 md:pt-0 md:border-l md:pl-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Margen de Ganancia (%)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={margenDeseado}
                                        onChange={e => setMargenDeseado(e.target.value)}
                                        className="h-8 w-20"
                                        min="0"
                                        max="99"
                                    />
                                    <div className="flex-1 text-right self-center">
                                        <span className="text-xs text-muted-foreground mr-2">Sugerido:</span>
                                        <span className="font-bold text-green-600">${precioSugerido.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="actualizar-precio"
                                        checked={actualizarPrecio}
                                        onChange={e => setActualizarPrecio(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="actualizar-precio" className="text-xs cursor-pointer">
                                        Aplicar precio sugerido como precio de venta
                                    </Label>
                                </div>
                                {selectedProduct && (
                                    <div className="text-[10px] text-muted-foreground italic">
                                        Precio actual: ${Number((selectedProduct as any).precio_venta || 0).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-3 flex items-center pt-2 border-t">
                            <div className="text-[11px] text-muted-foreground bg-white/50 p-2 rounded border border-blue-100 flex gap-2 w-full">
                                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                                <span>El costo y margen del producto se actualizarán automáticamente. Si marcas la casilla, también cambiará el precio en el catálogo.</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-white">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting || ingredientes.length === 0}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isEditing ? "Guardar Cambios" : "Crear Receta"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
