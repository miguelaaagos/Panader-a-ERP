"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOfflineSales, removeOfflineSale, OfflineSale } from "@/lib/offline-queue"
import { createSale } from "@/actions/sales"
import { toast } from "sonner"

export function OfflineSync() {
    const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([])
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        const load = () => setOfflineSales(getOfflineSales())
        load()
        const interval = setInterval(load, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [])

    const handleSync = async () => {
        if (offlineSales.length === 0) return
        setSyncing(true)
        let successCount = 0
        let failCount = 0

        for (const sale of offlineSales) {
            try {
                const result = await createSale(sale.data)
                if (result.success) {
                    removeOfflineSale(sale.id)
                    successCount++
                } else {
                    failCount++
                    console.error(`Error syncing sale ${sale.id}:`, result.error)
                }
            } catch (error) {
                failCount++
                console.error(`Critical error syncing sale ${sale.id}:`, error)
            }
        }

        setOfflineSales(getOfflineSales())
        setSyncing(false)

        if (successCount > 0) {
            toast.success(`Sincronización terminada`, {
                description: `Se subieron ${successCount} ventas con éxito.`
            })
        }
        if (failCount > 0) {
            toast.error(`Error de sincronización`, {
                description: `${failCount} ventas no pudieron subirse.`
            })
        }
    }

    if (offlineSales.length === 0) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground opacity-50 px-2 py-1 rounded-md text-xs border border-transparent">
                <Cloud className="h-4 w-4" />
                <span className="hidden sm:inline">Conectado</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground border border-warning/20 px-2 py-1 rounded-md animate-pulse">
            <CloudOff className="h-4 w-4 text-warning" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold leading-none">Offline</span>
                <span className="text-xs font-medium">{offlineSales.length} pendiente(s)</span>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 ml-1 bg-background hover:bg-muted"
                onClick={handleSync}
                disabled={syncing}
            >
                {syncing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                    <RefreshCw className="h-3 w-3" />
                )}
                <span className="ml-1 text-[10px]">SINCRONIZAR</span>
            </Button>
        </div>
    )
}
