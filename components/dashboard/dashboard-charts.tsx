"use client"

import { SalesTrendChart } from "./sales-trend-chart"
import { TopProductsChart } from "./top-products-chart"

interface DashboardChartsProps {
    salesTrend: any[]
    topProducts: any[]
}

export function DashboardCharts({ salesTrend, topProducts }: DashboardChartsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SalesTrendChart data={salesTrend} />
            <TopProductsChart data={topProducts} />
        </div>
    )
}
