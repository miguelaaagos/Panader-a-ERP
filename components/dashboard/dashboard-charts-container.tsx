import { getSalesTrendData, getTopProductsData, getTopProductsByUnitsData, getPeakHoursData, getPaymentMethodData } from "@/actions/analytics"
import { DashboardCharts } from "./dashboard-charts"

export async function DashboardChartsContainer({ month, year }: { month?: number, year?: number }) {
    const [trendRes, topProductsRes, topUnitsRes, peakHoursRes, paymentMethodsRes] = await Promise.all([
        getSalesTrendData(month, year),
        getTopProductsData(month, year),
        getTopProductsByUnitsData(month, year),
        getPeakHoursData(month, year),
        getPaymentMethodData(month, year)
    ])

    const trendData = trendRes.success ? trendRes.data : []
    const topProducts = topProductsRes.success ? topProductsRes.data : []
    const topProductsUnits = topUnitsRes.success ? topUnitsRes.data : []
    const peakHours = peakHoursRes.success ? peakHoursRes.data : []
    const paymentMethods = paymentMethodsRes.success ? paymentMethodsRes.data : []

    return <DashboardCharts
        salesTrend={trendData || []}
        topProducts={topProducts || []}
        topProductsUnits={topProductsUnits || []}
        peakHours={peakHours || []}
        paymentMethods={paymentMethods || []}
    />
}

export function DashboardChartsSkeleton() {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="w-full h-[350px] bg-muted animate-pulse rounded-xl" />
            <div className="w-full h-[350px] bg-muted animate-pulse rounded-xl" />
        </div>
    )
}
