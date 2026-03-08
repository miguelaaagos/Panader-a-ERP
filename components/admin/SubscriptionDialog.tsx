"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { updateTenantSubscription } from "@/actions/admin"
import { Loader2, CreditCard } from "lucide-react"

interface SubscriptionDialogProps {
    tenantId: string
    tenantName: string
    currentTier: 'initial' | 'advanced' | 'pro'
}

export function SubscriptionDialog({
    tenantId,
    tenantName,
    currentTier
}: SubscriptionDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newTier, setNewTier] = useState<string>(currentTier)

    const handleUpdate = async () => {
        if (newTier === currentTier) {
            setOpen(false)
            return
        }

        setLoading(true)
        try {
            const result = await updateTenantSubscription(
                tenantId,
                newTier as 'initial' | 'advanced' | 'pro'
            )

            if (result.success) {
                toast.success(`Plan de ${tenantName} actualizado a ${newTier.toUpperCase()}`)
                setOpen(false)
            } else {
                toast.error(result.error || "Error al actualizar el plan")
            }
        } catch (error) {
            toast.error("Error de red o servidor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1 py-1"
                >
                    <CreditCard className="h-3 w-3" />
                    Gestionar Plan
                </Badge>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Nivel de Suscripción</DialogTitle>
                    <DialogDescription>
                        Actualiza el acceso para <strong>{tenantName}</strong>.
                        Este cambio se aplicará de inmediato y quedará registrado en la auditoría.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Nivel de suscripción</label>
                        <Select
                            value={newTier}
                            onValueChange={setNewTier}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona un nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="initial">Inicial (Gratuito)</SelectItem>
                                <SelectItem value="advanced">Avanzado</SelectItem>
                                <SelectItem value="pro">Profesional (Full)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={loading || newTier === currentTier}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Cambio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
