"use client"

import { useState } from "react"
import { Copy, Check, Landmark, CreditCard, User, Mail, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface QuickCopyBankInfoProps {
    proveedor: {
        nombre: string
        banco: string | null
        tipo_cuenta: string | null
        numero_cuenta: string | null
        rut_pago: string | null
        email_pago: string | null
    }
}

export function QuickCopyBankInfo({ proveedor }: QuickCopyBankInfoProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const copyToClipboard = (text: string, fieldName: string) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        toast.success(`${fieldName} copiado`)
        setTimeout(() => setCopiedField(null), 2000)
    }

    if (!proveedor.banco && !proveedor.numero_cuenta) {
        return (
            <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg bg-muted/20">
                Sin información bancaria registrada.
            </div>
        )
    }

    const items = [
        { label: "Banco", value: proveedor.banco, icon: Landmark },
        { label: "Tipo", value: proveedor.tipo_cuenta, icon: CreditCard },
        { label: "Cuenta", value: proveedor.numero_cuenta, icon: Hash },
        { label: "RUT", value: proveedor.rut_pago, icon: User },
        { label: "Email", value: proveedor.email_pago, icon: Mail },
    ].filter(item => item.value)

    return (
        <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Datos de Transferencia</h4>
                <div className="px-2 py-1 bg-primary/10 rounded-full text-[10px] font-bold text-primary">
                    MÓVIL READY
                </div>
            </div>

            <div className="grid gap-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(item.value!, item.label)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-muted rounded-md group-hover:bg-background transition-colors">
                                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground leading-none mb-1">{item.label}</p>
                                <p className="text-sm font-medium leading-none">{item.value}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {copiedField === item.label ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                className="w-full mt-2 text-xs font-bold gap-2 bg-primary/90 hover:bg-primary transition-all active:scale-95"
                variant="default"
                onClick={() => {
                    const allInfo = `
Proveedor: ${proveedor.nombre}
Banco: ${proveedor.banco || 'N/A'}
Tipo: ${proveedor.tipo_cuenta || 'N/A'}
Cuenta: ${proveedor.numero_cuenta || 'N/A'}
RUT: ${proveedor.rut_pago || 'N/A'}
Email: ${proveedor.email_pago || 'N/A'}
                    `.trim()
                    copyToClipboard(allInfo, "Todos los datos")
                }}
            >
                {copiedField === "Todos los datos" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                COPIAR TODO PARA TRANSFERIR
            </Button>
        </div>
    )
}
