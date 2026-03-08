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
import { Controller } from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    rut: z.string().optional(),
    email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
    banco: z.string().optional(),
    tipo_cuenta: z.string().optional(),
    numero_cuenta: z.string().optional(),
    rut_pago: z.string().optional(),
    email_pago: z.string().email("Email de pago inválido").optional().or(z.literal("")),
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
            direccion: "",
            banco: "",
            tipo_cuenta: "",
            numero_cuenta: "",
            rut_pago: "",
            email_pago: ""
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
                    banco: proveedorSelected.banco || "",
                    tipo_cuenta: proveedorSelected.tipo_cuenta || "",
                    numero_cuenta: proveedorSelected.numero_cuenta || "",
                    rut_pago: proveedorSelected.rut_pago || "",
                    email_pago: proveedorSelected.email_pago || "",
                })
            } else {
                form.reset({
                    nombre: "",
                    rut: "",
                    email: "",
                    telefono: "",
                    direccion: "",
                    banco: "",
                    tipo_cuenta: "",
                    numero_cuenta: "",
                    rut_pago: "",
                    email_pago: ""
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
                    data.direccion,
                    data.banco,
                    data.tipo_cuenta,
                    data.numero_cuenta,
                    data.rut_pago,
                    data.email_pago
                )
            }

            if (result.success) {
                toast.success(proveedorSelected ? "Proveedor actualizado con éxito" : "Proveedor creado con éxito")
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error(result.error || "Ocurrió un error al guardar el proveedor")
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado"
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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

                        {/* Información Bancaria */}
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-4 text-primary uppercase tracking-wider">Información Bancaria (Para Pagos)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="banco">Banco</Label>
                                    <Input
                                        id="banco"
                                        placeholder="Ej: Banco Estado"
                                        {...form.register("banco")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tipo_cuenta">Tipo de Cuenta</Label>
                                    <Controller
                                        name="tipo_cuenta"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <SelectTrigger id="tipo_cuenta">
                                                    <SelectValue placeholder="Selecciona tipo..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                                                    <SelectItem value="Cuenta Vista / RUT">Cuenta Vista / RUT</SelectItem>
                                                    <SelectItem value="Cuenta de Ahorro">Cuenta de Ahorro</SelectItem>
                                                    <SelectItem value="Chequera Electrónica">Chequera Electrónica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="numero_cuenta">Número de Cuenta</Label>
                                    <Input
                                        id="numero_cuenta"
                                        placeholder="0000000000"
                                        {...form.register("numero_cuenta")}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rut_pago">RUT para Transferencia</Label>
                                    <Input
                                        id="rut_pago"
                                        placeholder="Mismo que RUT empresa?"
                                        {...form.register("rut_pago")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email_pago">Email para Comprobante</Label>
                                    <Input
                                        id="email_pago"
                                        type="email"
                                        placeholder="pagos@empresa.cl"
                                        {...form.register("email_pago")}
                                    />
                                </div>
                            </div>
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
