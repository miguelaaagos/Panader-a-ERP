import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import Link from "next/link"
import { ShoppingCart, Package, ChefHat, FileText } from "lucide-react"

import { DashboardSummary, DashboardSummarySkeleton } from "@/components/dashboard/dashboard-summary"
import { DashboardChartsContainer, DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-container"
import { CashSessionManager } from "@/components/caja/cash-session-manager"
import { StockAlertsContainer, StockAlertsSkeleton } from "@/components/dashboard/stock-alerts-container"

async function WelcomeMessage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-serif text-primary md:text-4xl">
        Hola, {profile?.nombre_completo || user.email?.split('@')[0]}!
      </h1>
      <p className="text-muted-foreground">Resumen de actividad para tu panadería hoy.</p>
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <Suspense fallback={<div className="h-20 w-1/3 animate-pulse bg-muted rounded-lg" />}>
          <WelcomeMessage />
        </Suspense>

        <div className="flex gap-2">
          <Link href="/dashboard/pos">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
              <ShoppingCart className="h-4 w-4" />
              Nueva Venta
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs Principales */}
      <Suspense fallback={<DashboardSummarySkeleton />}>
        <DashboardSummary />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<DashboardChartsSkeleton />}>
            <DashboardChartsContainer />
          </Suspense>
        </div>
        <div className="space-y-6">
          <CashSessionManager />
          <Suspense fallback={<StockAlertsSkeleton />}>
            <StockAlertsContainer />
          </Suspense>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/inventario">
          <div className="group rounded-xl border border-primary/10 bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Inventario</h3>
            </div>
            <p className="text-sm text-muted-foreground">Controla tus insumos y productos.</p>
          </div>
        </Link>
        <Link href="/dashboard/produccion">
          <div className="group rounded-xl border border-primary/10 bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Producción</h3>
            </div>
            <p className="text-sm text-muted-foreground">Recetas y órdenes de panificación.</p>
          </div>
        </Link>
        <Link href="/dashboard/ventas">
          <div className="group rounded-xl border border-primary/10 bg-card p-6 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Ventas</h3>
            </div>
            <p className="text-sm text-muted-foreground">Revisa el historial y cancelaciones.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
