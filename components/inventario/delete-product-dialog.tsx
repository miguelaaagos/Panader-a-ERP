"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deleteProduct, hardDeleteProduct } from "@/actions/inventory"

interface DeleteProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    producto: any
    onSuccess: () => void
}

export function DeleteProductDialog({ open, onOpenChange, producto, onSuccess }: DeleteProductDialogProps) {
    const [loading, setLoading] = useState(false)
    const [hasVentas, setHasVentas] = useState(false)
    const [checkingVentas, setCheckingVentas] = useState(false)

    const checkVentasAsociadas = async () => {
        if (!producto) return

        setCheckingVentas(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("venta_detalles")
                .select("id")
                .eq("producto_id", producto.id)
                .limit(1)

            if (error) throw error

            setHasVentas((data?.length || 0) > 0)
        } catch (error: any) {
            console.error("Error checking ventas:", JSON.stringify(error, null, 2))
        } finally {
            setCheckingVentas(false)
        }
    }

    const handleDelete = async () => {
        if (!producto) return

        setLoading(true)
        try {
            const result = await hardDeleteProduct(producto.id)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success("Producto eliminado correctamente")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error deleting product:", error)
            toast.error("Error al eliminar producto", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!producto) return

        setLoading(true)
        try {
            const result = await deleteProduct(producto.id)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success("Producto desactivado correctamente", {
                description: "El producto ya no aparecerá en el POS pero se mantendrá el historial de ventas."
            })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error deactivating product:", error)
            toast.error("Error al desactivar producto", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    // Verificar ventas cuando se abre el dialog
    useEffect(() => {
        if (open && producto) {
            setHasVentas(false) // Reset state
            checkVentasAsociadas()
        }
    }, [open, producto?.id])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Eliminar Producto
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {checkingVentas ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : hasVentas ? (
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            <AlertDescription>
                                <strong className="text-amber-900 dark:text-amber-100">Este producto tiene ventas asociadas</strong>
                                <p className="mt-2 text-amber-800 dark:text-amber-200">
                                    El producto <strong>{producto?.nombre}</strong> tiene ventas registradas.
                                    Te recomendamos <strong>desactivarlo</strong> en lugar de eliminarlo para mantener el historial de ventas.
                                </p>
                                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                    Al desactivar el producto, dejará de aparecer en el POS pero se mantendrá toda la información histórica.
                                </p>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-2">
                            <p>
                                ¿Estás seguro de que deseas eliminar el producto <strong>{producto?.nombre}</strong>?
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Este producto no tiene ventas asociadas y puede ser eliminado de forma segura.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    {hasVentas ? (
                        <>
                            <Button variant="default" onClick={handleDeactivate} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Desactivando...
                                    </>
                                ) : (
                                    "Desactivar Producto"
                                )}
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    "Eliminar de Todos Modos"
                                )}
                            </Button>
                        </>
                    ) : !checkingVentas && (
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar Producto"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
