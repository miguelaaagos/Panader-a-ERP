import { getSalesTrendData, getTopProductsData, getTopProductsByUnitsData } from "@/actions/analytics"
import { DashboardCharts } from "./dashboard-charts"

export async function DashboardChartsContainer() {
    const [trendRes, topProductsRes, topUnitsRes] = await Promise.all([
        getSalesTrendData(),
        getTopProductsData(),
        getTopProductsByUnitsData()
    ])

    const trendData = trendRes.success ? trendRes.data : []
    const topProducts = topProductsRes.success ? topProductsRes.data : []
    const topProductsUnits = topUnitsRes.success ? topUnitsRes.data : []

    return <DashboardCharts salesTrend={trendData || []} topProducts={topProducts || []} topProductsUnits={topProductsUnits || []} />
}

export function DashboardChartsSkeleton() {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="w-full h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="w-full h-[350px] bg-muted animate-pulse rounded-xl" />
        </div>
    )
}
