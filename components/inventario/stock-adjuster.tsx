"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Package, Plus, Minus, Loader2 } from "lucide-react"
import { adjustStock } from "@/actions/inventory"

interface StockAdjusterProps {
    producto: any
    onSuccess: () => void
}

export function StockAdjuster({ producto, onSuccess }: StockAdjusterProps) {
    const [open, setOpen] = useState(false)
    const [adjustment, setAdjustment] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAdjust = async (delta: number) => {
        setLoading(true)
        try {
            const result = await adjustStock(producto.id, delta)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success(`Stock actualizado a ${result.newStock} unidades`)
            onSuccess()
            setOpen(false)
            setAdjustment("")
        } catch (error: any) {
            console.error("Error adjusting stock:", error)
            toast.error("Error al ajustar stock", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCustomAdjust = () => {
        const delta = parseInt(adjustment)
        if (isNaN(delta)) {
            toast.error("Ingresa un número válido")
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
                            Stock actual: <strong>{(producto.stock_actual || 0)} uds</strong>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjust(-1)}
                            disabled={loading || (producto.stock_actual || 0) === 0}
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
                            disabled={loading || (producto.stock_actual || 0) === 0}
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
