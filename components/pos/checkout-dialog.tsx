"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Banknote, Landmark, User, FileText, Loader2 } from "lucide-react"

interface CheckoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    total: number
    onConfirm: (data: CheckoutData) => void
    submitting: boolean
}

export interface CheckoutData {
    metodo_pago: "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia"
    cliente_nombre?: string
    cliente_rut?: string
    notas?: string
}

export function CheckoutDialog({ open, onOpenChange, total, onConfirm, submitting }: CheckoutDialogProps) {
    const [metodoPago, setMetodoPago] = useState<CheckoutData["metodo_pago"]>("efectivo")
    const [clienteNombre, setClienteNombre] = useState("")
    const [clienteRut, setClienteRut] = useState("")
    const [notas, setNotas] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm({
            metodo_pago: metodoPago,
            cliente_nombre: clienteNombre.trim() || undefined,
            cliente_rut: clienteRut.trim() || undefined,
            notas: notas.trim() || undefined
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Finalizar Venta
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total a Pagar</span>
                        <div className="text-4xl font-black text-primary mt-1">
                            ${total.toLocaleString("es-CL")}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base">Médodo de Pago</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentOptions.map((opt) => {
                                const Icon = opt.icon
                                const isActive = metodoPago === opt.id
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setMetodoPago(opt.id as any)}
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

                    <div className="space-y-4">
                        <Separator Label="Datos del Cliente (Opcional)" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rut" className="text-xs">RUT</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="rut"
                                        placeholder="12.345.678-9"
                                        className="pl-8 text-sm"
                                        value={clienteRut}
                                        onChange={(e) => setClienteRut(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-xs">Nombre</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Juan Pérez"
                                    className="text-sm"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notas" className="text-xs">Notas de la Venta</Label>
                            <div className="relative">
                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="notas"
                                    placeholder="Ej: Entrega a domicilio"
                                    className="pl-8 text-sm"
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Volver
                        </Button>
                        <Button type="submit" size="lg" className="px-8 font-bold text-lg h-12" disabled={submitting}>
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            Confirmar Pago
                        </Button>
                    </DialogFooter>
                </form>
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
