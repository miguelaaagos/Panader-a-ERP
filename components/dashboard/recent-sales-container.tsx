import { getRecentSales } from "@/actions/sales"
import { createClient } from "@/lib/supabase/server"
import { RecentSalesList } from "./recent-sales-list"

export async function RecentSalesContainer() {
    const supabase = await createClient()
    const { data: claimsData } = await supabase.auth.getClaims()
    const tenant_id = claimsData?.claims?.app_metadata?.tenant_id

    if (!tenant_id) return null

    const res = await getRecentSales(tenant_id, 10)
    const sales = res.success ? (res.data || []) : []

    // Cast explicitly to match the expected RecentSale interface in client component
    const normalizedSales = sales.map((sale: any) => ({
        id: sale.id,
        created_at: sale.created_at,
        total: sale.total,
        metodo_pago: sale.metodo_pago,
        cliente_nombre: sale.cliente_nombre,
        usuario: sale.usuario
    }))

    return <RecentSalesList sales={normalizedSales} />
}

export function RecentSalesSkeleton() {
    return (
        <div className="h-full bg-muted animate-pulse rounded-xl" />
    )
}
