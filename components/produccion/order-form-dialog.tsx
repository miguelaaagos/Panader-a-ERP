"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"
import { getRecipes, getRecipeDetail } from "@/actions/recipes"
import { createProductionOrder } from "@/actions/production"

interface OrderFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function OrderFormDialog({ open, onOpenChange, onSuccess }: OrderFormDialogProps) {
    const [recipes, setRecipes] = useState<any[]>([])
    const [selectedRecipeId, setSelectedRecipeId] = useState("")
    const [recipeDetail, setRecipeDetail] = useState<any>(null)
    const [cantidad, setCantidad] = useState("1")
    const [notas, setNotas] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            fetchRecipes()
        } else {
            // Reset state
            setSelectedRecipeId("")
            setRecipeDetail(null)
            setCantidad("1")
            setNotas("")
        }
    }, [open])

    const fetchRecipes = async () => {
        setLoading(true)
        const result = await getRecipes()
        if (result.success) {
            setRecipes(result.data?.filter((r: any) => r.activa) || [])
        }
        setLoading(false)
    }

    const handleRecipeChange = async (id: string) => {
        setSelectedRecipeId(id)
        setLoading(true)
        const result = await getRecipeDetail(id)
        if (result.success) {
            setRecipeDetail(result.data)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRecipeId || !cantidad) {
            toast.error("Por favor completa los campos requeridos")
            return
        }

        setSubmitting(true)
        const result = await createProductionOrder({
            receta_id: selectedRecipeId,
            cantidad_a_producir: parseFloat(cantidad),
            notas: notas.trim() || undefined
        })

        if (result.success) {
            toast.success("Orden de producción creada")
            onSuccess()
            onOpenChange(false)
        } else {
            toast.error("Error: " + result.error)
        }
        setSubmitting(false)
    }

    const factor = (parseFloat(cantidad) || 0) / (recipeDetail?.rendimiento || 1)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva Orden de Producción</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Seleccionar Receta</Label>
                        <Select onValueChange={handleRecipeChange} value={selectedRecipeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Elige una receta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {recipes.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                        {r.nombre} ({r.producto?.nombre})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Cantidad a Producir ({recipeDetail?.producto?.unidad_medida || ""})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            placeholder="Ej: 10"
                        />
                        {recipeDetail && (
                            <p className="text-xs text-muted-foreground">
                                Rendimiento base de la receta: {recipeDetail.rendimiento} {recipeDetail.producto?.unidad_medida}
                            </p>
                        )}
                    </div>

                    {recipeDetail && recipeDetail.ingredientes && (
                        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground font-semibold">Insumos Estimados</Label>
                            <div className="space-y-1">
                                {recipeDetail.ingredientes.map((ing: any) => {
                                    const required = ing.cantidad * factor
                                    const isShort = Number(ing.producto?.stock_actual || 0) < required
                                    return (
                                        <div key={ing.id} className="flex justify-between text-xs">
                                            <span>{ing.producto?.nombre}</span>
                                            <span className={isShort ? "text-red-600 font-medium" : ""}>
                                                {required.toFixed(2)} / {Number(ing.producto?.stock_actual || 0).toFixed(2)} {ing.producto?.unidad_medida}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            {recipeDetail.ingredientes.some((ing: any) => Number(ing.producto?.stock_actual || 0) < (ing.cantidad * factor)) && (
                                <div className="flex items-center gap-1 text-[10px] text-red-600 mt-2">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Stock insuficiente para algunos ingredientes</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Notas (opcional)</Label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Instrucciones adicionales..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting || loading}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Crear Orden
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
