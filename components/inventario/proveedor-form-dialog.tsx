"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { crearProveedor, updateProveedor, type Proveedor } from "@/actions/proveedores"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    rut: z.string().optional(),
    email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ProveedorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    proveedorSelected?: Proveedor | null
    onSuccess?: () => void
}

export function ProveedorFormDialog({
    open,
    onOpenChange,
    proveedorSelected,
    onSuccess
}: ProveedorFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            email: "",
            telefono: "",
            direccion: ""
        }
    })

    useEffect(() => {
        if (open) {
            if (proveedorSelected) {
                form.reset({
                    nombre: proveedorSelected.nombre,
                    rut: proveedorSelected.rut || "",
                    email: proveedorSelected.email || "",
                    telefono: proveedorSelected.telefono || "",
                    direccion: proveedorSelected.direccion || "",
                })
            } else {
                form.reset({
                    nombre: "",
                    rut: "",
                    email: "",
                    telefono: "",
                    direccion: ""
                })
            }
        }
    }, [open, proveedorSelected, form])

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            let result;

            if (proveedorSelected) {
                result = await updateProveedor(proveedorSelected.id, data)
            } else {
                result = await crearProveedor(
                    data.nombre,
                    data.telefono,
                    data.email,
                    data.rut,
                    data.direccion
                )
            }

            if (result.success) {
                toast.success(proveedorSelected ? "Proveedor actualizado con éxito" : "Proveedor creado con éxito")
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error(result.error || "Ocurrió un error al guardar el proveedor")
            }
        } catch (error: any) {
            toast.error(error.message || "Ocurrió un error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{proveedorSelected ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
                        <DialogDescription>
                            {proveedorSelected
                                ? "Modifica los datos del proveedor."
                                : "Ingresa los datos del nuevo proveedor para tu empresa."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre / Razón Social <span className="text-red-500">*</span></Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Molinera del Sur S.A."
                                {...form.register("nombre")}
                            />
                            {form.formState.errors.nombre && (
                                <p className="text-xs text-red-500">{form.formState.errors.nombre.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rut">RUT</Label>
                                <Input
                                    id="rut"
                                    placeholder="Ej: 76.123.456-7"
                                    {...form.register("rut")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input
                                    id="telefono"
                                    placeholder="Ej: +569..."
                                    {...form.register("telefono")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contacto@empresa.cl"
                                {...form.register("email")}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                placeholder="Ingresa la dirección completa"
                                {...form.register("direccion")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {proveedorSelected ? "Guardar Cambios" : "Agregar Proveedor"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
