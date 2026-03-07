"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Package, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, FolderOpen, Pencil, Trash2, RefreshCw } from "lucide-react"
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
    precio_venta: number | null
    costo_unitario: number | null
    stock_actual: number | null
    stock_minimo: number | null
    unidad_medida: string
    tipo: 'ingrediente' | 'producto_terminado' | 'ambos'
    activo: boolean | null
    categoria_id: string | null
    categorias: {
        nombre: string
    } | null
}

interface InventarioClientProps {
    initialProductos: Producto[]
    categorias: Categoria[]
    stats: {
        total: number
        pesables: number
        bajo: number
        sinStock: number
        ok: number
    }
    filters: {
        q: string
        tipo: string
        stock: string
        estado: string
        cat: string
        page: number
    }
    totalPages: number
}

export function InventarioClient({ initialProductos, categorias, stats, filters, totalPages }: InventarioClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Dialog states
    const [productFormOpen, setProductFormOpen] = useState(false)
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

    const [searchInput, setSearchInput] = useState(filters.q)

    const updateFilters = (newFilters: Partial<typeof filters>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
            if (value && value !== "todos" && value !== "todas" && value !== "activos" && value !== "" && value !== 1) {
                params.set(key, value.toString())
            } else if (key === "estado" && value === "activos") {
                params.delete(key) // Default is activos
            } else {
                params.delete(key)
            }
        })

        // Always reset to page 1 on filter change unless specifically changing page
        if (!newFilters.page) {
            params.delete("page")
        }

        startTransition(() => {
            router.push(`/dashboard/inventario?${params.toString()}`)
        })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateFilters({ q: searchInput, page: 1 })
    }

    return (
        <div className="p-6 space-y-6 relative">
            {isPending && (
                <div className="fixed inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-50">
                    <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}

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
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o código de barras..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </form>
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
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.pesables} pesables
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
                            {stats.ok}
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
                        <div className="text-2xl font-bold text-orange-600">{stats.bajo}</div>
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
                        <div className="text-2xl font-bold text-red-600">{stats.sinStock}</div>
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
                            <Select value={filters.cat} onValueChange={(v) => updateFilters({ cat: v })}>
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
                            <Select value={filters.tipo} onValueChange={(v) => updateFilters({ tipo: v })}>
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
                            <Select value={filters.stock} onValueChange={(v) => updateFilters({ stock: v })}>
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
                            <Select value={filters.estado} onValueChange={(v) => updateFilters({ estado: v })}>
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

                        {(filters.tipo !== "todos" || filters.stock !== "todos" || filters.estado !== "activos" || filters.cat !== "todas" || filters.q !== "") && (
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchInput("")
                                        updateFilters({
                                            q: "",
                                            tipo: "todos",
                                            stock: "todos",
                                            estado: "activos",
                                            cat: "todas",
                                            page: 1
                                        })
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
                                <TableHead className="hidden md:table-cell">Código</TableHead>
                                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                                <TableHead className="hidden md:table-cell">Estado</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Costo</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Margen</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Venta</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialProductos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-64 text-center text-muted-foreground">
                                        No se encontraron productos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialProductos.map((producto) => {
                                    const stockBajo = producto.unidad_medida === 'unidades' && (producto.stock_actual ?? 0) < (producto.stock_minimo ?? 0) && (producto.stock_actual ?? 0) > 0
                                    const sinStock = (producto.stock_actual || 0) === 0

                                    const costo = producto.costo_unitario || 0
                                    const venta = producto.precio_venta || 0
                                    const costoIva = costo * 1.19
                                    const margen = venta > 0 ? ((venta - costoIva) / venta) * 100 : 0
                                    const margenValor = Math.round((venta / 1.19) - costo)

                                    return (
                                        <TableRow key={producto.id} className={sinStock ? "opacity-60 grayscale-[0.5] hover:opacity-100 transition-opacity bg-red-50/10" : ""}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span>{producto.nombre}</span>
                                                        {sinStock && (
                                                            <Badge variant="destructive" className="text-[10px] px-1.5 h-4 leading-none uppercase tracking-wider">
                                                                Agotado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="sm:hidden text-xs text-muted-foreground font-normal">
                                                        Venta: ${venta.toLocaleString("es-CL")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm hidden md:table-cell">
                                                {producto.codigo || "-"}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="outline">
                                                    {producto.categorias?.nombre || "Sin categoría"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline">
                                                    {producto.tipo === 'producto_terminado' ? 'Venta' :
                                                        producto.tipo === 'ingrediente' ? 'Ingrediente' : 'Mixto'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
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
                                            <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                                                ${costo.toLocaleString("es-CL")}
                                            </TableCell>
                                            <TableCell className="text-right hidden sm:table-cell">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-medium ${margen < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {margen.toFixed(0)}%
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ${margenValor.toLocaleString("es-CL")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold hidden sm:table-cell">
                                                ${venta.toLocaleString("es-CL")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <RoleGuard permission="inventory.adjust_stock">
                                                        <StockAdjuster
                                                            producto={producto}
                                                            onSuccess={() => router.refresh()}
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
                        Página {filters.page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                            disabled={filters.page === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: Math.min(totalPages, filters.page + 1) })}
                            disabled={filters.page === totalPages}
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
                producto={selectedProducto as any}
                onSuccess={() => router.refresh()}
            />

            <DeleteProductDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                producto={selectedProducto as any}
                onSuccess={() => router.refresh()}
            />

            <CategoryManagerDialog
                open={categoryManagerOpen}
                onOpenChange={setCategoryManagerOpen}
                onSuccess={() => router.refresh()}
            />
        </div>
    )
}
