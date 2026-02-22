"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Banknote, Landmark, User, FileText, Loader2, AlertCircle } from "lucide-react"

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
    const [clienteNombre, setClienteNombre] = useState("")
    const [clienteRut, setClienteRut] = useState("")
    const [notas, setNotas] = useState("")
    const [tipoDocumento, setTipoDocumento] = useState<CheckoutData["tipo_documento"]>("Boleta")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm({
            metodo_pago: metodoPago,
            cliente_nombre: clienteNombre.trim() || undefined,
            cliente_rut: clienteRut.trim() || undefined,
            notas: notas.trim() || undefined,
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Finalizar Venta
                    </DialogTitle>
                </DialogHeader>

                {!hasActiveSession && (
                    <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-start gap-2 text-destructive text-sm mt-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Caja no detectada</p>
                            <p>No se puede procesar el pago sin un turno activo.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total a Pagar</span>
                        <div className="text-4xl font-black text-primary mt-1">
                            ${total.toLocaleString("es-CL")}
                        </div>
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

                    <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10 space-y-2">
                        <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total a Pagar</span>

                        {(metodoPago === "tarjeta_debito" || metodoPago === "tarjeta_credito") && (
                            <div className="flex flex-col gap-1 py-1 mb-1 border-b border-dashed border-primary/20 pb-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Subtotal:</span>
                                    <span>${total.toLocaleString("es-CL")}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-orange-600">
                                    <span>Recargo IVA (19%):</span>
                                    <span>+${Math.round(total * 0.19).toLocaleString("es-CL")}</span>
                                </div>
                            </div>
                        )}

                        <div className="text-4xl font-black text-primary mt-1">
                            ${((metodoPago === "tarjeta_debito" || metodoPago === "tarjeta_credito")
                                ? Math.round(total * 1.19)
                                : total
                            ).toLocaleString("es-CL")}
                        </div>
                        {(metodoPago === "tarjeta_debito" || metodoPago === "tarjeta_credito") && (
                            <p className="text-[10px] text-muted-foreground italic">
                                * Se aplica 19% de recargo por pago con tarjeta
                            </p>
                        )}
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
                        <Button
                            type="submit"
                            size="lg"
                            className="px-8 font-bold text-lg h-12"
                            disabled={submitting || !hasActiveSession}
                        >
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
