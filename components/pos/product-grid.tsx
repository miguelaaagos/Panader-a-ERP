"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Search, Loader2, List, LayoutGrid, PackageOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Product {
    id: string
    nombre: string
    precio_venta: number
    stock_actual: number
    unidad_medida: string
    categoria_id?: string
    es_pesable: boolean
}

export interface Category {
    id: string
    nombre: string
}

interface ProductGridProps {
    products: Product[]
    categories: Category[]
    loading: boolean
    onAddToCart: (product: Product) => void
}

export function ProductGrid({ products, categories, loading, onAddToCart }: ProductGridProps) {
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === "all" || p.categoria_id === selectedCategory
        return matchesSearch && matchesCategory
    })

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Cabecera: Búsqueda y Filtros */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o código..."
                        className="pl-9 h-11 bg-background/50 border-muted-foreground/20 focus:bg-background transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filtro de Categorías */}
            <ScrollArea className="w-full pb-3">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                    <TabsList className="h-10 bg-transparent gap-2 p-0 inline-flex w-max">
                        <TabsTrigger
                            value="all"
                            className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-muted-foreground/20"
                        >
                            Todos
                        </TabsTrigger>
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-muted-foreground/20 whitespace-nowrap"
                            >
                                {cat.nombre}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Listado de Productos */}
            <div className="flex-1 overflow-y-auto pr-1">
                {filteredProducts.length > 0 ? (
                    <div className={cn(
                        "gap-3 transition-all duration-300",
                        viewMode === "grid"
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                            : "flex flex-col"
                    )}>
                        {filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className={cn(
                                    "cursor-pointer transition-all border-muted-foreground/10 hover:border-primary active:scale-[0.98] group relative overflow-hidden",
                                    viewMode === "list" ? "hover:bg-muted/30" : "flex flex-col"
                                )}
                                onClick={() => onAddToCart(product)}
                            >
                                <CardContent className={cn("p-3", viewMode === "list" && "flex items-center justify-between gap-4")}>
                                    {viewMode === "grid" ? (
                                        <div className="flex flex-col gap-2">
                                            <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {product.nombre}
                                            </h3>
                                            <div className="flex justify-between items-end mt-auto">
                                                <span className="text-primary font-bold text-base">
                                                    ${product.precio_venta.toLocaleString("es-CL")}
                                                </span>
                                                <Badge
                                                    variant={product.stock_actual <= 0 ? "destructive" : "outline"}
                                                    className="text-[10px] px-1.5 h-5 bg-background/50 font-normal"
                                                >
                                                    {product.stock_actual} {product.unidad_medida}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col">
                                                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                                    {product.nombre}
                                                </h3>
                                                <span className="text-muted-foreground text-xs">
                                                    Stock: {product.stock_actual} {product.unidad_medida}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-primary font-bold text-lg">
                                                    ${product.precio_venta.toLocaleString("es-CL")}
                                                </span>
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    +
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20">
                        <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No se encontraron productos</p>
                        {search || selectedCategory !== "all" ? (
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    setSearch("")
                                    setSelectedCategory("all")
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

