import { getDashboardStats } from "@/actions/analytics"
import { StockAlerts } from "./stock-alerts"

export async function StockAlertsContainer() {
    const statsRes = await getDashboardStats()
    const stats = statsRes.success ? statsRes.data : null

    return <StockAlerts items={stats?.criticalItems || []} />
}

export function StockAlertsSkeleton() {
    return (
        <div className="h-48 w-full bg-muted animate-pulse rounded-xl" />
    )
}
