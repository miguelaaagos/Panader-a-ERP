"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteProveedor, type Proveedor } from "@/actions/proveedores"
import { toast } from "sonner"
import { AlertTriangle, Loader2 } from "lucide-react"

interface DeleteProveedorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    proveedor: Proveedor | null
    onSuccess?: () => void
}

export function DeleteProveedorDialog({
    open,
    onOpenChange,
    proveedor,
    onSuccess
}: DeleteProveedorDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!proveedor) return null

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteProveedor(proveedor.id)

            if (result.success) {
                toast.success("Proveedor eliminado con éxito")
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error(result.error || "No se pudo eliminar el proveedor")
            }
        } catch (error: any) {
            toast.error(error.message || "Ocurrió un error inesperado")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Eliminar Proveedor
                    </DialogTitle>
                    <DialogDescription className="pt-3">
                        ¿Estás seguro que deseas eliminar el proveedor <strong>{proveedor.nombre}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-3 text-sm rounded-md space-y-1">
                    <p>⛔ Esta acción no se puede deshacer.</p>
                    <p>⚠️ Si el proveedor tiene compras asociadas en el historial, el sistema rechazará la eliminación para mantener la integridad de los datos. En ese caso, te recomendamos sólo editar sus datos.</p>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
