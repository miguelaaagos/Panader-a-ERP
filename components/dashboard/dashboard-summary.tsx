import { getDashboardStats } from "@/actions/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, FileText, ArrowUpRight, AlertTriangle } from "lucide-react"
import Link from "next/link"

export async function DashboardSummary() {
    const statsRes = await getDashboardStats()
    const stats = statsRes.success ? statsRes.data : null

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Hoy</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-serif text-primary">
                        ${(stats?.totalToday ?? 0).toLocaleString('es-CL')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {stats && stats.percentageChange >= 0 ? (
                            <span className="text-emerald-500 flex items-center">
                                <ArrowUpRight className="h-3 w-3" />
                                +{stats.percentageChange}%
                            </span>
                        ) : (
                            <span className="text-rose-500 flex items-center">
                                -{Math.abs(stats?.percentageChange || 0)}%
                            </span>
                        )}
                        vs ayer
                    </p>
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-serif">{stats?.countToday ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Órdenes procesadas </p>
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-serif">
                        ${(stats?.totalToday || 0) > 0 && (stats?.countToday || 0) > 0
                            ? Math.round(stats!.totalToday / stats!.countToday).toLocaleString('es-CL')
                            : 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Promedio por venta</p>
                </CardContent>
            </Card>

            <Link href="/dashboard/inventario" className="block h-full">
                <Card className={`h-full border-primary/10 shadow-sm transition-all hover:ring-2 hover:ring-primary/20 ${stats?.stockCritico ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500' : 'hover:bg-muted/50'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Stock Crítico</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${stats?.stockCritico ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-serif ${stats?.stockCritico ? 'text-amber-600' : ''}`}>
                            {stats?.stockCritico}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Productos por reponer</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

export function DashboardSummarySkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-primary/10 shadow-sm animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-4 bg-muted rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-16 bg-muted rounded mt-2" />
                        <div className="h-3 w-20 bg-muted rounded mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
