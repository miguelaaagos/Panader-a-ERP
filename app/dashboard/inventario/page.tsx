import { createClient } from "@/lib/supabase/server"
import { InventarioClient } from "./inventario-client"

export const metadata = {
    title: "Inventario - Panadería ERP",
}

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InventarioPage({ searchParams }: PageProps) {
    const params = await searchParams
    const supabase = await createClient()

    // Filters from searchParams
    const q = typeof params.q === 'string' ? params.q : ""
    const tipo = typeof params.tipo === 'string' ? params.tipo : "todos"
    const stock = typeof params.stock === 'string' ? params.stock : "todos"
    const estado = typeof params.estado === 'string' ? params.estado : "activos"
    const cat = typeof params.cat === 'string' ? params.cat : "todas"
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1
    const itemsPerPage = 20

    // Fetch Categories
    const { data: categorias = [] } = await supabase
        .from("categorias")
        .select("id, nombre")
        .order("nombre")

    // Base query for Products
    let query = supabase
        .from("productos")
        .select("*, categorias(nombre)", { count: "exact" })

    // Apply Filters
    if (q) {
        query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%`)
    }
    if (tipo !== "todos") {
        query = query.eq("tipo", tipo as any)
    }
    if (estado === "activos") {
        query = query.eq("activo", true)
    } else if (estado === "inactivos") {
        query = query.eq("activo", false)
    }
    if (cat !== "todas") {
        query = query.eq("categoria_id", cat)
    }

    // Fetch all for stats (simplified for now, ideally stats would be a separate faster query)
    const { data: allProducts = [] } = await query

    // Apply Stock Filter client-side-on-server for simplicity or use complex Postgres filters
    // Given the scale, filtering the'allProducts' array for stats and specific view is fine.

    let filtered = [...(allProducts || [])]

    if (stock === "bajo") {
        filtered = filtered.filter(p => (p.stock_actual ?? 0) < (p.stock_minimo ?? 0) && (p.stock_actual ?? 0) > 0)
    } else if (stock === "sin_stock") {
        filtered = filtered.filter(p => (p.stock_actual ?? 0) === 0)
    } else if (stock === "ok") {
        filtered = filtered.filter(p => (p.stock_actual ?? 0) >= (p.stock_minimo ?? 0))
    }

    // Stats calculation
    const stats = {
        total: allProducts?.length || 0,
        pesables: allProducts?.filter(p => p.unidad_medida !== 'unidades').length || 0,
        bajo: allProducts?.filter(p => (p.stock_actual ?? 0) < (p.stock_minimo ?? 0) && (p.stock_actual ?? 0) > 0).length || 0,
        sinStock: allProducts?.filter(p => (p.stock_actual ?? 0) === 0).length || 0,
        ok: allProducts?.filter(p => (p.stock_actual ?? 0) >= (p.stock_minimo ?? 0)).length || 0,
    }

    // Sorting: Agotados al final
    filtered.sort((a, b) => {
        const aSinStock = (a.stock_actual || 0) <= 0;
        const bSinStock = (b.stock_actual || 0) <= 0;
        if (aSinStock && !bSinStock) return 1;
        if (!aSinStock && bSinStock) return -1;
        return a.nombre.localeCompare(b.nombre);
    })

    // Pagination
    const totalFiltered = filtered.length
    const totalPages = Math.ceil(totalFiltered / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage)

    return (
        <InventarioClient
            initialProductos={paginatedProducts}
            categorias={categorias || []}
            stats={stats}
            filters={{ q, tipo, stock, estado, cat, page }}
            totalPages={totalPages}
        />
    )
}
