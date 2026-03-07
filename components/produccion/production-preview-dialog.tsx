"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getRecipeDetail } from "@/actions/recipes"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import type { ProductionOrder } from "./order-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ProductionPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: ProductionOrder | null
    onConfirm: (orderId: string) => void
    isProcessing: boolean
}

interface IngredientePreview {
    id: string
    nombre: string
    medida_compra: string
    medida_receta: string
    factor: number
    requerido_receta: number // en unidad de receta (base)
    descuento_stock: number   // en unidad de compra
    stock_actual: number
    stock_restante: number
}

export function ProductionPreviewDialog({ open, onOpenChange, order, onConfirm, isProcessing }: ProductionPreviewDialogProps) {
    const [loading, setLoading] = useState(false)
    const [ingredients, setIngredients] = useState<IngredientePreview[]>([])
    const [insufficientStock, setInsufficientStock] = useState(false)

    useEffect(() => {
        if (open && order) {
            loadPreview(order)
        } else {
            setIngredients([])
            setInsufficientStock(false)
        }
    }, [open, order])

    const loadPreview = async (currentOrder: ProductionOrder) => {
        setLoading(true)
        try {
            const { data, success } = await getRecipeDetail(currentOrder.receta_id)
            if (success && data) {
                const recipeRender = data.rendimiento || 1
                const factorOrden = currentOrder.cantidad_a_producir / recipeRender

                let hasInsufficient = false
                const previewData = data.ingredientes.map((ing: unknown) => {
                    const factorObj = ing.producto.factor_conversion || 1
                    const reqBase = ing.cantidad * factorOrden
                    const descStock = reqBase / factorObj
                    const actualStock = ing.producto.stock_actual || 0
                    const remaining = actualStock - descStock

                    if (remaining < 0) hasInsufficient = true

                    return {
                        id: ing.ingrediente_id,
                        nombre: ing.producto.nombre,
                        medida_compra: ing.producto.unidad_medida,
                        medida_receta: ing.producto.unidad_medida_base || ing.producto.unidad_medida,
                        factor: factorObj,
                        requerido_receta: reqBase,
                        descuento_stock: descStock,
                        stock_actual: actualStock,
                        stock_restante: remaining
                    }
                })

                setIngredients(previewData)
                setInsufficientStock(hasInsufficient)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!order) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Previsualización de Producción</DialogTitle>
                    <DialogDescription>
                        Orden #{order.numero_orden} - {order.producto.nombre} ({order.cantidad_a_producir} {order.producto.unidad_medida})
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {insufficientStock && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Stock Insuficiente</AlertTitle>
                                <AlertDescription>
                                    No tienes suficientes ingredientes para completar esta producción. Revisa los items marcados en rojo.
                                </AlertDescription>
                            </Alert>
                        )}
                        {!insufficientStock && ingredients.length > 0 && (
                            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle>Stock Suficiente</AlertTitle>
                                <AlertDescription>
                                    Cuentas con todos los insumos necesarios para completar esta orden.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Ingrediente</th>
                                        <th className="px-4 py-2 text-right font-medium">Requerido</th>
                                        <th className="px-4 py-2 text-right font-medium">Descuenta</th>
                                        <th className="px-4 py-2 text-right font-medium">Stock Actual</th>
                                        <th className="px-4 py-2 text-right font-medium">Stock Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingredients.map((ing) => (
                                        <tr key={ing.id} className="border-t">
                                            <td className="px-4 py-2 font-medium">{ing.nombre}</td>
                                            <td className="px-4 py-2 text-right">
                                                {ing.requerido_receta.toLocaleString(undefined, { maximumFractionDigits: 3 })} {ing.medida_receta}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-xs">
                                                -{ing.descuento_stock.toLocaleString(undefined, { maximumFractionDigits: 3 })} {ing.medida_compra}
                                            </td>
                                            <td className="px-4 py-2 text-right text-muted-foreground">
                                                {ing.stock_actual.toLocaleString(undefined, { maximumFractionDigits: 2 })} {ing.medida_compra}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-bold ${ing.stock_restante < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-500'}`}>
                                                {ing.stock_restante.toLocaleString(undefined, { maximumFractionDigits: 2 })} {ing.medida_compra}
                                            </td>
                                        </tr>
                                    ))}
                                    {ingredients.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                No se encontraron ingredientes para esta receta.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onConfirm(order.id)}
                        disabled={isProcessing || insufficientStock || loading}
                        className={insufficientStock ? "" : "bg-green-600 hover:bg-green-700"}
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Completado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
