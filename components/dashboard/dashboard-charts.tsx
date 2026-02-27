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

const TopProductsUnitsChart = dynamic(() => import("./top-products-units-chart").then(mod => mod.TopProductsUnitsChart), {
    ssr: false,
    loading: () => <div className="h-[350px] bg-muted animate-pulse rounded-xl" />
})

const PeakHoursChart = dynamic(() => import("./peak-hours-chart").then(mod => mod.PeakHoursChart), {
    ssr: false,
    loading: () => <div className="lg:col-span-2 h-[350px] bg-muted animate-pulse rounded-xl" />
})

interface SalesTrendItem {
    date: string
    total: number
}

interface TopProductItem {
    nombre: string
    total: number
}

interface TopProductUnitItem {
    nombre: string
    cantidad: number
}

interface PeakHourItem {
    hourIndex: number
    hourLabel: string
    transacciones: number
    ingresos: number
}

interface DashboardChartsProps {
    salesTrend: SalesTrendItem[]
    topProducts: TopProductItem[]
    topProductsUnits: TopProductUnitItem[]
    peakHours: PeakHourItem[]
}

export function DashboardCharts({ salesTrend, topProducts, topProductsUnits, peakHours }: DashboardChartsProps) {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="lg:col-span-2">
                <SalesTrendChart data={salesTrend} />
            </div>
            <div className="lg:col-span-2">
                <PeakHoursChart data={peakHours} />
            </div>
            <div className="w-full">
                <TopProductsChart data={topProducts} />
            </div>
            <div className="w-full">
                <TopProductsUnitsChart data={topProductsUnits} />
            </div>
        </div>
    )
}
