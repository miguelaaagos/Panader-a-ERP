"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getOfflineSales, removeOfflineSale } from "@/lib/offline-queue"
import { createSale } from "@/actions/sales"
import { toast } from "sonner"
import { useERPStore } from "@/hooks/use-erp-store"

export function OfflineSync() {
    const [offlineSales, setOfflineSales] = useState<any[]>([])
    const [syncing, setSyncing] = useState(false)
    const isOnline = useERPStore(state => state.isOnline)

    useEffect(() => {
        const load = async () => {
            const sales = await getOfflineSales()
            setOfflineSales(sales)
        }
        load()
        const interval = setInterval(load, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    const handleSync = async () => {
        if (offlineSales.length === 0) return
        if (!isOnline) {
            toast.error("Sin conexión", {
                description: "No se puede sincronizar mientras estés offline."
            })
            return
        }

        setSyncing(true)
        let successCount = 0
        let failCount = 0

        for (const sale of offlineSales) {
            try {
                // El campo 'data' contiene el checkoutData que necesita createSale
                const result = await createSale(sale.data)
                if (result.success) {
                    if (sale.id) await removeOfflineSale(sale.id)
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

        const remainingSales = await getOfflineSales()
        setOfflineSales(remainingSales)
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
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs border ${isOnline ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                {isOnline ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
                <span className="hidden sm:inline font-medium">{isOnline ? 'Conectado' : 'Modo Offline'}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 bg-amber-100 text-amber-900 border border-amber-200 px-2 py-1 rounded-md">
            <CloudOff className="h-4 w-4 text-amber-600" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold leading-none">Offline</span>
                <span className="text-xs font-medium">{offlineSales.length} pendiente(s)</span>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 ml-1 bg-white hover:bg-amber-50 border-amber-200 text-amber-700"
                onClick={handleSync}
                disabled={syncing || !isOnline}
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
