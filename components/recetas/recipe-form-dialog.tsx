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
import { upsertRecipe, createQuickIngredient, type RecipeFormData } from "@/actions/recipes"
import { convertQuantity, getLineCost } from "@/lib/utils/units"

interface Producto {
    id: string
    nombre: string
    unidad_medida: string
    unidad_medida_base: string | null
    costo_unitario: number | null
    factor_conversion: number | null
    tipo: "ingrediente" | "producto_terminado" | "ambos"
    margen_deseado: number | null
    precio_venta: number | null
    categorias?: { nombre: string } | { nombre: string }[] | null
}

interface IngredienteSeleccionado {
    ingrediente_id: string
    cantidad: string // string para permitir escribir "0." o "12" sin resetear
    costo_unitario: number // Precio por UNIDAD DE COMPRA (kg, L, un...)
    unidad_medida_compra: string
    unidad_medida_base: string | null
    unidad_seleccionada: string
    factor_conversion: number // Siempre >= 1
}

interface Recipe {
    id: string
    producto_id: string
    nombre: string
    descripcion: string | null
    rendimiento: number
    ingredientes: Ingrediente[]
    producto?: {
        id: string
        nombre: string
        margen_deseado: number | null
    }
}

interface Ingrediente {
    ingrediente_id: string
    cantidad: number
    producto: {
        nombre: string
        unidad_medida: string
        unidad_medida_base: string | null
        factor_conversion: number | null
        costo_unitario: number | null
    }
}

interface RecipeFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipe?: Recipe | null // Recipe detallada para editar
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
    const [margenDeseado, setMargenDeseado] = useState<string>("25")
    const [actualizarPrecio, setActualizarPrecio] = useState(false)

    // Quick create state
    const [isCreatingIngredient, setIsCreatingIngredient] = useState(false)
    const [newIngredient, setNewIngredient] = useState<{
        nombre: string
        unidad_medida: "kg" | "g" | "L" | "ml" | "unidades"
        unidad_medida_base: "kg" | "g" | "L" | "ml" | "unidades" | ""
        factor_conversion: number
        costo_unitario: number
    }>({ nombre: "", unidad_medida: "kg", unidad_medida_base: "g", factor_conversion: 1000, costo_unitario: 0 })
    const [creatingIndex, setCreatingIndex] = useState<number | null>(null)

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
                    recipe.ingredientes.map((ing: Ingrediente) => {
                        const product = ing.producto
                        const uComp = product.unidad_medida.toLowerCase()
                        // Si la unidad es kg o L, el factor SIEMPRE debe ser 1000
                        // (1 kg = 1000 g, 1 L = 1000 ml), ignorar valores incorrectos en BD
                        const isMassOrVolume = uComp === "kg" || uComp === "l"
                        const factor = isMassOrVolume ? 1000 : (product.factor_conversion || 1)
                        const purchaseCost = product.costo_unitario ?? 0

                        // Determinar la unidad mostrada y cantidad escalada
                        let unidadMostrada = product.unidad_medida
                        let cantidadFinal = Number(ing.cantidad) // Siempre en unidad de compra en DB

                        // Si es < 1 y mass/volume, mostramos en gramos/ml para comodidad
                        if ((uComp === "kg" || uComp === "l") && cantidadFinal < 1) {
                            unidadMostrada = uComp === "kg" ? "g" : "ml"
                            cantidadFinal = cantidadFinal * factor
                        }

                        return {
                            ingrediente_id: ing.ingrediente_id,
                            cantidad: parseFloat(cantidadFinal.toFixed(3)).toString(),
                            costo_unitario: purchaseCost,
                            unidad_medida_compra: product.unidad_medida,
                            unidad_medida_base: product.unidad_medida_base || ((uComp === "kg") ? "g" : (uComp === "l" ? "ml" : null)),
                            unidad_seleccionada: unidadMostrada,
                            factor_conversion: factor
                        }
                    })
                )
                setMargenDeseado(recipe.producto?.margen_deseado?.toString() || "25")
            } else {
                // Reset
                setProductoId("")
                setNombre("")
                setDescripcion("")
                setRendimiento("1")
                setIngredientes([])
                setMargenDeseado("25")
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
            }
        }
    }, [productoId, products, isEditing])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("productos")
                .select("id, nombre, unidad_medida, unidad_medida_base, costo_unitario, factor_conversion, tipo, margen_deseado, precio_venta, categorias(nombre)")
                .eq("activo", true)
                .order("nombre")

            if (error) throw error
            setProducts((data as unknown as Producto[]) || [])
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error al cargar productos"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Filtros de productos
    const targetProducts = useMemo(() =>
        products.filter(p => {
            if (p.tipo !== "producto_terminado" && p.tipo !== "ambos") return false
            if (!p.categorias) return false
            const catRecord = p.categorias as any
            const nombreCat = Array.isArray(catRecord) ? catRecord[0]?.nombre : catRecord?.nombre
            if (!nombreCat) return false
            const catNombre = String(nombreCat).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            return catNombre.includes("panaderia") || catNombre.includes("pasteleria")
        }),
        [products])

    const ingredientOptions = useMemo(() =>
        products.filter(p => p.tipo === "ingrediente" || p.tipo === "ambos"),
        [products])

    // Cálculos dinámicos
    const costoTotal = useMemo(() => {
        return ingredientes.reduce((acc, ing) => {
            const cantidadNum = parseFloat(ing.cantidad.replace(",", ".")) || 0
            return acc + getLineCost({
                cantidad: cantidadNum,
                unidadSeleccionada: ing.unidad_seleccionada,
                unidadCompra: ing.unidad_medida_compra,
                factor: ing.factor_conversion,
                costoCompra: ing.costo_unitario
            })
        }, 0)
    }, [ingredientes])

    const yieldNum = parseFloat(rendimiento) || 1
    const costoPorUnidad = costoTotal / yieldNum

    const marginNum = parseFloat(margenDeseado) || 0
    const costoConIva = costoPorUnidad * 1.19
    const precioSugerido = marginNum < 100
        ? Math.round(costoConIva / (1 - marginNum / 100))
        : Math.round(costoConIva * 2)

    // Información del producto seleccionado
    const selectedProduct = useMemo(() =>
        products.find(p => p.id === productoId),
        [products, productoId])

    const addIngredient = () => {
        setIngredientes([...ingredientes, {
            ingrediente_id: "",
            cantidad: "",
            costo_unitario: 0,
            unidad_medida_compra: "",
            unidad_medida_base: null,
            unidad_seleccionada: "",
            factor_conversion: 1
        }])
    }

    const removeIngredient = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index))
    }

    const updateIngredient = (index: number, field: keyof IngredienteSeleccionado, value: string | number) => {
        const newIngredientes = [...ingredientes]
        const current = newIngredientes[index]
        if (!current) return

        if (field === "ingrediente_id") {
            if (value === "NEW_INGREDIENT") {
                setCreatingIndex(index)
                return
            }
            const product = products.find(p => p.id === value)
            if (product) {
                const uComp = product.unidad_medida.toLowerCase()
                // Si la unidad es kg o L, el factor SIEMPRE debe ser 1000
                const isMassOrVolume = uComp === "kg" || uComp === "l"
                const factor = isMassOrVolume ? 1000 : (product.factor_conversion || 1)
                const purchaseCost = product.costo_unitario ?? 0

                newIngredientes[index] = {
                    ...current,
                    ingrediente_id: value as string,
                    costo_unitario: purchaseCost,
                    unidad_medida_compra: product.unidad_medida,
                    unidad_medida_base: product.unidad_medida_base || ((uComp === "kg") ? "g" : (uComp === "l" ? "ml" : null)),
                    unidad_seleccionada: product.unidad_medida,
                    factor_conversion: factor
                }
            }
        } else if (field === "unidad_seleccionada") {
            const oldValue = current.unidad_seleccionada
            const newValue = value as string
            const cantidadNum = parseFloat(current.cantidad.replace(",", ".")) || 0

            const newCantidad = convertQuantity(
                cantidadNum,
                oldValue,
                newValue,
                current.factor_conversion
            )

            // Mostrar hasta 3 decimales pero sin ceros innecesarios
            const cantidadStr = parseFloat(newCantidad.toFixed(3)).toString()

            newIngredientes[index] = {
                ...current,
                unidad_seleccionada: newValue,
                cantidad: cantidadStr
            }
            setIngredientes(newIngredientes)
            return // ← evitar el setIngredientes duplicado al final
        } else if (field === "cantidad") {
            // Guardamos el string tal cual para que el input no resetee al escribir
            newIngredientes[index] = { ...current, cantidad: value.toString() }
        } else {
            newIngredientes[index] = { ...current, [field]: value }
        }
        setIngredientes(newIngredientes)
    }

    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (creatingIndex === null) return

        setIsCreatingIngredient(true)
        try {
            const result = await createQuickIngredient(newIngredient)
            if (result.success && result.data) {
                const createdProduct = result.data as unknown as Producto
                setProducts([...products, createdProduct])

                const newIngredientes = [...ingredientes]
                const prev = newIngredientes[creatingIndex]
                const factor = createdProduct.factor_conversion || ((createdProduct.unidad_medida === "kg" || createdProduct.unidad_medida === "L") ? 1000 : 1)
                const purchaseCost = createdProduct.costo_unitario ?? 0

                newIngredientes[creatingIndex] = {
                    ...prev,
                    ingrediente_id: createdProduct.id,
                    costo_unitario: purchaseCost,
                    unidad_medida_compra: createdProduct.unidad_medida,
                    unidad_medida_base: createdProduct.unidad_medida_base,
                    unidad_seleccionada: createdProduct.unidad_medida,
                    factor_conversion: factor,
                    cantidad: prev?.cantidad.toString() || ""
                }
                setIngredientes(newIngredientes)
                toast.success("Ingrediente creado y seleccionado")
                setCreatingIndex(null)
                setNewIngredient({ nombre: "", unidad_medida: "kg", unidad_medida_base: "g", factor_conversion: 1000, costo_unitario: 0 })
            } else {
                toast.error("Error al crear ingrediente: " + result.error)
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsCreatingIngredient(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!productoId || ingredientes.length === 0) {
            toast.error("Completa los campos obligatorios y añade al menos un ingrediente")
            return
        }

        setSubmitting(true)

        const ingredientesNormalizados = ingredientes.map((ing, idx) => {
            const cantidadFinal = convertQuantity(
                ing.cantidad,
                ing.unidad_seleccionada,
                ing.unidad_medida_compra,
                ing.factor_conversion
            )

            return {
                ingrediente_id: ing.ingrediente_id,
                cantidad: cantidadFinal,
                orden: idx
            }
        })

        const data: RecipeFormData = {
            producto_id: productoId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            rendimiento: yieldNum,
            activa: true,
            ingredientes: ingredientesNormalizados,
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
                                    type="text"
                                    inputMode="decimal"
                                    value={rendimiento}
                                    onChange={e => setRendimiento(e.target.value.replace(",", "."))}
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
                                                    <SelectItem value="NEW_INGREDIENT" className="text-primary font-medium hover:bg-primary/10">
                                                        <Plus className="h-4 w-4 inline-block mr-2" />
                                                        Añadir Insumo Nuevo
                                                    </SelectItem>
                                                    {ingredientOptions.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Cantidad</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                className="h-9"
                                                value={ing.cantidad}
                                                onChange={e => updateIngredient(index, "cantidad", e.target.value)}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Unid.</Label>
                                            <Select
                                                value={ing.unidad_seleccionada}
                                                onValueChange={(val) => updateIngredient(index, "unidad_seleccionada", val)}
                                                disabled={!ing.ingrediente_id}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Siempre mostrar la unidad de compra */}
                                                    {ing.unidad_medida_compra && (
                                                        <SelectItem value={ing.unidad_medida_compra}>
                                                            {ing.unidad_medida_compra}
                                                        </SelectItem>
                                                    )}

                                                    {/* Mostrar unidad base si es distinta */}
                                                    {ing.unidad_medida_base && ing.unidad_medida_base !== ing.unidad_medida_compra && (
                                                        <SelectItem value={ing.unidad_medida_base}>
                                                            {ing.unidad_medida_base}
                                                        </SelectItem>
                                                    )}

                                                    {/* Alternativas estándar (g para kg, ml para L) si no existe ya en unidad_medida_base */}
                                                    {ing.unidad_medida_compra === "kg" && ing.unidad_medida_base !== "g" && (
                                                        <SelectItem value="g">g</SelectItem>
                                                    )}
                                                    {ing.unidad_medida_compra === "L" && ing.unidad_medida_base !== "ml" && (
                                                        <SelectItem value="ml">ml</SelectItem>
                                                    )}

                                                    {/* Fallback */}
                                                    {!ing.unidad_medida_compra && !ing.unidad_medida_base && (
                                                        <SelectItem value="?">?</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <Label className="text-[10px] uppercase text-muted-foreground ml-1">Costo Línea</Label>
                                            <div className="h-9 flex items-center px-3 bg-secondary/30 rounded-md border border-border/50">
                                                <span className="text-sm font-semibold">
                                                    ${Math.round(getLineCost({
                                                        cantidad: parseFloat(ing.cantidad.replace(",", ".")) || 0,
                                                        unidadSeleccionada: ing.unidad_seleccionada,
                                                        unidadCompra: ing.unidad_medida_compra,
                                                        factor: ing.factor_conversion,
                                                        costoCompra: ing.costo_unitario
                                                    })).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    Total
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
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
                    <div className="bg-muted p-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center">
                                <Calculator className="h-3 w-3 mr-1" /> Costo Total Receta
                            </span>
                            <div className="text-xl font-bold">${costoTotal.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Costo por Unidad</span>
                            <div className="text-xl font-bold text-primary">${costoPorUnidad.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Costo con IVA (19%): <strong className="text-foreground">${Math.round(costoConIva).toLocaleString()}</strong>
                            </div>
                        </div>

                        {/* Fichación de precios */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50 md:border-t-0 md:pt-0 md:border-l md:border-border/50 md:pl-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Margen de Ganancia (%)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={margenDeseado}
                                        onChange={e => setMargenDeseado(e.target.value.replace(",", "."))}
                                        className="h-8 w-20"
                                    />
                                    <div className="flex-1 text-right self-center">
                                        <span className="text-xs text-muted-foreground mr-2">Sugerido:</span>
                                        <span className="font-bold text-green-600 dark:text-green-500">${precioSugerido.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center space-y-2 pt-2">
                                <Button
                                    type="button"
                                    variant={actualizarPrecio ? "default" : "outline"}
                                    onClick={() => setActualizarPrecio(!actualizarPrecio)}
                                    className={`w-full justify-start text-xs h-8 ${actualizarPrecio ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                                >
                                    {actualizarPrecio ? (
                                        <span className="flex items-center">
                                            ✓ Aplicando Margen y Precio
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-muted-foreground">
                                            Aplicar Margen Sugerido
                                        </span>
                                    )}
                                </Button>
                                {selectedProduct && (
                                    <div className="text-[10px] text-muted-foreground italic pl-2">
                                        Precio catálogo: ${Number(selectedProduct.precio_venta || 0).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-3 flex items-center pt-2 border-t border-border/50">
                            <div className="text-[11px] text-muted-foreground bg-accent/40 p-2 rounded border border-border flex gap-2 w-full">
                                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                                <span>El costo y margen del producto se actualizarán automáticamente en la base de datos. Si aplicas el margen, también cambiará su precio público de venta en el catálogo.</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-border rounded-b-lg bg-background">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting || ingredientes.length === 0}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isEditing ? "Guardar Cambios" : "Crear Receta"}
                        </Button>
                    </DialogFooter>
                </form>

                {/* Sub-modal: Quick Create Ingredient */}
                <Dialog open={creatingIndex !== null} onOpenChange={(o) => !o && setCreatingIndex(null)}>
                    <DialogContent className="sm:max-w-md" style={{ zIndex: 60 }}>
                        <DialogHeader>
                            <DialogTitle>Crear Insumo Rapido</DialogTitle>
                            <DialogDescription>
                                Añade rápidamente un nuevo ingrediente al catálogo sin salir de la receta.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleQuickCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre del Insumo</Label>
                                <Input
                                    required
                                    autoFocus
                                    value={newIngredient.nombre}
                                    onChange={e => setNewIngredient({ ...newIngredient, nombre: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Costo ($)</Label>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        value={newIngredient.costo_unitario}
                                        onChange={e => setNewIngredient({ ...newIngredient, costo_unitario: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Se Compra En</Label>
                                    <Select
                                        value={newIngredient.unidad_medida}
                                        onValueChange={(val: "kg" | "g" | "L" | "ml" | "unidades") => {
                                            const base = val === "kg" ? "g" : val === "L" ? "ml" : val
                                            const fact = (val === "kg" || val === "L") ? 1000 : 1
                                            setNewIngredient({ ...newIngredient, unidad_medida: val, unidad_medida_base: base, factor_conversion: fact })
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 70 }}>
                                            <SelectItem value="kg">Kg</SelectItem>
                                            <SelectItem value="L">Litros (Lt)</SelectItem>
                                            <SelectItem value="g">Gramos (gr)</SelectItem>
                                            <SelectItem value="unidades">Unidad (Un)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Se Usa En (Receta)</Label>
                                    <Select
                                        value={newIngredient.unidad_medida_base || newIngredient.unidad_medida}
                                        onValueChange={(val: "kg" | "g" | "L" | "ml" | "unidades") => {
                                            let fact = 1;
                                            if (newIngredient.unidad_medida === "kg" && val === "g") fact = 1000;
                                            if (newIngredient.unidad_medida === "L" && val === "ml") fact = 1000;
                                            setNewIngredient({ ...newIngredient, unidad_medida_base: val, factor_conversion: fact })
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 70 }}>
                                            <SelectItem value="g">Gramos (gr)</SelectItem>
                                            <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                            <SelectItem value="kg">Kg</SelectItem>
                                            <SelectItem value="L">Litros (Lt)</SelectItem>
                                            <SelectItem value="unidades">Unidad (Un)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <span className="text-sm text-muted-foreground">
                                        Factor: <strong>{newIngredient.factor_conversion}</strong> {newIngredient.unidad_medida_base || newIngredient.unidad_medida} por {newIngredient.unidad_medida}
                                    </span>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setCreatingIndex(null)}>Cancelar</Button>
                                <Button type="submit" disabled={isCreatingIngredient}>
                                    {isCreatingIngredient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Insumo
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}
