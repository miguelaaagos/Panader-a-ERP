"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <WifiOff className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Sin Conexión</h1>
            <p className="text-muted-foreground mb-8 max-w-xs">
                Parece que no tienes conexión a internet. El POS seguirá funcionando para ventas básicas, pero algunas funciones requieren red.
            </p>
            <Button onClick={() => window.location.reload()} size="lg">
                Reintentar Conexión
            </Button>
        </div>
    )
}
