
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SuccessModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: {
        id: string
        total: number
        metodo_pago: string
        tipo_documento: string
        change?: number
    } | null
    onNewSale: () => void
}

export function SuccessModal({ open, onOpenChange, transaction, onNewSale }: SuccessModalProps) {
    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader className="pt-8 px-6">
                    <div className="mx-auto bg-green-500/10 p-4 rounded-full mb-6 ring-1 ring-green-500/20">
                        <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500 fill-green-500/10" />
                    </div>
                    <DialogTitle className="text-3xl font-black text-center text-foreground tracking-tight">
                        ¡Venta Procesada!
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2 text-muted-foreground">
                        El comprobante ha sido generado correctamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-sm border border-border/50 p-6 rounded-2xl shadow-inner space-y-4">
                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Documento</span>
                            <Badge variant="outline" className="font-semibold px-3 py-0.5 bg-background/50">
                                {transaction.tipo_documento}
                            </Badge>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Transacción</span>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted p-1 rounded">
                                {transaction.id.slice(0, 12)}...
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Pago</span>
                            <span className="font-bold text-sm capitalize">{transaction.metodo_pago.replace('_', ' ')}</span>
                        </div>

                        <div className="pt-4 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-1">Monto Total</span>
                            <div className="text-5xl font-black tracking-tighter text-primary">
                                ${transaction.total.toLocaleString("es-CL")}
                            </div>
                        </div>

                        {transaction.change !== undefined && transaction.change > 0 && (
                            <div className="pt-2 flex justify-center">
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none px-4 py-1 text-xs">
                                    Vuelto: ${transaction.change.toLocaleString("es-CL")}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 pb-8 pt-2">
                    <Button
                        size="lg"
                        className="w-full font-bold text-lg h-14 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                        onClick={() => {
                            onOpenChange(false)
                            onNewSale()
                        }}
                    >
                        <Ticket className="w-6 h-6 mr-3" />
                        NUEVA VENTA
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
