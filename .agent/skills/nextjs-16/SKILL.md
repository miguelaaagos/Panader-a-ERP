---
name: nextjs-16-patterns
description: Patrones modernos de Next.js 16 App Router incluyendo Cache Components, async request APIs, y Server Components. Úsame cuando trabajes en el directorio app/ o con patrones de Next.js.
version: 1.0.0
tags: [nextjs, react, app-router, caching]
---

# Next.js 16 App Router Patterns

## Cambios Críticos de Next.js 16 (Octubre 2025)

### 1. Proxy.ts reemplaza Middleware.ts

```typescript
// ❌ DEPRECADO: middleware.ts con export default
export default function middleware(request: NextRequest) { }

// ✅ CORRECTO: proxy.ts con export named function 'proxy'
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. Request APIs son Async

```typescript
// ❌ INCORRECTO (no funciona en Next.js 16)
export default function Page({ params, searchParams }: PageProps) {
  const slug = params.slug
  const query = searchParams.q
}

// ✅ CORRECTO
export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { slug } = await params
  const { q } = await searchParams
}
```

```typescript
// ❌ INCORRECTO
const cookieStore = cookies()
const headersList = headers()

// ✅ CORRECTO
const cookieStore = await cookies()
const headersList = await headers()
```

### 3. Cache Components con "use cache"

```typescript
// ❌ DEPRECADO
import { unstable_cache } from 'next/cache'
const getCachedUser = unstable_cache(getUser, ['user'])

// ✅ CORRECTO
"use cache"
import { cacheTag, cacheLife } from 'next/cache'

export async function getUser(id: string) {
  cacheTag('users', `user-${id}`)
  cacheLife('hours')  // Perfiles: seconds, minutes, hours, days, weeks, max
  
  const user = await db.users.findUnique({ where: { id } })
  return user
}
```

### 4. Next.config.ts cambios

```typescript
// ❌ DEPRECADO
experimental: {
  ppr: true,
  dynamicIO: true,
}

// ✅ CORRECTO
const nextConfig: NextConfig = {
  cacheComponents: true,  // Habilita "use cache"
}
```

## Patterns de Caching

### Cache Component Básico

```typescript
"use cache"
import { cacheTag, cacheLife } from 'next/cache'

export async function ProductList() {
  cacheTag('products')
  cacheLife('minutes')
  
  const products = await db.products.findMany()
  
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

### Cache con múltiples tags

```typescript
"use cache"
import { cacheTag, cacheLife } from 'next/cache'

export async function getProductWithReviews(productId: string) {
  cacheTag('products', `product-${productId}`, 'reviews')
  cacheLife('hours')
  
  const product = await db.products.findUnique({
    where: { id: productId },
    include: { reviews: true }
  })
  
  return product
}
```

### Revalidación desde Server Action

```typescript
'use server'
import { revalidateTag } from 'next/cache'

export async function createProduct(formData: FormData) {
  const product = await db.products.create({
    data: {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
    }
  })
  
  // Invalida cache de productos
  revalidateTag('products')
  
  return product
}
```

### updateTag para Read-Your-Writes

```typescript
'use server'
import { updateTag } from 'next/cache'

export async function updateProduct(id: string, data: any) {
  await db.products.update({
    where: { id },
    data,
  })
  
  // updateTag() permite que el usuario vea el cambio inmediatamente
  // (mejor que revalidateTag para updates del usuario actual)
  updateTag('products', `product-${id}`)
}
```

### Variantes de "use cache"

```typescript
// In-memory LRU cache (default)
"use cache"

// Redis cache (requiere configuración)
"use cache: remote"

// Browser-only cache
"use cache: private"
```

## Server Components Patterns

### Fetch Directo en Server Component

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // Fetch directo - no useEffect, no useState
  const products = await db.products.findMany()
  
  return (
    <div>
      <h1>Productos</h1>
      <ProductList products={products} />
    </div>
  )
}
```

### Streaming con Suspense

```typescript
import { Suspense } from 'react'

export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Se renderiza inmediatamente */}
      <QuickStats />
      
      {/* Streams cuando está listo */}
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </Suspense>
      
      {/* Streams independientemente */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}

async function AnalyticsChart() {
  // Query lento
  const data = await db.analytics.aggregate()
  return <Chart data={data} />
}
```

### Server Component + Client Component Composition

```typescript
// app/products/[id]/page.tsx (Server Component)
import { ProductClient } from './product-client'

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  // Fetch en servidor
  const product = await db.products.findUnique({
    where: { id },
    include: { reviews: true }
  })
  
  if (!product) {
    notFound()
  }
  
  // Pasar data a Client Component
  return <ProductClient product={product} />
}

// product-client.tsx (Client Component)
'use client'

export function ProductClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  
  return (
    <div>
      <h1>{product.name}</h1>
      <input 
        type="number" 
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <button onClick={() => addToCart(product.id, quantity)}>
        Agregar al Carrito
      </button>
    </div>
  )
}
```

## Server Actions

### Basic Form Action

```typescript
// app/actions/product-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const price = Number(formData.get('price'))
  
  const product = await db.products.create({
    data: { name, price }
  })
  
  revalidatePath('/products')
  redirect(`/products/${product.id}`)
}
```

### Progressive Enhancement con useActionState

```typescript
'use client'
import { useActionState } from 'react'
import { createProduct } from '@/app/actions/product-actions'

export function ProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, null)
  
  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="price" type="number" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear Producto'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  )
}
```

### Server Action con Validación

```typescript
'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
})

export async function createProduct(formData: FormData) {
  // Validar
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    price: Number(formData.get('price')),
    description: formData.get('description'),
  })
  
  if (!parsed.success) {
    return { 
      error: 'Datos inválidos',
      errors: parsed.error.flatten().fieldErrors 
    }
  }
  
  // Crear
  const product = await db.products.create({
    data: parsed.data
  })
  
  revalidateTag('products')
  return { success: true, product }
}
```

## File Conventions

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home page
├── loading.tsx             # Loading UI (automático Suspense)
├── error.tsx               # Error boundary (must be "use client")
├── not-found.tsx           # 404 page
├── global-error.tsx        # Global error handler
├── template.tsx            # Re-renders on navigation
├── default.tsx             # Parallel routes fallback
│
├── (marketing)/            # Route group (no afecta URL)
│   ├── about/page.tsx      # /about
│   └── blog/page.tsx       # /blog
│
├── dashboard/
│   ├── layout.tsx          # Nested layout
│   ├── page.tsx            # /dashboard
│   ├── loading.tsx         # Loading state
│   └── settings/
│       └── page.tsx        # /dashboard/settings
│
├── api/
│   └── webhooks/
│       └── route.ts        # API route handler
│
└── [slug]/                 # Dynamic segment
    └── page.tsx            # /anything
```

## Route Handlers

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const category = searchParams.get('category')
  
  const products = await db.products.findMany({
    where: category ? { category } : undefined
  })
  
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const product = await db.products.create({
    data: body
  })
  
  return NextResponse.json(product, { status: 201 })
}
```

## Metadata API

```typescript
// app/products/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params
  const product = await db.products.findUnique({ where: { id } })
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.imageUrl],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  // ...
}
```

## Dynamic Imports

```typescript
import dynamic from 'next/dynamic'

// Componente que solo carga en cliente
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  ssr: false,
  loading: () => <p>Cargando gráfico...</p>
})

export default function Dashboard() {
  return (
    <div>
      <h1>Analytics</h1>
      <HeavyChart />
    </div>
  )
}
```

## Image Optimization

```typescript
import Image from 'next/image'

export default function ProductImage({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={300}
      priority  // Para imágenes above-the-fold
      placeholder="blur"
      blurDataURL="data:image/..." // Placeholder base64
    />
  )
}
```

## Incremental Static Regeneration (ISR)

```typescript
export const revalidate = 3600 // Revalidar cada hora

export default async function BlogPost({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const post = await fetchPost(slug)
  
  return <article>{post.content}</article>
}
```

## Performance Tips

1. **Server Components por defecto** - maximiza performance
2. **Suspense boundaries** - streaming para UX instantánea
3. **"use cache"** - reduce database queries
4. **next/image** - optimización automática de imágenes
5. **Dynamic imports** - code splitting para componentes pesados
6. **Route prefetching** - Next.js prefetch links automáticamente
