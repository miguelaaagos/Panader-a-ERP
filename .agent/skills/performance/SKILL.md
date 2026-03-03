---
name: performance
description: Estrategias de performance para Next.js 16 en Vercel. Cold starts, caching con "use cache", ISR, TanStack Query staleTime, Suspense streaming. Úsame cuando una ruta sea lenta o al optimizar el tiempo de respuesta.
version: 1.0.0
tags: [performance, vercel, cold-starts, cache, isr, suspense]
---

# Performance — Vercel + Next.js 16

## El problema: cold starts en Vercel

En el plan Hobby/gratuito de Vercel, las funciones serverless **hibernan tras ~5 minutos de inactividad**.
El primer request del día puede tardar 3-8 segundos. Esto es una limitación de plataforma, no de código.

**¿Cómo saber si es cold start?**
- Lentitud solo en el primer acceso del día o tras periodo de inactividad
- Requests posteriores son rápidos (< 500ms)
- Si es lento siempre → problema de código, no de cold start

## Estrategia 1: "use cache" — la más efectiva

Convierte Server Components y funciones en cached. El resultado se guarda en el LRU cache de Next.js y **no vuelve a ejecutar código serverless** en el siguiente request.

```typescript
// queries/sales.ts
"use cache"
import { cacheTag, cacheLife } from 'next/cache'

export async function getSalesSummary(tenantId: string) {
  cacheTag('sales', `sales-${tenantId}`)
  cacheLife('minutes')  // se sirve del cache los próximos minutos

  const supabase = await createClient()
  const { data } = await supabase
    .from('sales')
    .select('...')
    .eq('tenant_id', tenantId)

  return data
}
```

**Cuándo invalidar:**
```typescript
'use server'
import { revalidateTag } from 'next/cache'

export async function createSale(formData: FormData) {
  // ... crear venta
  revalidateTag(`sales-${tenantId}`)  // invalida solo este tenant
}
```

**cacheLife presets:**
| Preset | TTL aproximado | Usar para |
|---|---|---|
| `'seconds'` | ~30s | Datos muy dinámicos |
| `'minutes'` | ~5m | Dashboard, métricas |
| `'hours'` | ~1h | Catálogos, recetas |
| `'days'` | ~1d | Config, roles |
| `'weeks'` | ~7d | Datos estáticos |

## Estrategia 2: Suspense streaming

En vez de bloquear toda la página, renderiza el shell inmediatamente y stream los datos lentos:

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { SalesSkeleton, InventorySkeleton } from '@/components/skeletons'

export default async function DashboardPage() {
  return (
    <div>
      {/* Renderiza INMEDIATAMENTE — no bloquea */}
      <DashboardHeader />

      {/* Stream cuando estén listos — independientes */}
      <Suspense fallback={<SalesSkeleton />}>
        <SalesSummary />
      </Suspense>

      <Suspense fallback={<InventorySkeleton />}>
        <InventoryAlerts />
      </Suspense>
    </div>
  )
}
```

El usuario ve la UI inmediatamente. Los datos aparecen cuando llegan. **Elimina la sensación de pantalla en blanco.**

## Estrategia 3: ISR para páginas semi-estáticas

```typescript
// app/productos/page.tsx
export const revalidate = 300  // Revalida cada 5 minutos

export default async function ProductosPage() {
  const productos = await getProductos()
  return <ProductosGrid productos={productos} />
}
```

La página se sirve como HTML estático hasta que expira el TTL. **No hay función serverless en cada request.**

## Estrategia 4: TanStack Query — staleTime correcto

Evita refetches innecesarios configurando `staleTime` según la criticidad del dato:

```typescript
// Para dashboard (se puede ver dato de hace 5 min)
useQuery({
  queryKey: ['sales-summary', tenantId],
  staleTime: 1000 * 60 * 5,   // 5 minutos
  gcTime:    1000 * 60 * 10,  // mantener en memoria 10 min
})

// Para inventario del POS (crítico, se actualiza al vender)
useQuery({
  queryKey: ['inventory', tenantId],
  staleTime: 1000 * 60 * 2,   // 2 minutos
  refetchOnWindowFocus: true,  // actualizar al volver al tab
})

// Para catálogos/recetas (raramente cambian)
useQuery({
  queryKey: ['recipes', tenantId],
  staleTime: 1000 * 60 * 30,  // 30 minutos
  refetchOnWindowFocus: false,
})
```

## Estrategia 5: `export const dynamic = 'force-static'`

Para rutas que no necesitan datos de usuario (landing, login, etc.):

```typescript
// app/page.tsx (página de bienvenida)
export const dynamic = 'force-static'

export default function HomePage() {
  return <LandingPage />
}
```

## Estrategia 6: Warm-up externo (workaround cold starts)

Si el cold start del primer acceso sigue molestando, se puede pingar el sitio periódicamente desde un servicio gratuito:

- **UptimeRobot** (free): ping cada 5 minutos → mantiene las funciones tibias
- **Cron job en Supabase**: `pg_cron` para llamar a un endpoint de healthcheck

```typescript
// app/api/health/route.ts — endpoint liviano para warm-up
export async function GET() {
  return Response.json({ ok: true, ts: Date.now() })
}
```

**Nota**: Vercel puede igualmente hibernar aunque pingen. Es mitigación, no solución. La solución real es el plan Pro de Vercel o migrar a un servidor persistente (Railway, Fly.io).

## Diagnóstico rápido

```bash
# Ver qué rutas son lentas con Vercel Analytics (free tier)
# O medir localmente:
curl -w "\nTiempo total: %{time_total}s\n" -o /dev/null -s http://localhost:3000/dashboard

# Verificar que "use cache" está activo (build output mostrará 'ƒ' vs '○')
pnpm build
# ○ = Static, ƒ = Dynamic (serverless), ● = ISR
```

## Checklist de performance por ruta

```
app/dashboard/page.tsx
□ ¿Usa Suspense para datos lentos?
□ ¿Las queries tienen "use cache" con cacheTag?
□ ¿TanStack Query tiene staleTime > 0?
□ ¿Hay Skeleton components para loading?

app/(pos)/page.tsx
□ ¿El inventario inicial se sirve cacheado?
□ ¿Solo el carrito (Zustand) es client-side?

app/api/*/route.ts
□ ¿Los endpoints de solo lectura tienen cache headers?
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
  })
```
