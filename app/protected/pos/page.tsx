"use client"

import { useState, useEffect } from "react"
import { usePOSStore } from "@/hooks/use-pos-store"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Trash2, Plus, Minus, Search, QrCode, ClipboardList, Loader2 } from "lucide-react"
import { ScannerHandler } from "@/components/pos/scanner-handler"
import { toast } from "sonner"
import { DocumentSelector } from "@/components/pos/document-selector"
import { InvoiceForm, type ClientData } from "@/components/pos/invoice-form"
import { SuccessModal } from "@/components/pos/success-modal"

export default function POSPage() {
    const supabase = createClient()
    const { items, addItem, removeItem, updateQuantity, clearCart, getTotals } = usePOSStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>("todos")
    const [showProductList, setShowProductList] = useState(false)
    const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [priceOverride, setPriceOverride] = useState("") // Para productos de balanza externa
    const [isProcessing, setIsProcessing] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)

    // Estados para selector de documentos
    const [showDocumentSelector, setShowDocumentSelector] = useState(false)
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"Efectivo" | "Debito" | "Credito" | "Transferencia">("Efectivo")

    const [clientData, setClientData] = useState<ClientData | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastTransaction, setLastTransaction] = useState<any>(null)

    const { total, subtotal, iva } = getTotals()

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserProfile(user)
            }
        }
        getUser()
        loadAllProducts()
        loadCategories()
    }, [supabase])

    // Cargar todos los productos al inicio
    const loadAllProducts = async () => {
        const { data, error } = await supabase
            .from("productos")
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
            .eq("activo", true)
            .order("nombre")

        if (!error && data) {
            setAllProducts(data)
        }
    }

    // Cargar categorías
    const loadCategories = async () => {
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order("nombre")

        if (!error && data) {
            setCategories(data)
        }
    }

    // Búsqueda en tiempo real con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchProductsRealtime(searchTerm)
            } else {
                setSuggestions([])
                setShowSuggestions(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const searchProductsRealtime = async (term: string) => {
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("activo", true)
            .ilike("nombre", `%${term}%`)
            .limit(5)

        if (!error && data) {
            setSuggestions(data)
            setShowSuggestions(data.length > 0)
        }
    }

    const handleManualSearch = async () => {
        if (!searchTerm) return

        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .eq("activo", true)
            .ilike("nombre", `%${searchTerm}%`)
            .limit(5)

        if (error) {
            toast.error("Error al buscar productos")
            return
        }

        if (data && data.length > 0) {
            if (data.length === 1) {
                handleProductSelection(data[0])
                setSearchTerm("")
            } else {
                handleProductSelection(data[0])
                setSearchTerm("")
            }
        } else {
            toast.info("No se encontró el producto")
        }
    }

    const handleProductSelection = (product: any) => {
        if (product.es_pesable) {
            // Todos los productos pesables usan ingreso directo de precio
            setSelectedProduct(product)
            setPriceOverride("") // Limpiar el input de precio
            setIsWeightDialogOpen(true)
        } else {
            addItem(product)
        }
    }

    const confirmWeight = () => {
        if (!selectedProduct) return

        // Todos los pesables usan ingreso directo de precio
        const totalPrice = parseFloat(priceOverride)
        if (!totalPrice || totalPrice <= 0) {
            toast.error("Ingresa un precio válido")
            return
        }

        // Agregamos con cantidad 1 y sobrescribimos el precio
        addItem({
            ...selectedProduct,
            precio_venta: totalPrice,
            subtotal: totalPrice
        }, 1)

        setIsWeightDialogOpen(false)
        setSelectedProduct(null)
        setPriceOverride("")
    }

    const handlePaymentClick = (metodoP: "Efectivo" | "Debito" | "Credito" | "Transferencia") => {
        if (items.length === 0) return
        setSelectedPaymentMethod(metodoP)
        setShowDocumentSelector(true)
    }

    const handleDocumentTypeSelected = (documentType: "Boleta" | "Factura") => {
        setShowDocumentSelector(false)

        if (documentType === "Factura") {
            setShowInvoiceForm(true)
        } else {
            processCheckout(documentType, null)
        }
    }

    const handleInvoiceDataSubmitted = (data: ClientData) => {
        setClientData(data)
        setShowInvoiceForm(false)
        processCheckout("Factura", data)
    }

    const processCheckout = async (tipoDocumento: "Boleta" | "Factura", clienteData: ClientData | null) => {
        setIsProcessing(true)

        try {
            const ventaData: any = {
                perfil_id: userProfile?.id,
                metodo_pago: selectedPaymentMethod,
                total: total,
                tipo_documento: tipoDocumento,
                anulada: false
            }

            if (tipoDocumento === "Factura" && clienteData) {
                ventaData.cliente_rut = clienteData.rut
                ventaData.cliente_razon_social = clienteData.razon_social
                ventaData.cliente_direccion = clienteData.direccion
                ventaData.cliente_giro = clienteData.giro
            }

            const { data: venta, error: ventaError } = await supabase
                .from("ventas")
                .insert(ventaData)
                .select()
                .single()

            if (ventaError) throw ventaError

            const detalles = items.map(item => ({
                venta_id: venta.id,
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_venta,
                subtotal: item.subtotal
            }))

            const { error: detalleError } = await supabase
                .from("detalle_ventas")
                .insert(detalles)

            if (detalleError) throw detalleError

            const docType = tipoDocumento === "Factura" ? "Factura" : "Boleta"

            // Preparar datos para el modal de éxito
            setLastTransaction({
                id: venta.id,
                total: total,
                metodo_pago: selectedPaymentMethod,
                tipo_documento: docType,
                change: 0 // Implementar cálculo de vuelto si es necesario
            })

            clearCart()
            setClientData(null)
            setShowSuccessModal(true)
        } catch (error: any) {
            console.error(error)
            toast.error("Error al procesar la venta: " + (error.message || "Error desconocido"))
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] gap-4 p-4 lg:flex-row">
            <ScannerHandler />

            {/* Columna Izquierda: Carrito de Compras */}
            <div className="flex flex-col flex-1 gap-4 overflow-hidden">
                <Card className="flex flex-col h-full overflow-hidden border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-primary/5 border-b py-4">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <ShoppingCart className="w-6 h-6" />
                            Venta en Curso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-primary/10">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-[40%]">Producto</TableHead>
                                    <TableHead className="text-center">Cant./Peso</TableHead>
                                    <TableHead className="text-right">Precio Un.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center text-muted-foreground italic">
                                            Escanea un producto o búscalo arriba para comenzar
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{item.nombre}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground">{item.codigo_barras || "Sin código"}</span>
                                                        {!item.es_pesable && (
                                                            <span className={`text-[10px] font-medium ${item.stock_cantidad < 5 ? 'text-destructive' : 'text-muted-foreground'
                                                                }`}>
                                                                Stock: {item.stock_cantidad}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.es_pesable && <Badge variant="outline" className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-bold border-amber-200">PESABLE</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="icon" variant="outline" className="h-8 w-8"
                                                        disabled={isProcessing}
                                                        onClick={() => updateQuantity(item.id, Math.max(0, item.cantidad - (item.es_pesable ? 0.05 : 1)))}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-20 text-center font-mono font-bold">
                                                        {item.es_pesable ? `${item.cantidad.toFixed(3)}kg` : `${item.cantidad} un`}
                                                    </span>
                                                    <Button size="icon" variant="outline" className="h-8 w-8"
                                                        disabled={isProcessing}
                                                        onClick={() => addItem(item, item.es_pesable ? 0.05 : 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">${item.precio_venta.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold">${item.subtotal.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    disabled={isProcessing}
                                                    onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Columna Derecha: Controles y Totales */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4">
                {/* Lector/Buscador */}
                <Card className="shadow-md">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Escanea o busca por nombre..."
                                    className="pl-9 h-11 focus-visible:ring-primary border-2"
                                    value={searchTerm}
                                    disabled={isProcessing}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && suggestions.length > 0) {
                                            handleProductSelection(suggestions[selectedIndex >= 0 ? selectedIndex : 0])
                                            setSearchTerm("")
                                            setShowSuggestions(false)
                                        } else if (e.key === 'ArrowDown') {
                                            e.preventDefault()
                                            setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault()
                                            setSelectedIndex(prev => Math.max(prev - 1, -1))
                                        } else if (e.key === 'Escape') {
                                            setShowSuggestions(false)
                                        }
                                    }}
                                    onFocus={() => searchTerm.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                                />

                                {/* Dropdown de Sugerencias */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-primary rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
                                        {suggestions.map((product, idx) => {
                                            const isOutOfStock = !product.es_pesable && product.stock_cantidad <= 0
                                            return (
                                                <div
                                                    key={product.id}
                                                    className={`p-3 border-b last:border-b-0 ${isOutOfStock
                                                        ? 'bg-gray-100 cursor-not-allowed opacity-60'
                                                        : `hover:bg-amber-50 cursor-pointer ${idx === selectedIndex ? 'bg-amber-100' : ''}`
                                                        }`}
                                                    onClick={() => {
                                                        if (!isOutOfStock) {
                                                            handleProductSelection(product)
                                                            setSearchTerm("")
                                                            setShowSuggestions(false)
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className={`font-medium text-sm ${isOutOfStock ? 'text-gray-500' : ''}`}>
                                                                {product.nombre}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">{product.codigo_barras || "Sin código"}</span>
                                                                {!product.es_pesable && (
                                                                    <span className={`text-xs font-medium ${isOutOfStock
                                                                        ? 'text-red-600'
                                                                        : product.stock_cantidad < 5
                                                                            ? 'text-orange-600'
                                                                            : 'text-gray-600'
                                                                        }`}>
                                                                        ({product.stock_cantidad} disp.)
                                                                    </span>
                                                                )}
                                                                {isOutOfStock && (
                                                                    <Badge variant="destructive" className="text-[9px] h-4">
                                                                        SIN STOCK
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <div className={`font-bold ${isOutOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                                                ${Math.round(product.precio_venta).toLocaleString('es-CL')}
                                                            </div>
                                                            {product.es_pesable && (
                                                                <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 mt-1">
                                                                    PESABLE
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <Button size="icon" className="h-11 w-11" onClick={handleManualSearch} disabled={isProcessing}>
                                <Search className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Botón para ver lista completa */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowProductList(true)}
                            disabled={isProcessing}
                        >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Ver Lista de Productos
                        </Button>
                    </CardContent>
                </Card>

                {/* Resumen de Pago */}
                <Card className="bg-primary text-primary-foreground shadow-xl border-none">
                    <CardHeader className="py-4">
                        <CardTitle>Total a Pagar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-primary-foreground/80">
                            <span>Neto</span>
                            <span>${Math.round(subtotal).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-primary-foreground/80 border-b border-primary-foreground/20 pb-2">
                            <span>IVA (19%)</span>
                            <span>${Math.round(iva).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-4xl font-black">
                            <span>TOTAL</span>
                            <span>${Math.round(total).toLocaleString('es-CL')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4">
                            <Button
                                size="lg"
                                className="bg-white text-primary hover:bg-white/90 font-bold uppercase tracking-wider"
                                disabled={isProcessing || items.length === 0}
                                onClick={() => handlePaymentClick("Efectivo")}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : "EFECTIVO"}
                            </Button>
                            <Button
                                size="lg"
                                className="bg-white/10 text-white hover:bg-white/20 font-bold border border-white/40 uppercase tracking-wider"
                                disabled={isProcessing || items.length === 0}
                                onClick={() => handlePaymentClick("Debito")}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : "TARJETA"}
                            </Button>
                        </div>
                        <Button size="lg" variant="outline" className="w-full text-white bg-transparent border-white/20 hover:bg-white/10 font-medium"
                            disabled={isProcessing || items.length === 0}
                            onClick={clearCart}>
                            CANCELAR VENTA
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Sesión */}
                <Card className="shadow-sm border-2 border-primary/5">
                    <CardContent className="p-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            <span>Sesión: Caja 01</span>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                            {userProfile?.email || "Invitado"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Diálogo de Pesables - Modo Dual */}
            <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Badge className="bg-blue-500">
                                PESABLE
                            </Badge>
                            Ingresar Precio
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Ingresa el precio del producto pesable seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="flex flex-col items-center gap-6">
                            <h3 className="text-2xl font-black text-center">{selectedProduct?.nombre}</h3>

                            {/* Modo Precio: Ingresar precio total */}
                            <div className="w-full space-y-4">
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                                    <p className="text-sm text-blue-700 font-medium mb-2">
                                        💡 Ingresa el precio que muestra la balanza
                                    </p>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        step="1"
                                        placeholder="0"
                                        className="w-full text-center text-4xl h-20 font-black focus-visible:ring-primary border-4 pl-12"
                                        value={priceOverride}
                                        onChange={(e) => setPriceOverride(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                confirmWeight()
                                            }
                                        }}
                                    />
                                </div>
                                <div className="text-center text-sm text-muted-foreground">
                                    Ejemplo: Si la balanza dice $1.500, ingresa 1500
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" className="flex-1 h-12 font-bold" onClick={() => setIsWeightDialogOpen(false)}>CANCELAR</Button>
                        <Button className="flex-1 h-12 font-bold text-lg" onClick={confirmWeight}>AGREGAR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Lista de Productos */}
            <Dialog open={showProductList} onOpenChange={setShowProductList}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Producto</DialogTitle>
                        <DialogDescription className="sr-only">
                            Lista interactiva de todos los productos disponibles en el inventario.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0">
                            <TabsTrigger value="todos">Todos</TabsTrigger>
                            {categories.map((cat) => (
                                <TabsTrigger key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                                {showProductList && allProducts
                                    .filter(product => {
                                        if (selectedCategory === "todos") return true
                                        return product.categoria_id === selectedCategory
                                    })
                                    .map((product) => {
                                        const isOutOfStock = !product.es_pesable && product.stock_cantidad <= 0
                                        return (
                                            <Card
                                                key={product.id}
                                                className={`${isOutOfStock
                                                    ? 'opacity-60 cursor-not-allowed bg-gray-50'
                                                    : 'cursor-pointer hover:shadow-lg hover:border-primary'
                                                    } transition-all`}
                                                onClick={() => {
                                                    if (!isOutOfStock) {
                                                        handleProductSelection(product)
                                                        setShowProductList(false)
                                                    }
                                                }}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="space-y-2">
                                                        <div className={`font-medium text-sm line-clamp-2 min-h-[2.5rem] ${isOutOfStock ? 'text-gray-500' : ''}`}>
                                                            {product.nombre}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {product.codigo_barras || "Sin código"}
                                                        </div>
                                                        {!product.es_pesable && (
                                                            <div className="text-xs">
                                                                <span className={`font-medium ${isOutOfStock
                                                                    ? 'text-red-600'
                                                                    : product.stock_cantidad < 5
                                                                        ? 'text-orange-600'
                                                                        : 'text-gray-600'
                                                                    }`}>
                                                                    Stock: {product.stock_cantidad}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <span className={`text-lg font-bold ${isOutOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                                                ${Math.round(product.precio_venta).toLocaleString('es-CL')}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {product.es_pesable && (
                                                                    <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-700 border-amber-200">
                                                                        PESABLE
                                                                    </Badge>
                                                                )}
                                                                {isOutOfStock && (
                                                                    <Badge variant="destructive" className="text-[9px]">
                                                                        SIN STOCK
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProductList(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Selector de Tipo de Documento */}
            <DocumentSelector
                open={showDocumentSelector}
                onOpenChange={setShowDocumentSelector}
                onSelect={handleDocumentTypeSelected}
                total={total}
            />

            {/* Formulario de Facturación */}
            <InvoiceForm
                open={showInvoiceForm}
                onOpenChange={setShowInvoiceForm}
                onSubmit={handleInvoiceDataSubmitted}
            />

            {/* Modal de Éxito */}
            <SuccessModal
                open={showSuccessModal}
                onOpenChange={setShowSuccessModal}
                transaction={lastTransaction}
                onNewSale={() => {
                    setShowSuccessModal(false)
                    setLastTransaction(null)
                    // El carrito ya se limpió en processCheckout
                }}
            />
        </div>
    )
}
