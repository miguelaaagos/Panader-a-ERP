import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { DashboardSummary, DashboardSummarySkeleton } from "@/components/dashboard/dashboard-summary"
import { DashboardChartsContainer, DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-container"
import { RecentSalesContainer, RecentSalesSkeleton } from "@/components/dashboard/recent-sales-container"
import { DashboardFilter } from "@/components/dashboard/dashboard-filter"

async function WelcomeMessage({ month, year }: { month?: number, year?: number }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user_id = claimsData?.claims?.sub

  if (!user_id) {
    redirect("/login")
  }

  const { data: profileData } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user_id)
    .single()

  const profile = profileData as { rol: string; nombre_completo: string | null } | null

  if (profile?.rol === "cajero") {
    redirect("/dashboard/erp")
  }

  const periodText = month && year
    ? `Visualizando métricas de ${format(new Date(year, month - 1), "MMMM yyyy", { locale: es })}.`
    : year
      ? `Visualizando métricas del año ${year}.`
      : "Resumen de actividad para tu panadería hoy."

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-serif text-primary md:text-4xl">
        Hola, {profile?.nombre_completo || claimsData?.claims?.email?.split('@')[0]}!
      </h1>
      <p className="text-muted-foreground">
        {periodText}
      </p>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const month = params.month ? parseInt(params.month as string) : undefined
  const year = params.year ? parseInt(params.year as string) : undefined

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <Suspense fallback={<div className="h-20 w-1/3 animate-pulse bg-muted rounded-lg" />}>
          <WelcomeMessage month={month} year={year} />
        </Suspense>

        <div className="flex gap-2">
          <DashboardFilter />
          <Link href="/dashboard/erp">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
              <ShoppingCart className="h-4 w-4" />
              Nueva Venta
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs Principales */}
      <Suspense fallback={<DashboardSummarySkeleton />}>
        <DashboardSummary month={month} year={year} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<DashboardChartsSkeleton />}>
            <DashboardChartsContainer month={month} year={year} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<RecentSalesSkeleton />}>
            <RecentSalesContainer />
          </Suspense>
        </div>
      </div>
    </div >
  )
}
