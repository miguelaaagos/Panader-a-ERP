import { getRecentSales } from "@/actions/sales"
import { createClient } from "@/lib/supabase/server"
import { RecentSalesList, RecentSale } from "./recent-sales-list"

export async function RecentSalesContainer() {
    const supabase = await createClient()
    const { data: claimsData } = await supabase.auth.getClaims()
    const tenant_id = claimsData?.claims?.app_metadata?.tenant_id

    if (!tenant_id) return null

    const res = await getRecentSales(tenant_id, 10)
    const sales = res.success ? (res.data || []) : []

    // Cast explicitly to match the expected RecentSale interface in client component
    const normalizedSales: RecentSale[] = sales.map((sale: any) => ({
        id: sale.id as string,
        created_at: sale.created_at as string,
        total: sale.total as number,
        metodo_pago: (sale.metodo_pago as string) || "efectivo",
        cliente_nombre: (sale.cliente_nombre as string | null),
        usuario: (sale.usuario as { nombre_completo: string } | null)
    }))

    return <RecentSalesList sales={normalizedSales} />
}

export function RecentSalesSkeleton() {
    return (
        <div className="h-full bg-muted animate-pulse rounded-xl" />
    )
}
