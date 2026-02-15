"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, ShoppingBasket } from "lucide-react"

export interface CartItem {
    producto_id: string
    nombre: string
    precio_unitario: number
    cantidad: number
    stock_actual: number
}

interface CartPanelProps {
    items: CartItem[]
    onUpdateQuantity: (id: string, delta: number) => void
    onRemoveItem: (id: string) => void
    onCheckout: () => void
    subtotal: number
}

export function CartPanel({ items, onUpdateQuantity, onRemoveItem, onCheckout, subtotal }: CartPanelProps) {
    return (
        <div className="flex flex-col h-full border rounded-lg bg-background shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Carrito de Venta</h2>
            </div>

            <ScrollArea className="flex-1 p-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground opacity-60 italic">
                        <ShoppingBasket className="h-12 w-12 mb-2 stroke-1" />
                        <p>El carrito está vacío</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.producto_id} className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-sm leading-tight">{item.nombre}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => onRemoveItem(item.producto_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onUpdateQuantity(item.producto_id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onUpdateQuantity(item.producto_id, 1)}
                                            disabled={item.cantidad >= item.stock_actual}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <span className="font-bold text-sm">
                                        ${(item.precio_unitario * item.cantidad).toLocaleString("es-CL")}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 bg-muted/10 border-t space-y-4">
                <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${subtotal.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${subtotal.toLocaleString("es-CL")}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg font-bold shadow-md"
                    disabled={items.length === 0}
                    onClick={onCheckout}
                >
                    PAGAR ${subtotal.toLocaleString("es-CL")}
                </Button>
            </div>
        </div>
    )
}
