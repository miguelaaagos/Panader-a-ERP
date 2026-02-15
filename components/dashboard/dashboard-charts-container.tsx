import { getSalesTrendData, getTopProductsData } from "@/actions/analytics"
import { DashboardCharts } from "./dashboard-charts"

export async function DashboardChartsContainer() {
    const [trendRes, topProductsRes] = await Promise.all([
        getSalesTrendData(),
        getTopProductsData()
    ])

    const trendData = trendRes.success ? trendRes.data : []
    const topProducts = topProductsRes.success ? topProductsRes.data : []

    return <DashboardCharts salesTrend={trendData || []} topProducts={topProducts || []} />
}

export function DashboardChartsSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="h-[350px] bg-muted animate-pulse rounded-xl" />
        </div>
    )
}
