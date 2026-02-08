"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Receipt } from "lucide-react"

interface DocumentSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (documentType: "Boleta" | "Factura") => void
    total: number
}

export function DocumentSelector({ open, onOpenChange, onSelect, total }: DocumentSelectorProps) {
    const [selectedType, setSelectedType] = useState<"Boleta" | "Factura">("Boleta")

    const handleContinue = () => {
        onSelect(selectedType)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Tipo de Documento</DialogTitle>
                    <DialogDescription className="sr-only">
                        Selecciona si deseas emitir una Boleta o una Factura para esta venta.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <RadioGroup
                        value={selectedType}
                        onValueChange={(value) => setSelectedType(value as "Boleta" | "Factura")}
                        className="space-y-3"
                    >
                        {/* Boleta */}
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Boleta" id="boleta" />
                            <Label
                                htmlFor="boleta"
                                className="flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                            >
                                <Receipt className="w-6 h-6 text-primary" />
                                <div className="flex-1">
                                    <div className="font-semibold text-base">Boleta</div>
                                    <div className="text-sm text-muted-foreground">
                                        Para consumidor final
                                    </div>
                                </div>
                            </Label>
                        </div>

                        {/* Factura */}
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Factura" id="factura" />
                            <Label
                                htmlFor="factura"
                                className="flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                            >
                                <FileText className="w-6 h-6 text-primary" />
                                <div className="flex-1">
                                    <div className="font-semibold text-base">Factura</div>
                                    <div className="text-sm text-muted-foreground">
                                        Para empresas (requiere RUT)
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>

                    {/* Total a pagar */}
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Total a Pagar:</span>
                            <span className="text-2xl font-bold text-primary">
                                ${Math.round(total).toLocaleString('es-CL')}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={handleContinue} className="flex-1">
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
