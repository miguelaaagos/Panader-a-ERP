
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Ticket, Printer } from "lucide-react"

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
                <DialogHeader>
                    <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center text-green-700">
                        ¡Venta Exitosa!
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        La transacción se ha procesado correctamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Documento</span>
                            <span className="font-medium">{transaction.tipo_documento}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">ID Transacción</span>
                            <span className="font-mono text-xs">{transaction.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Método de Pago</span>
                            <span className="font-medium">{transaction.metodo_pago}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between items-center">
                            <span className="font-bold text-lg">Total Pagado</span>
                            <span className="font-bold text-2xl text-primary">
                                ${transaction.total.toLocaleString("es-CL")}
                            </span>
                        </div>
                        {transaction.change !== undefined && transaction.change > 0 && (
                            <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                                <span>Vuelto</span>
                                <span>${transaction.change.toLocaleString("es-CL")}</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-2">
                    <Button
                        size="lg"
                        className="w-full font-bold text-lg h-12"
                        onClick={() => {
                            onOpenChange(false)
                            onNewSale()
                        }}
                    >
                        <Ticket className="w-5 h-5 mr-2" />
                        Nueva Venta
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Comprobante
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
