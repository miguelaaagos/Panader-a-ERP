"use client"

import dynamic from "next/dynamic"

const SalesTrendChart = dynamic(() => import("./sales-trend-chart").then(mod => mod.SalesTrendChart), {
    ssr: false,
    loading: () => <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
})

const TopProductsChart = dynamic(() => import("./top-products-chart").then(mod => mod.TopProductsChart), {
    ssr: false,
    loading: () => <div className="h-[350px] bg-muted animate-pulse rounded-xl" />
})

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
