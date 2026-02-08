import { create } from 'zustand'
import { toast } from 'sonner'

export interface CartItem {
    id: string
    nombre: string
    codigo_barras: string | null
    precio_venta: number
    cantidad: number
    es_pesable: boolean
    subtotal: number
    stock_cantidad: number // Stock disponible
}

interface POSState {
    items: CartItem[]
    isScannerActive: boolean
    addItem: (product: any, quantity?: number) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    setScannerActive: (active: boolean) => void
    getTotals: () => { subtotal: number; iva: number; total: number }
}

export const usePOSStore = create<POSState>((set, get) => ({
    items: [],
    isScannerActive: true,

    addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find((item) => item.id === product.id)

        // Validar stock disponible (solo para productos no pesables)
        const currentCartQuantity = existingItem ? existingItem.cantidad : 0
        const newTotalQuantity = currentCartQuantity + quantity

        if (!product.es_pesable && newTotalQuantity > product.stock_cantidad) {
            toast.error(`Stock insuficiente`, {
                description: `Disponible: ${product.stock_cantidad} unidades`
            })
            return
        }

        // Alerta de stock bajo (menos de 5 unidades)
        if (!product.es_pesable && product.stock_cantidad < 5 && product.stock_cantidad > 0) {
            toast.warning(`Stock bajo: ${product.nombre}`, {
                description: `Quedan solo ${product.stock_cantidad} unidades`
            })
        }

        if (existingItem) {
            const newQuantity = existingItem.cantidad + quantity
            set({
                items: items.map((item) =>
                    item.id === product.id
                        ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precio_venta }
                        : item
                ),
            })
        } else {
            set({
                items: [
                    ...items,
                    {
                        id: product.id,
                        nombre: product.nombre,
                        codigo_barras: product.codigo_barras,
                        precio_venta: product.precio_venta,
                        cantidad: quantity,
                        es_pesable: product.es_pesable,
                        subtotal: quantity * product.precio_venta,
                        stock_cantidad: product.stock_cantidad,
                    },
                ],
            })
        }
    },

    removeItem: (id) => {
        set({
            items: get().items.filter((item) => item.id !== id),
        })
    },

    updateQuantity: (id, quantity) => {
        const { items } = get()
        const item = items.find((i) => i.id === id)

        if (!item) return

        // Validar stock para productos no pesables
        if (!item.es_pesable && quantity > item.stock_cantidad) {
            toast.error(`Stock insuficiente`, {
                description: `Disponible: ${item.stock_cantidad} unidades`
            })
            return
        }

        // Si la cantidad es 0 o negativa, remover el item
        if (quantity <= 0) {
            set({
                items: items.filter((i) => i.id !== id)
            })
            return
        }

        set({
            items: items.map((item) =>
                item.id === id
                    ? { ...item, cantidad: quantity, subtotal: quantity * item.precio_venta }
                    : item
            ),
        })
    },

    clearCart: () => set({ items: [] }),

    setScannerActive: (active) => set({ isScannerActive: active }),

    getTotals: () => {
        const { items } = get()
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
        return {
            subtotal: subtotal / 1.19, // Neto
            iva: subtotal - (subtotal / 1.19), // El IVA contenido
            total: subtotal,
        }
    },
}))
