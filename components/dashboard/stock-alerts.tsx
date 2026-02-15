"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface StockAlertsProps {
    items: any[]
}

export function StockAlerts({ items }: StockAlertsProps) {
    if (!items || items.length === 0) return null

    return (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    Alertas de Stock Crítico
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.nombre}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                {Number(item.stock_actual).toLocaleString()} / {Number(item.stock_minimo).toLocaleString()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                BAJO
                            </span>
                        </div>
                    </div>
                ))}

                <Link
                    href="/dashboard/inventario"
                    className="flex items-center justify-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-bold mt-2 hover:underline"
                >
                    Gestionar inventario
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </CardContent>
        </Card>
    )
}
