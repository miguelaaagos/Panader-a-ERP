import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePOSStore } from '../hooks/use-pos-store'

// Mock de sonner para evitar errores en el entono de test
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
    },
}))

describe('usePOSStore', () => {
    beforeEach(() => {
        usePOSStore.getState().clearCart()
    })

    const mockProduct = {
        id: 'prod-1',
        nombre: 'Pan de Bono',
        precio_venta: 1000,
        stock_cantidad: 10,
        es_pesable: false,
        codigo_barras: '123456'
    }

    it('debe agregar un item al carrito correctamente', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct)

        const items = usePOSStore.getState().items
        expect(items).toHaveLength(1)
        expect(items[0].subtotal).toBe(1000)
        expect(items[0].cantidad).toBe(1)
    })

    it('debe incrementar la cantidad si el item ya existe', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct)
        store.addItem(mockProduct)

        const items = usePOSStore.getState().items
        expect(items).toHaveLength(1)
        expect(items[0].cantidad).toBe(2)
        expect(items[0].subtotal).toBe(2000)
    })

    it('no debe permitir agregar más del stock disponible', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct, 11)

        const items = usePOSStore.getState().items
        expect(items).toHaveLength(0)
    })

    it('debe calcular los totales correctamente (IVA incluido)', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct, 2) // $2000 total

        const { subtotal, iva, total } = usePOSStore.getState().getTotals()

        expect(total).toBe(2000)
        // IVA 19% en Chile está incluido en el precio
        // Neto = 2000 / 1.19 = 1680.67...
        expect(subtotal).toBeCloseTo(1680.67, 1)
        expect(iva).toBeCloseTo(319.33, 1)
    })

    it('debe remover un item del carrito', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct)
        store.removeItem(mockProduct.id)

        const items = usePOSStore.getState().items
        expect(items).toHaveLength(0)
    })

    it('debe limpiar el carrito completamente', () => {
        const store = usePOSStore.getState()
        store.addItem(mockProduct)
        store.clearCart()

        const items = usePOSStore.getState().items
        expect(items).toHaveLength(0)
    })
    it('debe permitir agregar más del stock si el producto es pesable', () => {
        const store = usePOSStore.getState()
        const productPesable = {
            id: 'prod-pesable',
            nombre: 'Pan Granel',
            precio_venta: 1000,
            stock_cantidad: 5,
            es_pesable: true,
            codigo_barras: null
        }

        store.addItem(productPesable, 10) // Solicitamos 10, disponible 5
        const items = usePOSStore.getState().items
        expect(items[0].cantidad).toBe(10)
    })

    it('no debe permitir exceder stock al actualizar cantidad en producto no pesable', () => {
        const store = usePOSStore.getState()
        const product = {
            id: 'prod-1',
            nombre: 'Empanada',
            precio_venta: 2000,
            stock_cantidad: 5,
            es_pesable: false,
            codigo_barras: null
        }

        store.addItem(product, 2)
        store.updateQuantity('prod-1', 10) // Intento subir a 10

        const items = usePOSStore.getState().items
        expect(items[0].cantidad).toBe(2) // Debe mantenerse en 2
    })

    it('debe remover el item si la cantidad se actualiza a 0', () => {
        const store = usePOSStore.getState()
        const product = {
            id: 'prod-1',
            nombre: 'Empanada',
            precio_venta: 2000,
            stock_cantidad: 10,
            es_pesable: false,
            codigo_barras: null
        }

        store.addItem(product, 2)
        store.updateQuantity('prod-1', 0)

        const items = usePOSStore.getState().items
        expect(items.length).toBe(0)
    })
})
