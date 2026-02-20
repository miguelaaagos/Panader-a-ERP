"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { CartPanel } from "./cart-panel"
import { CheckoutDialog, CheckoutData } from "./checkout-dialog"
import { SuccessModal } from "./success-modal"
import { getProductsForPOS, createSale } from "@/actions/sales"
import { getSession } from "@/actions/auth"
import { getCategories } from "@/actions/inventory"
import { usePOSStore } from "@/hooks/use-pos-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CashierTab } from "./cashier-tab"
import { getCurrentCashSession } from "@/actions/cash"
import { WeighItemDialog } from "./weigh-item-dialog"
import { Button } from "@/components/ui/button"

import { toast } from "sonner"
import { PackageSearch, ShoppingCart, AlertCircle, ArrowRight } from "lucide-react"
import { saveOfflineSale } from "@/lib/offline-queue"
import { OfflineSync } from "./offline-sync"
import { format } from "date-fns"

import { Product, Category } from "./product-grid"

interface TransactionRecord {
    id: string
    total: number
    metodo_pago: string
    tipo_documento: string
}

interface CashSession {
    id: string
    fecha_apertura: string | null
    estado: string
    monto_inicial: number
}

export function POSContainer() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [successModalOpen, setSuccessModalOpen] = useState(false)
    const [lastTransaction, setLastTransaction] = useState<TransactionRecord | null>(null)
    const [activeSession, setActiveSession] = useState<CashSession | null>(null)
    const [weighingProduct, setWeighingProduct] = useState<Product | null>(null)
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("pos")

    // Store Centralizado
    const { items, addItem, updateQuantity, removeItem, clearCart, getTotals } = usePOSStore()
    const { total } = getTotals()

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            try {
                const sessionResult = await getSession()
                if (sessionResult.success && sessionResult.profile) {
                    const tid = sessionResult.profile.tenant_id
                    setTenantId(tid)
                    // Ejecutar fetchSession primero para reducir el parpadeo de la advertencia de caja
                    await fetchSession()
                    await Promise.all([fetchProducts(tid), fetchCategories()])
                } else {
                    await Promise.all([fetchCategories(), fetchSession()])
                }
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const fetchSession = async () => {
        const res = await getCurrentCashSession()
        if (res.success) {
            setActiveSession(res.session ?? null)
        }
    }

    const fetchCategories = async () => {
        const result = await getCategories()
        if (result.success) {
            setCategories(result.data || [])
        }
    }

    const fetchProducts = async (tid: string) => {
        const result = await getProductsForPOS(tid)
        if (result.success && result.data) {
            const sanitizedProducts: Product[] = result.data.map(p => ({
                id: p.id,
                nombre: p.nombre,
                precio_venta: p.precio_venta ?? 0,
                stock_actual: p.stock_actual ?? 0,
                unidad_medida: p.unidad_medida,
                categoria_id: p.categoria_id ?? undefined,
                es_pesable: p.es_pesable ?? false
            }))
            setProducts(sanitizedProducts)
        } else if (!result.success) {
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

            // Calcular recargo si es tarjeta (19%)
            let surcharge = 0
            if (checkoutData.metodo_pago === "tarjeta_debito" || checkoutData.metodo_pago === "tarjeta_credito") {
                surcharge = Math.round(total * 0.19)
            }

            const result = await createSale({
                ...checkoutData,
                arqueo_id: activeSession.id,
                items: items.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta,
                    descuento: 0
                })),
                // Enviamos el recargo como un descuento negativo para que se sume al total
                descuento_global: -surcharge
            })

            if (result.success) {
                setLastTransaction({
                    id: result.saleId ?? "",
                    total: total,
                    metodo_pago: checkoutData.metodo_pago,
                    tipo_documento: checkoutData.tipo_documento || "Boleta"
                })
                setSuccessModalOpen(true)
                clearCart()
                setIsCheckoutOpen(false)
                if (tenantId) fetchProducts(tenantId) // Refrescar stock
            } else {
                console.error("Sale error result:", result.error)
                toast.error("Error en la venta: " + result.error)
            }
        } catch (error: unknown) {
            console.error("Checkout crash, saving offline:", error)
            const errorMessage = error instanceof Error ? error.message : "Error desconocido"

            // Calcular recargo si es tarjeta (19%) para la venta offline
            let surcharge = 0
            if (checkoutData.metodo_pago === "tarjeta_debito" || checkoutData.metodo_pago === "tarjeta_credito") {
                surcharge = Math.round(total * 0.19)
            }

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
                // Enviamos el recargo como un descuento negativo para que se sume al total
                descuento_global: -surcharge
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

    const handleAddToCart = (product: Product) => {
        if (product.es_pesable) {
            setWeighingProduct(product)
        } else {
            addItem({
                ...product,
                stock_cantidad: product.stock_actual,
                precio_venta: product.precio_venta,
            })
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

                {activeSession && activeSession.fecha_apertura && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Turno Activo: {format(new Date(activeSession.fecha_apertura), 'HH:mm')}
                    </div>
                )}
            </div>

            <TabsContent value="pos" className="mt-0 outline-none">
                {!loading && !activeSession && (
                    <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500 p-2 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-orange-800">Caja Cerrada</h3>
                                <p className="text-sm text-orange-700/80">Debe abrir el turno antes de procesar ventas.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-orange-500 text-white hover:bg-orange-600 border-none font-bold"
                            onClick={() => setActiveTab("turno")}
                        >
                            Ir a Abrir Caja
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}

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
                            onAddToCart={handleAddToCart}
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
                hasActiveSession={!!activeSession}
            />

            <WeighItemDialog
                product={weighingProduct}
                onClose={() => setWeighingProduct(null)}
                onConfirm={(p, qty) => {
                    addItem({
                        ...p,
                        stock_cantidad: p.stock_actual,
                        precio_venta: p.precio_venta,
                    }, qty)
                }}
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
