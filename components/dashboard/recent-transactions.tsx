"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Transaction {
    id: string
    created_at: string
    total: number
    metodo_pago: "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia" | null
    numero_venta: string
    cliente_nombre: string | null
}

export function RecentTransactions() {
    const supabase = createClient()
    const [transactions, setTransactions] = useState<Transaction[]>([])

    const loadRecentTransactions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("ventas")
                .select("id, created_at, total, metodo_pago, numero_venta, cliente_nombre")
                .neq("estado", "anulada")
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

    const getPaymentLabel = (metodo: Transaction["metodo_pago"]) => {
        const labels: Record<string, string> = {
            efectivo: "Efectivo",
            tarjeta_debito: "Débito",
            tarjeta_credito: "Crédito",
            transferencia: "Transferencia",
        }
        return metodo ? (labels[metodo] ?? metodo) : "—"
    }

    if (transactions.length === 0) {
        return <p className="text-sm text-muted-foreground">No hay transacciones recientes</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>N° Venta</TableHead>
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
                        <TableCell className="text-xs text-muted-foreground">
                            {transaction.numero_venta}
                        </TableCell>
                        <TableCell>
                            {transaction.cliente_nombre || "Consumidor Final"}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{getPaymentLabel(transaction.metodo_pago)}</Badge>
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
