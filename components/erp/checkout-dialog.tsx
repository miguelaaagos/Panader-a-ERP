"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Banknote, Landmark, Loader2, AlertCircle } from "lucide-react"

interface CheckoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    total: number
    onConfirm: (data: CheckoutData) => void
    submitting: boolean
    hasActiveSession: boolean
}

export interface CheckoutData {
    metodo_pago: "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia"
    cliente_nombre?: string
    cliente_rut?: string
    notas?: string
    tipo_documento?: "Boleta" | "Factura" | "Ticket"
}

export function CheckoutDialog({ open, onOpenChange, total, onConfirm, submitting, hasActiveSession }: CheckoutDialogProps) {
    const [metodoPago, setMetodoPago] = useState<CheckoutData["metodo_pago"]>("efectivo")
    const [tipoDocumento, setTipoDocumento] = useState<CheckoutData["tipo_documento"]>("Boleta")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm({
            metodo_pago: metodoPago,
            tipo_documento: tipoDocumento
        })
    }

    const paymentOptions = [
        { id: "efectivo", label: "Efectivo", icon: Banknote },
        { id: "tarjeta_debito", label: "Débito", icon: CreditCard },
        { id: "tarjeta_credito", label: "Crédito", icon: CreditCard },
        { id: "transferencia", label: "Transferencia", icon: Landmark },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Finalizar Venta
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto px-6 pb-2 flex-1">
                    {!hasActiveSession && (
                        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-start gap-2 text-destructive text-sm mt-2 mb-4">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Caja no detectada</p>
                                <p>No se puede procesar el pago sin un turno activo.</p>
                            </div>
                        </div>
                    )}

                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6 py-2">
                        <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10 space-y-2">
                            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total a Pagar</span>

                            <div className="flex flex-col gap-1 py-1 mb-1 border-b border-dashed border-primary/20 pb-2">
                                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                                    <span>IVA (19%) incluido:</span>
                                    <span>${Math.round(total - (total / 1.19)).toLocaleString("es-CL")}</span>
                                </div>
                            </div>

                            <div className="text-4xl font-black text-primary mt-1">
                                ${total.toLocaleString("es-CL")}
                            </div>
                            <p className="text-xs text-muted-foreground italic mt-2">
                                * El total incluye IVA y es válido para todos los métodos de pago.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base">Documento</Label>
                            <Select value={tipoDocumento} onValueChange={(v: string) => setTipoDocumento(v as CheckoutData["tipo_documento"])}>
                                <SelectTrigger className="w-full h-11">
                                    <SelectValue placeholder="Tipo de Documento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Boleta">Boleta</SelectItem>
                                    <SelectItem value="Factura">Factura</SelectItem>
                                    <SelectItem value="Ticket">Ticket Interno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pb-4">
                            <Label className="text-base">Médodo de Pago</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {paymentOptions.map((opt) => {
                                    const Icon = opt.icon
                                    const isActive = metodoPago === opt.id
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setMetodoPago(opt.id as CheckoutData["metodo_pago"])}
                                            className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all ${isActive
                                                ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                                                : "hover:bg-muted border-input"
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-6 pt-4 border-t mt-auto bg-background shrink-0 gap-2 sm:gap-0">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Volver
                    </Button>
                    <Button
                        type="submit"
                        form="checkout-form"
                        size="lg"
                        className="px-8 font-bold text-lg h-12"
                        disabled={submitting || !hasActiveSession}
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Confirmar Pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Separator({ Label }: { Label: string }) {
    return (
        <div className="relative flex items-center py-2">
            <div className="flex-grow border-t"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{Label}</span>
            <div className="flex-grow border-t"></div>
        </div>
    )
}
