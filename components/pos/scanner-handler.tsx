"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePOSStore } from "@/hooks/use-pos-store"
import { toast } from "sonner"

export function ScannerHandler() {
    const { addItem } = usePOSStore()
    const supabase = createClient()
    const buffer = useRef<string>("")
    const lastKeyTime = useRef<number>(0)

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            const now = Date.now()

            // Intentar detectar si es un escaneo (tiempo muy corto entre teclas) o entrada manual
            // Los scanners suelen ser extremadamente rápidos.
            if (now - lastKeyTime.current > 50) {
                buffer.current = ""
            }

            lastKeyTime.current = now

            if (e.key === "Enter") {
                if (buffer.current.length > 3) {
                    const barcode = buffer.current
                    buffer.current = ""
                    await handleScan(barcode)
                }
                return
            }

            // Solo aceptar caracteres alfanuméricos
            if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                buffer.current += e.key
            }
        }

        const handleScan = async (barcode: string) => {
            const { data, error } = await supabase
                .from("productos")
                .select("*")
                .eq("codigo_barras", barcode)
                .single()

            if (error) {
                console.error("Error buscando producto:", error)
                toast.error(`Producto no encontrado: ${barcode}`)
                return
            }

            if (data) {
                addItem(data)
                toast.success(`Agregado: ${data.nombre}`, {
                    description: `$${(data.precio_venta ?? 0).toLocaleString()} añadido al carrito.`,
                    duration: 2000,
                })
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [addItem, supabase])

    return null // Componente invisible
}
