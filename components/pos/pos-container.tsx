"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { CartPanel, CartItem } from "./cart-panel"
import { CheckoutDialog, CheckoutData } from "./checkout-dialog"
import { getProductsForPOS, createSale } from "@/actions/sales"
import { getCategories } from "@/actions/inventory"

import { toast } from "sonner"
import { PackageSearch } from "lucide-react"

export function POSContainer() {
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([fetchProducts(), fetchCategories()])
            setLoading(false)
        }
        init()
    }, [])

    const fetchCategories = async () => {
        const result = await getCategories()
        if (result.success) {
            setCategories(result.data || [])
        }
    }

    const fetchProducts = async () => {
        const result = await getProductsForPOS()
        if (result.success) {
            setProducts(result.data || [])
        } else {
            toast.error("Error al cargar productos: " + result.error)
        }
    }

    const handleAddToCart = (product: any) => {
        if (product.stock_actual <= 0) {
            toast.error("Producto sin stock")
            return
        }

        setCart(prev => {
            const existing = prev.find(item => item.producto_id === product.id)
            if (existing) {
                if (existing.cantidad >= product.stock_actual) {
                    toast.warning("Se alcanzó el límite de stock disponible")
                    return prev
                }
                return prev.map(item =>
                    item.producto_id === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                )
            }
            return [...prev, {
                producto_id: product.id,
                nombre: product.nombre,
                precio_unitario: product.precio_venta,
                cantidad: 1,
                stock_actual: product.stock_actual
            }]
        })
    }

    const handleUpdateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.producto_id === id) {
                const newQuantity = Math.max(1, item.cantidad + delta)
                if (delta > 0 && newQuantity > item.stock_actual) {
                    toast.warning("Stock máximo alcanzado")
                    return item
                }
                return { ...item, cantidad: newQuantity }
            }
            return item
        }))
    }

    const handleRemoveItem = (id: string) => {
        setCart(prev => prev.filter(item => item.producto_id !== id))
    }

    const handleCheckoutConfirm = async (checkoutData: CheckoutData) => {
        try {
            setSubmitting(true)
            const result = await createSale({
                ...checkoutData,
                items: cart.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento: 0
                })),
                descuento_global: 0
            })

            if (result.success) {
                toast.success("Venta realizada con éxito 🎉")
                setCart([])
                setIsCheckoutOpen(false)
                fetchProducts() // Refrescar stock
            } else {
                console.error("Sale error result:", result.error)
                toast.error("Error en la venta: " + result.error)
            }
        } catch (error: any) {
            console.error("Checkout crash:", error)
            toast.error("Error crítico en el proceso de venta")
        } finally {
            setSubmitting(false)
        }
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[500px]">
            {/* Sector Productos */}
            <div className="lg:col-span-8 flex flex-col h-full bg-muted/20 p-4 rounded-xl border border-dashed border-muted-foreground/20">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <PackageSearch className="h-5 w-5" />
                    <h2 className="font-medium">Selección de Productos</h2>
                </div>
                <ProductGrid
                    products={products}
                    categories={categories}
                    loading={loading}
                    onAddToCart={handleAddToCart}
                />
            </div>

            {/* Sector Carrito */}
            <div className="lg:col-span-4 h-full">
                <CartPanel
                    items={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onCheckout={() => setIsCheckoutOpen(true)}
                    subtotal={subtotal}
                />
            </div>

            <CheckoutDialog
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                total={subtotal}
                onConfirm={handleCheckoutConfirm}
                submitting={submitting}
            />
        </div>
    )
}
