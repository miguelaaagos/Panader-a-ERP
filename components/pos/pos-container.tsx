"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { CartPanel } from "./cart-panel"
import { CheckoutDialog, CheckoutData } from "./checkout-dialog"
import { SuccessModal } from "./success-modal"
import { getProductsForPOS, createSale } from "@/actions/sales"
import { getCategories } from "@/actions/inventory"
import { usePOSStore } from "@/hooks/use-pos-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CashierTab } from "./cashier-tab"
import { getCurrentCashSession } from "@/actions/cash"

import { toast } from "sonner"
import { PackageSearch, ShoppingCart } from "lucide-react"
import { saveOfflineSale } from "@/lib/offline-queue"
import { OfflineSync } from "./offline-sync"
import { format } from "date-fns"

export function POSContainer() {
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [successModalOpen, setSuccessModalOpen] = useState(false)
    const [lastTransaction, setLastTransaction] = useState<any>(null)
    const [activeSession, setActiveSession] = useState<any>(null)

    // Store Centralizado
    const { items, addItem, updateQuantity, removeItem, clearCart, getTotals } = usePOSStore()
    const { total } = getTotals()

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([fetchProducts(), fetchCategories(), fetchSession()])
            setLoading(false)
        }
        init()
    }, [])

    const fetchSession = async () => {
        const res = await getCurrentCashSession()
        if (res.success) {
            setActiveSession(res.session)
        }
    }

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

    const handleCheckoutConfirm = async (checkoutData: CheckoutData) => {
        if (!activeSession) {
            toast.error("Debe abrir la caja antes de realizar una venta", {
                description: "Vaya a la pestaña 'Turno' para iniciar sesión."
            })
            return
        }

        try {
            setSubmitting(true)
            const result = await createSale({
                ...checkoutData,
                arqueo_id: activeSession.id,
                items: items.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta,
                    descuento: 0
                })),
                descuento_global: 0
            })

            if (result.success) {
                setLastTransaction({
                    id: result.saleId,
                    total: total,
                    metodo_pago: checkoutData.metodo_pago,
                    tipo_documento: checkoutData.tipo_documento || "Boleta"
                })
                setSuccessModalOpen(true)
                clearCart()
                setIsCheckoutOpen(false)
                fetchProducts() // Refrescar stock
            } else {
                console.error("Sale error result:", result.error)
                toast.error("Error en la venta: " + result.error)
            }
        } catch (error: any) {
            console.error("Checkout crash, saving offline:", error)

            // Si hay un error de red o similar, guardamos en la cola offline
            const offlineData = {
                ...checkoutData,
                arqueo_id: activeSession.id,
                items: items.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta,
                    descuento: 0
                })),
                descuento_global: 0
            }

            saveOfflineSale(offlineData)

            toast.warning("Venta guardada localmente", {
                description: "No hay conexión. Se sincronizará automáticamente cuando vuelvas."
            })

            clearCart()
            setIsCheckoutOpen(false)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Tabs defaultValue="pos" className="w-full">
            <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="pos" className="px-8 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Venta
                    </TabsTrigger>
                    <TabsTrigger value="turno" className="px-8 flex items-center gap-2">
                        <PackageSearch className="h-4 w-4" />
                        Turno / Caja
                    </TabsTrigger>
                </TabsList>

                {activeSession && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Turno Activo: {format(new Date(activeSession.fecha_apertura), 'HH:mm')}
                    </div>
                )}
            </div>

            <TabsContent value="pos" className="mt-0 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[500px]">
                    {/* Sector Productos */}
                    <div className="lg:col-span-8 flex flex-col h-full bg-muted/20 p-4 rounded-xl border border-dashed border-muted-foreground/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <PackageSearch className="h-5 w-5" />
                                <h2 className="font-medium">Selección de Productos</h2>
                            </div>
                            <OfflineSync />
                        </div>
                        <ProductGrid
                            products={products}
                            categories={categories}
                            loading={loading}
                            onAddToCart={(p) => addItem({
                                ...p,
                                stock_cantidad: p.stock_actual,
                                precio_venta: p.precio_venta,
                            })}
                        />
                    </div>

                    {/* Sector Carrito */}
                    <div className="lg:col-span-4 h-full">
                        <CartPanel
                            items={items}
                            onUpdateQuantity={(id, delta) => {
                                const item = items.find(i => i.id === id)
                                if (item) updateQuantity(id, item.cantidad + delta)
                            }}
                            onRemoveItem={removeItem}
                            onCheckout={() => setIsCheckoutOpen(true)}
                            total={total}
                        />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="turno" className="mt-0 outline-none">
                <CashierTab onSessionChange={fetchSession} />
            </TabsContent>

            <CheckoutDialog
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                total={total}
                onConfirm={handleCheckoutConfirm}
                submitting={submitting}
            />

            <SuccessModal
                open={successModalOpen}
                onOpenChange={setSuccessModalOpen}
                transaction={lastTransaction}
                onNewSale={() => {
                    setSuccessModalOpen(false)
                }}
            />
        </Tabs>
    )
}
