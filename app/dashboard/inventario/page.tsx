"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Package, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, FolderOpen, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ProductFormDialog } from "@/components/inventario/product-form-dialog"
import { DeleteProductDialog } from "@/components/inventario/delete-product-dialog"
import { StockAdjuster } from "@/components/inventario/stock-adjuster"
import { CategoryManagerDialog } from "@/components/inventario/category-manager-dialog"
import { RoleGuard } from "@/components/auth/RoleGuard"

interface Categoria {
    id: string
    nombre: string
}

interface Producto {
    id: string
    nombre: string
    codigo: string | null
    precio_venta: number
    costo_unitario: number
    stock_actual: number
    stock_minimo: number
    unidad_medida: string
    tipo: 'ingrediente' | 'producto_terminado' | 'ambos'
    activo: boolean
    categoria_id: string | null
    categorias: {
        nombre: string
    } | null
}

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
    const [stockFiltro, setStockFiltro] = useState<string>("todos")
    const [estadoFiltro, setEstadoFiltro] = useState<string>("activos")
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    // Dialog states
    const [productFormOpen, setProductFormOpen] = useState(false)
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

    useEffect(() => {
        fetchProductos()
        fetchCategorias()
    }, [])

    useEffect(() => {
        let filtered = productos

        // Filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro de tipo
        if (tipoFiltro !== "todos") {
            filtered = filtered.filter(p => p.tipo === tipoFiltro)
        }

        // Filtro de stock
        if (stockFiltro === "bajo") {
            filtered = filtered.filter(p => p.stock_actual < p.stock_minimo && p.stock_actual > 0)
        } else if (stockFiltro === "sin_stock") {
            filtered = filtered.filter(p => p.stock_actual === 0)
        } else if (stockFiltro === "ok") {
            filtered = filtered.filter(p => p.stock_actual >= p.stock_minimo)
        }

        // Filtro de estado (activo/inactivo)
        if (estadoFiltro === "activos") {
            filtered = filtered.filter(p => p.activo)
        } else if (estadoFiltro === "inactivos") {
            filtered = filtered.filter(p => !p.activo)
        }

        // Filtro de categoría
        if (categoriaFiltro !== "todas") {
            // Manejar "sin_categoria" explícitamente si es necesario, 
            // o asumir que categoriaFiltro es un ID válido.
            // Si el producto no tiene categoria_id (null), no coincidirá con un ID.
            filtered = filtered.filter(p => p.categoria_id === categoriaFiltro)
        }

        setFilteredProductos(filtered)
        setCurrentPage(1) // Reset a primera página cuando cambian filtros
    }, [searchTerm, tipoFiltro, stockFiltro, estadoFiltro, categoriaFiltro, productos])

    const fetchCategorias = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("categorias")
                .select("id, nombre")
                .order("nombre")

            if (error) throw error
            setCategorias(data || [])
        } catch (error) {
            console.error("Error cargando categorías:", error)
        }
    }

    const fetchProductos = async () => {
        setLoading(true)
        try {
            const supabase = createClient()

            // Query con JOIN para obtener nombre de categoría
            const { data, error } = await supabase
                .from("productos")
                .select("*, categorias(nombre)")
                .order("nombre")

            if (error) {
                console.error("Error de Supabase:", error)
                throw error
            }

            setProductos(data || [])
            setFilteredProductos(data || [])
        } catch (error: any) {
            console.error("Error en fetchProductos:", error)
            toast.error("Error al cargar productos", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    // Cálculos de estadísticas
    const totalProductos = filteredProductos.length
    const productosPesables = filteredProductos.filter(p => p.unidad_medida !== 'unidades').length
    const stockBajo = filteredProductos.filter(p => p.stock_actual < p.stock_minimo && p.stock_actual > 0).length
    const sinStock = filteredProductos.filter(p => p.stock_actual === 0).length

    // Paginación
    const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentProductos = filteredProductos.slice(startIndex, endIndex)

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Inventario</h1>
                <div className="flex gap-2">
                    <RoleGuard permission="inventory.create">
                        <Button variant="outline" onClick={() => setCategoryManagerOpen(true)}>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Categorías
                        </Button>
                    </RoleGuard>
                    <RoleGuard permission="inventory.create">
                        <Button onClick={() => {
                            setSelectedProducto(null)
                            setProductFormOpen(true)
                        }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Producto
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            {/* Buscador */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o código de barras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Cards de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Total Productos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProductos}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {productosPesables} pesables
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Stock OK
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {filteredProductos.filter(p => p.stock_actual >= p.stock_minimo).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Stock suficiente
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Stock Bajo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stockBajo}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Requiere reposición
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Sin Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{sinStock}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Agotados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Categoría</label>
                            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    {categorias.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Tipo de Producto</label>
                            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="producto_terminado">Productos para Venta</SelectItem>
                                    <SelectItem value="ingrediente">Ingredientes</SelectItem>
                                    <SelectItem value="ambos">Uso Mixto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Estado de Stock</label>
                            <Select value={stockFiltro} onValueChange={setStockFiltro}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="ok">Stock OK</SelectItem>
                                    <SelectItem value="bajo">Stock Bajo</SelectItem>
                                    <SelectItem value="sin_stock">Sin Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Estado</label>
                            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activos">Activos</SelectItem>
                                    <SelectItem value="inactivos">Inactivos</SelectItem>
                                    <SelectItem value="todos">Todos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(tipoFiltro !== "todos" || stockFiltro !== "todos" || estadoFiltro !== "activos" || categoriaFiltro !== "todas" || searchTerm) && (
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setTipoFiltro("todos")
                                        setStockFiltro("todos")
                                        setEstadoFiltro("activos")
                                        setCategoriaFiltro("todas")
                                        setSearchTerm("")
                                    }}
                                >
                                    Limpiar Filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Productos */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                                <TableHead className="text-right">Margen</TableHead>
                                <TableHead className="text-right">Venta</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-64 text-center">
                                        Cargando productos...
                                    </TableCell>
                                </TableRow>
                            ) : currentProductos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-64 text-center text-muted-foreground">
                                        No se encontraron productos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentProductos.map((producto) => {
                                    const stockBajo = producto.unidad_medida === 'unidades' && (producto.stock_actual || 0) < producto.stock_minimo && (producto.stock_actual || 0) > 0
                                    const sinStock = producto.unidad_medida === 'unidades' && (producto.stock_actual || 0) === 0

                                    // Cálculo de Margen
                                    const costo = producto.costo_unitario || 0
                                    const venta = producto.precio_venta || 0
                                    const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0
                                    const margenValor = venta - costo

                                    return (
                                        <TableRow key={producto.id}>
                                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {producto.codigo || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {producto.categorias?.nombre || "Sin categoría"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {producto.tipo === 'producto_terminado' ? 'Venta' :
                                                        producto.tipo === 'ingrediente' ? 'Ingrediente' : 'Mixto'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {producto.activo ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Activo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                                                        Inactivo
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`${sinStock ? "text-red-600 font-bold" : stockBajo ? "text-orange-600 font-bold" : ""} font-medium`}>
                                                    {Number(producto.stock_actual).toLocaleString("es-CL", {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: producto.unidad_medida === 'unidades' ? 0 : 3
                                                    })} {producto.unidad_medida === 'unidades' ? 'uds' : producto.unidad_medida}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ${costo.toLocaleString("es-CL")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-medium ${margen < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {margen.toFixed(0)}%
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ${margenValor.toLocaleString("es-CL")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                ${venta.toLocaleString("es-CL")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <RoleGuard permission="inventory.adjust_stock">
                                                        <StockAdjuster
                                                            producto={producto}
                                                            onSuccess={fetchProductos}
                                                        />
                                                    </RoleGuard>
                                                    <RoleGuard permission="inventory.edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedProducto(producto)
                                                                setProductFormOpen(true)
                                                            }}
                                                            title="Editar producto"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </RoleGuard>
                                                    <RoleGuard permission="inventory.delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedProducto(producto)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </RoleGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProductos.length)} de {filteredProductos.length} productos
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    // Mostrar primera, última, actual y páginas cercanas
                                    return page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1
                                })
                                .map((page, index, array) => (
                                    <div key={page} className="flex items-center">
                                        {index > 0 && array[index - 1] !== page - 1 && (
                                            <span className="px-2">...</span>
                                        )}
                                        <Button
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    </div>
                                ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <ProductFormDialog
                open={productFormOpen}
                onOpenChange={setProductFormOpen}
                producto={selectedProducto}
                onSuccess={fetchProductos}
            />

            <DeleteProductDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                producto={selectedProducto}
                onSuccess={fetchProductos}
            />

            <CategoryManagerDialog
                open={categoryManagerOpen}
                onOpenChange={setCategoryManagerOpen}
                onSuccess={fetchProductos}
            />
        </div>
    )
}
