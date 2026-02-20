"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, ArrowRight, User } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RecentSale {
    id: string
    created_at: string
    total: number
    metodo_pago: string
    cliente_nombre?: string | null
    usuario?: {
        nombre_completo: string
    } | null
}

interface RecentSalesListProps {
    sales: RecentSale[]
}

export function RecentSalesList({ sales }: RecentSalesListProps) {
    return (
        <Card className="border-primary/10 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                    10 Últimas Ventas
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
                {sales.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                        No hay ventas registradas hoy.
                    </div>
                ) : (
                    sales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between border-b border-muted pb-3 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {sale.cliente_nombre || "Consumidor Final"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 rounded">
                                        {sale.metodo_pago.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(sale.created_at), "HH:mm", { locale: es })}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {sale.usuario?.nombre_completo.split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-primary font-serif">
                                    ${sale.total.toLocaleString('es-CL')}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {sales.length > 0 && (
                    <Link
                        href="/dashboard/ventas"
                        className="flex items-center justify-center gap-1 text-xs text-primary font-bold mt-4 hover:underline transition-all"
                    >
                        Ver todo el historial
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </CardContent>
        </Card>
    )
}
