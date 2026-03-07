"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Package, Plus, Minus, Loader2 } from "lucide-react"
import { adjustStock } from "@/actions/inventory"

import { Permission } from "@/lib/roles"
import { useUserRole } from "@/hooks/useUserRole"

interface StockAdjusterProps {
    producto: unknown
    onSuccess: () => void
}

export function StockAdjuster({ producto, onSuccess }: StockAdjusterProps) {
    const { can } = useUserRole()
    const isRestockOnly = can("inventory.restock") && !can("inventory.adjust_stock")
    const [open, setOpen] = useState(false)
    const [adjustment, setAdjustment] = useState("")
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    const handleAdjust = async (delta: number) => {
        setLoading(true)
        try {
            const newStock = (producto as any).stock_actual + delta;
            const { error } = await supabase
                .from("productos")
                .update({ stock_actual: newStock }) // Changed 'stock' to 'stock_actual' based on existing code
                .eq("id", (producto as any).id)

            if (error) throw error

            toast.success("Stock actualizado", {
                description: `Nuevo stock para ${(producto as any).nombre}: ${newStock} ${(producto as any).unidad_medida}`
            })
            onSuccess?.()
            setOpen(false)
            setAdjustment("")
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado"
            // The original code uses 'sonner' toast (e.g., toast.error).
            // The provided instruction uses a different toast API (e.g., toast({ title: "Error", ... })).
            // To maintain syntactic correctness with the existing 'sonner' import,
            // we'll adapt the message to 'sonner's API. If a different toast library
            // is intended, its import and usage would need to be updated.
            toast.error("Error", {
                description: errorMessage,
            })
        } finally {
            // The instruction specified 'setSubmitting(false)', but 'setLoading' is the state variable defined.
            // Keeping 'setLoading(false)' to avoid introducing an undefined variable and maintain functionality.
            setLoading(false)
        }
    }

    const handleCustomAdjust = () => {
        const delta = parseFloat(adjustment)
        if (isNaN(delta)) {
            toast.error("Ingresa un número válido")
            return
        }
        if (isRestockOnly && delta < 0) {
            toast.error("Solo tienes permiso para agregar stock (reposición)")
            return
        }
        handleAdjust(delta)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" title="Ajustar Stock">
                    <Package className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-sm mb-1">Ajustar Stock</h4>
                        <p className="text-xs text-muted-foreground">
                            Stock actual: <strong>{producto.stock_actual?.toFixed(3)} {producto.unidad_medida === 'unidades' ? 'uds' : producto.unidad_medida}</strong>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjust(-1)}
                            disabled={loading || isRestockOnly || (producto.stock_actual || 0) === 0}
                            className="flex-1"
                        >
                            <Minus className="w-4 h-4 mr-1" />
                            -1
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjust(1)}
                            disabled={loading}
                            className="flex-1"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            +1
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjust(-10)}
                            disabled={loading || isRestockOnly || (producto.stock_actual || 0) === 0}
                            className="flex-1"
                        >
                            -10
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjust(10)}
                            disabled={loading}
                            className="flex-1"
                        >
                            +10
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium">Ajuste personalizado</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                step="0.001"
                                placeholder="+/- cantidad"
                                value={adjustment}
                                onChange={(e) => setAdjustment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCustomAdjust()
                                    }
                                }}
                                disabled={loading}
                            />
                            <Button
                                size="sm"
                                onClick={handleCustomAdjust}
                                disabled={loading || !adjustment}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "OK"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
