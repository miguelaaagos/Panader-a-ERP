"use client"

import { SalesTrendChart } from "./sales-trend-chart"
import { TopProductsChart } from "./top-products-chart"

interface SalesTrendItem {
    date: string
    total: number
}

interface TopProductItem {
    nombre: string
    total: number
}

interface DashboardChartsProps {
    salesTrend: SalesTrendItem[]
    topProducts: TopProductItem[]
}

export function DashboardCharts({ salesTrend, topProducts }: DashboardChartsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SalesTrendChart data={salesTrend} />
            <TopProductsChart data={topProducts} />
        </div>
    )
}
