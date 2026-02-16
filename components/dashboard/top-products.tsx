"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface TopProduct {
    nombre: string
    cantidad: number
    total: number
}

export function TopProducts() {
    const supabase = createClient()
    const [products, setProducts] = useState<TopProduct[]>([])

    useEffect(() => {
        loadTopProducts()
    }, [])

    const loadTopProducts = async () => {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Obtener detalles de ventas del día con productos
            const { data, error } = await supabase
                .from("venta_detalles")
                .select(`
                    cantidad,
                    subtotal,
                    producto_id,
                    productos (nombre),
                    ventas!inner (created_at, anulada)
                `)
                .gte("ventas.created_at", today.toISOString())
                .eq("ventas.anulada", false)

            if (error) throw error

            // Agrupar por producto
            const productMap: { [key: string]: TopProduct } = {}

            data?.forEach((item: any) => {
                const nombre = item.productos?.nombre || "Producto desconocido"

                if (!productMap[nombre]) {
                    productMap[nombre] = {
                        nombre,
                        cantidad: 0,
                        total: 0
                    }
                }

                productMap[nombre].cantidad += item.cantidad
                productMap[nombre].total += item.subtotal
            })

            // Ordenar por cantidad vendida y tomar top 5
            const topProducts = Object.values(productMap)
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 5)

            setProducts(topProducts)
        } catch (error) {
            console.error("Error loading top products:", error)
        }
    }

    if (products.length === 0) {
        return <p className="text-sm text-muted-foreground">No hay ventas registradas hoy</p>
    }

    return (
        <div className="space-y-4">
            {products.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                            {product.cantidad} unidades
                        </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                        ${Math.round(product.total).toLocaleString('es-CL')}
                    </Badge>
                </div>
            ))}
        </div>
    )
}
