import { create } from 'zustand'
import { toast } from 'sonner'
import { db } from '@/lib/db/offline-db'

export interface CartItem {
    id: string
    nombre: string
    codigo: string | null
    precio_venta: number
    cantidad: number
    es_pesable: boolean
    subtotal: number
    stock_cantidad: number // Stock disponible
}

interface ERPState {
    items: CartItem[]
    isScannerActive: boolean
    isCameraScannerOpen: boolean
    isOnline: boolean
    addItem: (product: any, quantity?: number) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    setScannerActive: (active: boolean) => void
    setCameraScannerOpen: (open: boolean) => void
    setOnline: (online: boolean) => void
    getTotals: () => { subtotal: number; iva: number; total: number }
    syncCatalog: (products: any[]) => Promise<void>
    saveSaleOffline: (saleData: any) => Promise<void>
}

export const useERPStore = create<ERPState>((set, get) => ({
    items: [],
    isScannerActive: true,
    isCameraScannerOpen: false,
    isOnline: true,

    addItem: (product: any, quantity: number = 1) => {
        const { items } = get()
        const existingItem = items.find((item) => item.id === product.id)

        // Validar stock disponible (solo para productos no pesables)
        const currentCartQuantity = existingItem ? existingItem.cantidad : 0
        const newTotalQuantity = currentCartQuantity + quantity
        const totalStock = product.stock_cantidad ?? product.stock_actual
        const virtualStockRestante = totalStock - currentCartQuantity

        if (!product.es_pesable && newTotalQuantity > totalStock) {
            toast.error(`Stock insuficiente`, {
                description: `Disponible: ${virtualStockRestante} unidades`
            })
            return
        }

        // Alerta de stock bajo (menos de 5 unidades virtuales)
        if (!product.es_pesable && virtualStockRestante < 5 && virtualStockRestante > 0) {
            toast.warning(`Stock bajo: ${product.nombre}`, {
                description: `Quedan solo ${virtualStockRestante} unidades`
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
                        codigo: product.codigo ?? product.codigo_barras,
                        precio_venta: product.precio_venta,
                        cantidad: quantity,
                        es_pesable: product.es_pesable,
                        subtotal: quantity * product.precio_venta,
                        stock_cantidad: product.stock_cantidad ?? product.stock_actual,
                    },
                ],
            })
        }
    },

    removeItem: (id: string) => {
        set({
            items: get().items.filter((item: CartItem) => item.id !== id),
        })
    },

    updateQuantity: (id: string, quantity: number) => {
        const { items } = get()
        const item = items.find((i: CartItem) => i.id === id)

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
                items: items.filter((i: CartItem) => i.id !== id)
            })
            return
        }

        set({
            items: items.map((item: CartItem) =>
                item.id === id
                    ? { ...item, cantidad: quantity, subtotal: Math.round(quantity * item.precio_venta) }
                    : item
            ),
        })
    },

    clearCart: () => set({ items: [] }),

    setScannerActive: (active: boolean) => set({ isScannerActive: active }),
    setCameraScannerOpen: (open: boolean) => set({ isCameraScannerOpen: open }),
    setOnline: (online: boolean) => set({ isOnline: online }),

    getTotals: () => {
        const { items } = get()
        const subtotal = items.reduce((acc: number, item: CartItem) => acc + item.subtotal, 0)
        return {
            subtotal: subtotal / 1.19, // Neto
            iva: subtotal - (subtotal / 1.19), // El IVA contenido
            total: subtotal,
        }
    },

    syncCatalog: async (products: any[]) => {
        try {
            await db.productos.clear()
            await db.productos.bulkAdd(products)
            console.log('Catálogo sincronizado con IndexedDB')
        } catch (error) {
            console.error('Error sincronizando catálogo:', error)
        }
    },

    saveSaleOffline: async (saleData) => {
        try {
            await db.ventas_pendientes.add({
                ...saleData,
                synced: 0,
                fecha: new Date().toISOString()
            })
            toast.success('Venta guardada localmente (Modo Offline)')
        } catch (error) {
            console.error('Error guardando venta offline:', error)
            toast.error('Error al guardar venta localmente')
        }
    }
}))
