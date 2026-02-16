"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scale, Banknote, Calculator } from "lucide-react"
import { Product } from "./product-grid"

interface WeighItemDialogProps {
    product: Product | null
    onConfirm: (product: Product, quantity: number) => void
    onClose: () => void
}

export function WeighItemDialog({ product, onConfirm, onClose }: WeighItemDialogProps) {
    const [weight, setWeight] = useState<string>("")
    const [totalPrice, setTotalPrice] = useState<string>("")
    const [mode, setMode] = useState<"weight" | "price">("price")

    useEffect(() => {
        if (product) {
            setWeight("")
            setTotalPrice("")
            setMode("price") // Default to price as user mentioned scale prints price
        }
    }, [product])

    if (!product) return null

    const unitPrice = product.precio_venta

    const handleWeightChange = (val: string) => {
        setWeight(val)
        if (val && !isNaN(Number(val))) {
            const calculatedPrice = Math.round(Number(val) * unitPrice)
            setTotalPrice(calculatedPrice.toString())
        } else {
            setTotalPrice("")
        }
    }

    const handlePriceChange = (val: string) => {
        setTotalPrice(val)
        if (val && !isNaN(Number(val)) && unitPrice > 0) {
            const calculatedWeight = (Number(val) / unitPrice).toFixed(3)
            setWeight(calculatedWeight)
        } else {
            setWeight("")
        }
    }

    const handleConfirm = () => {
        const finalWeight = Number(weight)
        if (isNaN(finalWeight) || finalWeight <= 0) return
        onConfirm(product, finalWeight)
        onClose()
    }

    return (
        <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Scale className="h-5 w-5 text-primary" />
                        Pesar: {product.nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Ingrese el precio o el peso impreso en la balanza.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Precio por {product.unidad_medida}</span>
                        <span className="text-2xl font-black text-primary">${unitPrice.toLocaleString("es-CL")}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price" className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Precio de Balanza ($)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="Ej: 1500"
                                className="text-lg h-12 font-bold"
                                value={totalPrice}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-border flex-1" />
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">O TAMBIÉN</span>
                            <div className="h-px bg-border flex-1" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="weight" className="flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                Peso Total ({product.unidad_medida})
                            </Label>
                            <div className="relative">
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.001"
                                    placeholder="Ej: 0.550"
                                    className="text-lg h-12 font-medium"
                                    value={weight}
                                    onChange={(e) => handleWeightChange(e.target.value)}
                                />
                                <span className="absolute right-3 top-3 text-muted-foreground font-medium">
                                    {product.unidad_medida}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleConfirm}
                        className="px-8 font-bold"
                        disabled={!weight || Number(weight) <= 0}
                    >
                        Confirmar e Incluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
