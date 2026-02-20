# Stack Contract — Next.js 16 + Supabase + TypeScript (Febrero 2026)

Eres un experto en TypeScript, Next.js 16 App Router, React 19, Supabase SSR, y Tailwind CSS v4.

## Versiones del Stack (Febrero 2026)

- **Next.js**: 16.1.6 con App Router (NO Pages Router)
- **React**: 19.2.4 con Server Components
- **TypeScript**: 5.9.3 en modo estricto
- **Supabase**: @supabase/ssr v0.8.0 (NUNCA @supabase/auth-helpers-nextjs)
- **Supabase JS**: @supabase/supabase-js v2.95.3
- **Tailwind CSS**: v3.4.19 (Usando tailwind.config.ts)
- **Validación**: Zod v4.3.6
- **Bundler**: Turbopack (default)
- **Package Manager**: pnpm (Actual) / npm (Alternativo)

## Reglas Absolutas (NUNCA VIOLAR)

### 1. Proxy vs Middleware
- ✅ USA: `proxy.ts` en la raíz (export function `proxy`)
- ❌ ELIMINAR: `middleware.ts` (obsoleto en Next.js 16)
- ❌ EVITAR: `lib/supabase/proxy.ts` redundante (centralizar en raíz)

### 2. Caching
- ✅ USA: `"use cache"` directive con `cacheTag()` y `cacheLife()`
- ❌ NUNCA: `unstable_cache`, `experimental.ppr`
- ✅ CONFIGURACIÓN: `cacheComponents: true` en next.config.ts

### 3. Request APIs (TODOS ASYNC en Next.js 16)
```typescript
// ✅ CORRECTO
const { slug } = await params
const cookieStore = await cookies()
const headersList = await headers()

// ❌ INCORRECTO (ya no funciona)
const { slug } = params
const cookieStore = cookies()
```

### 4. Supabase Auth
- ✅ USA: `@supabase/ssr` con patrón `getAll()/setAll()` para cookies
- ❌ NUNCA: `@supabase/auth-helpers-nextjs` (archivado/deprecado)
- ✅ USA: `getClaims()` para validar auth en servidor
- ❌ NUNCA: `getSession()` en código servidor (no valida JWT)

### 5. Server Components (Default)
- Server Components por defecto
- `"use client"` SOLO para: event handlers, useState, useEffect, browser APIs
- Wrap client components en `<Suspense>` con fallback
- Fetch data directamente en Server Components con async/await

### 6. TypeScript Estricto
- NO usar `any` nunca
- Return types explícitos en exports
- `noUncheckedIndexedAccess: true`
- Interfaces para props de componentes

### 7. Keys de Supabase (Cambio 2025)
```env
# ✅ NUEVO formato (publishable/secret)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# ❌ VIEJO formato (todavía funciona pero deprecándose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Patrones de Supabase Client

### Browser Client (lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Server Client (lib/supabase/server.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado en Server Component context
          }
        },
      },
    }
  )
}
```

### Proxy Session Refresh (proxy.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validar JWT
  await supabase.auth.getClaims()
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Auth Check Pattern (Server)
```typescript
const supabase = await createClient()
const { data: { claims }, error } = await supabase.auth.getClaims()

if (error || !claims) {
  redirect('/login')
}

// claims contiene: sub (user id), email, role, etc.
```

## Arquitectura de Carpetas

```
src/
├── app/                              # Routes solamente
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css                   # Tailwind v3 entry
│   ├── (auth)/                       # Route groups
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── settings/page.tsx
│   ├── auth/confirm/route.ts         # PKCE callback
│   └── api/                          # API routes
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── forms/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── proxy.ts
│   └── utils.ts
├── server/
│   ├── actions/                      # Server Actions
│   ├── queries/                      # Data fetching
│   └── services/
├── hooks/
├── types/
│   └── database.types.ts             # Supabase generated
├── schemas/                          # Zod schemas
└── config/
```

## Paquetes Deprecados (NUNCA USAR)

### Supabase
- ❌ `@supabase/auth-helpers-nextjs` → ✅ `@supabase/ssr`
- ❌ `@supabase/auth-helpers-react` → ✅ `@supabase/ssr`
- ❌ `createMiddlewareClient` → ✅ `createServerClient` en proxy.ts
- ❌ `createClientComponentClient` → ✅ `createBrowserClient`
- ❌ `createServerComponentClient` → ✅ `createServerClient`

### Otros
- ❌ `moment.js` → ✅ `date-fns` o Temporal API
- ❌ `axios` → ✅ native `fetch`
- ❌ `lodash` → ✅ métodos nativos de JS

## Comandos Comunes

### Generar tipos desde Supabase
```bash
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > src/types/database.types.ts
```

### Build y verificación
```bash
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint .
pnpm format     # prettier --write .
npx react-doctor # Auditoría de calidad React 19
```

### /run-app
Inicia el entorno de desarrollo completo (Next.js dev + Gemini CLI).

### /sync-docs
Sincroniza README.md y TODO.md tras completar un hito.
```bash
# Workflow manual: Actualizar README -> Reflejar en TODO
```

## Next.js 16 Patterns

### Cache Components
```typescript
"use cache"
import { cacheTag, cacheLife } from 'next/cache'

export async function getProducts() {
  cacheTag('products')
  cacheLife('hours')  // seconds, minutes, hours, days, weeks, max
  
  const products = await db.query('SELECT * FROM products')
  return products
}
```

### Revalidation
```typescript
'use server'
import { revalidateTag } from 'next/cache'

export async function updateProduct(id: string) {
  await db.update(id)
  revalidateTag('products')  // Invalida cache
}
```

## RLS Best Practices

1. **SIEMPRE** habilitar RLS en TODAS las tablas
2. **SIEMPRE** especificar rol (`TO authenticated`)
3. **SIEMPRE** crear políticas separadas por operación (SELECT, INSERT, UPDATE, DELETE)
4. **SIEMPRE** crear índice en columnas de políticas
5. Wrap auth functions: `(select auth.uid()) = user_id` (para caching)

## CVEs Críticos (Late 2025)

- React CVE-2025-55182 (CVSS 10.0) → Requiere React 19.2.1+
- Next.js CVEs múltiples → Requiere Next.js 16.1.6+
- SIEMPRE verificar versiones actualizadas

## Coding Standards

- Componentes funcionales con interfaces TypeScript
- Named exports para componentes
- Path aliases `@/` en vez de imports relativos
- Early returns para error handling
- Variables descriptivas (`isLoading`, `hasError`)
- `const objects` o `as const` en vez de enums

## 🎨 UI/UX y Estándares de Diseño

1. **Notificaciones y Feedback**: 
   - SIEMPRE mostrar un mensaje de éxito (Toaster) o de error claro cuando se crea, actualiza o elimina un registro.
   - Usar `toast` (sonner o shadcn) para feedback visual tras Server Actions.
2. **Tablas Responsivas**: 
   - En pantallas pequeñas (móviles), ocultar columnas secundarias. Mostrar solo la información más crítica (ej. Nombre, Total, Estado).
3. **Móvil Primero (Responsive)**:
   - Navegación lateral (`Sidebar`) debe convertirse en un menú Hamburguesa (Sheet) en móviles.
   - Las vistas de grilla (ej. Dashboard) deben apilarse en una sola columna en pantallas pequeñas (`grid-cols-1`).
4. **Gráficos (Recharts)**:
   - Los gráficos deben ser responsivos (`ResponsiveContainer`).
   - SIEMPRE incluir etiquetas visibles (usando `<LabelList>` en Barras o Líneas) estilo PowerBI, para que los datos se puedan leer sin necesidad de hover.
   - Mantener coherencia en los colores (degradado desde el #1 al #5 de manera lógica, respetando backgrounds y foregrounds).
5. **Modo Oscuro (Dark Mode)**:
   - Respetar las variables CSS (`hsl(var(--foreground))`, `hsl(var(--background))`, `hsl(var(--muted))`).
   - Evitar colores fijos (ej. `#000` o `white`) que rompan el contraste en dark mode.

## Protocolo de Sincronización del Agente
1. Cada vez que se actualice el `README.md`, el agente DEBE actualizar el `TODO.md` con el resumen del hito actual.
2. Al iniciar, el agente DEBE verificar `TODO.md` para entender si hubo cambios manuales o de otra ciudad.
3. Se debe priorizar el uso de GitHub Projects para estados macro, pero `TODO.md` es la verdad técnica para el Agente.
4. Antes de dar por finalizada una tarea compleja, ejecutar `npx react-doctor` para asegurar calidad de código React 19.
5. Usar el workflow `/sync-docs` para mantener la coherencia entre documentos.
