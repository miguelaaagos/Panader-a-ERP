"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Receipt } from "lucide-react"

interface Transaction {
    id: string
    created_at: string
    total: number
    metodo_pago: string
    tipo_documento: string
    cliente_razon_social?: string
}

export function RecentTransactions() {
    const supabase = createClient()
    const [transactions, setTransactions] = useState<Transaction[]>([])

    const loadRecentTransactions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("ventas")
                .select("id, created_at, total, metodo_pago, tipo_documento, cliente_razon_social")
                .eq("anulada", false)
                .order("created_at", { ascending: false })
                .limit(10)

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error("Error loading transactions:", error)
        }
    }, [supabase])

    useEffect(() => {
        loadRecentTransactions()
    }, [loadRecentTransactions])

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }

    const getPaymentBadge = (metodo: string) => {
        const variants: { [key: string]: "default" | "secondary" | "outline" } = {
            "Efectivo": "default",
            "Debito": "secondary",
            "Credito": "secondary",
            "Transferencia": "outline"
        }
        return <Badge variant={variants[metodo] || "default"}>{metodo}</Badge>
    }

    if (transactions.length === 0) {
        return <p className="text-sm text-muted-foreground">No hay transacciones recientes</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                            {formatTime(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {transaction.tipo_documento === "Factura" ? (
                                    <FileText className="h-4 w-4 text-primary" />
                                ) : (
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">
                                    {transaction.tipo_documento === "Factura" ? "Factura" : "Boleta"}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {transaction.cliente_razon_social || "Consumidor Final"}
                        </TableCell>
                        <TableCell>
                            {getPaymentBadge(transaction.metodo_pago)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                            ${Math.round(transaction.total).toLocaleString('es-CL')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
