"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { validateRut, formatRut } from "@/lib/utils/rut-validator"
import { toast } from "sonner"

interface InvoiceFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (clientData: ClientData) => void
}

export interface ClientData {
    rut: string
    razon_social: string
    direccion: string
    giro: string
}

export function InvoiceForm({ open, onOpenChange, onSubmit }: InvoiceFormProps) {
    const [rut, setRut] = useState("")
    const [razonSocial, setRazonSocial] = useState("")
    const [direccion, setDireccion] = useState("")
    const [giro, setGiro] = useState("")
    const [rutError, setRutError] = useState("")

    const handleRutChange = (value: string) => {
        setRut(value)
        setRutError("")

        // Auto-formatear mientras escribe
        if (value.length >= 8) {
            const formatted = formatRut(value)
            if (formatted !== value) {
                setRut(formatted)
            }
        }
    }

    const handleRutBlur = () => {
        if (rut && !validateRut(rut)) {
            setRutError("RUT inválido")
        } else if (rut) {
            setRut(formatRut(rut))
        }
    }

    const handleSubmit = () => {
        // Validaciones
        if (!rut.trim()) {
            toast.error("El RUT es obligatorio")
            return
        }

        if (!validateRut(rut)) {
            setRutError("RUT inválido")
            toast.error("Por favor ingresa un RUT válido")
            return
        }

        if (!razonSocial.trim()) {
            toast.error("La Razón Social es obligatoria")
            return
        }

        // Enviar datos
        onSubmit({
            rut: formatRut(rut),
            razon_social: razonSocial.trim(),
            direccion: direccion.trim(),
            giro: giro.trim()
        })

        // Limpiar formulario
        setRut("")
        setRazonSocial("")
        setDireccion("")
        setGiro("")
        setRutError("")
    }

    const handleCancel = () => {
        setRut("")
        setRazonSocial("")
        setDireccion("")
        setGiro("")
        setRutError("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Datos para Factura</DialogTitle>
                    <DialogDescription className="sr-only">
                        Ingresa el RUT y Razón Social del cliente para generar la factura.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* RUT */}
                    <div className="space-y-2">
                        <Label htmlFor="rut" className="text-sm font-medium">
                            RUT <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="rut"
                            placeholder="12.345.678-9"
                            value={rut}
                            onChange={(e) => handleRutChange(e.target.value)}
                            onBlur={handleRutBlur}
                            className={rutError ? "border-destructive" : ""}
                            maxLength={12}
                        />
                        {rutError && (
                            <p className="text-sm text-destructive">{rutError}</p>
                        )}
                    </div>

                    {/* Razón Social */}
                    <div className="space-y-2">
                        <Label htmlFor="razon-social" className="text-sm font-medium">
                            Razón Social <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="razon-social"
                            placeholder="Empresa S.A."
                            value={razonSocial}
                            onChange={(e) => setRazonSocial(e.target.value)}
                            maxLength={255}
                        />
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                        <Label htmlFor="direccion" className="text-sm font-medium">
                            Dirección
                        </Label>
                        <Input
                            id="direccion"
                            placeholder="Av. Principal 123, Comuna"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            maxLength={255}
                        />
                    </div>

                    {/* Giro */}
                    <div className="space-y-2">
                        <Label htmlFor="giro" className="text-sm font-medium">
                            Giro
                        </Label>
                        <Input
                            id="giro"
                            placeholder="Comercio de alimentos"
                            value={giro}
                            onChange={(e) => setGiro(e.target.value)}
                            maxLength={255}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1">
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
