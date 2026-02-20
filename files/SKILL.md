---
name: supabase-ssr-auth
description: Patrones completos de autenticación SSR con Supabase para Next.js 16. Úsame cuando trabajes con autenticación, clientes de Supabase, proxy.ts, o validación de sesiones.
version: 1.0.0
tags: [supabase, auth, ssr, nextjs]
---

# Supabase SSR Authentication Skill

## Cuándo Usar Esta Skill

Activa esta skill cuando necesites:
- Crear o modificar clientes de Supabase (browser/server)
- Implementar flujos de autenticación (login, signup, logout)
- Configurar proxy.ts para refresh de sesión
- Validar usuarios en Server Components o Server Actions
- Debuggear problemas de autenticación

## Reglas Críticas

### ✅ SIEMPRE
1. Importar de `@supabase/ssr` (NUNCA `@supabase/auth-helpers-nextjs`)
2. Usar `getAll()/setAll()` para cookies (NUNCA `get/set/remove` individual)
3. Usar `getClaims()` para validación en servidor (NUNCA `getSession()`)
4. Await todas las request APIs: `await cookies()`, `await headers()`
5. Crear dos clientes separados: browser (`client.ts`) y server (`server.ts`)

### ❌ NUNCA
1. Usar `getSession()` en código servidor (no valida JWT)
2. Usar métodos individuales de cookies
3. Usar paquetes deprecados de auth-helpers
4. Confiar en middleware.ts (usa proxy.ts)

## Patrón 1: Browser Client

**Archivo:** `lib/supabase/client.ts`

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

**Uso en Client Components:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const supabase = createClient()
  
  async function handleLogin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error(error)
      return
    }
    
    // Redirigir
    window.location.href = '/dashboard'
  }
  
  return <form>...</form>
}
```

## Patrón 2: Server Client

**Archivo:** `lib/supabase/server.ts`

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
            // setAll puede ser llamado desde Server Component (read-only)
            // o desde Server Action (read-write). Catch silencioso OK.
          }
        },
      },
    }
  )
}
```

**Uso en Server Components:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // ✅ CORRECTO: getClaims() valida JWT localmente
  const { data: { claims }, error } = await supabase.auth.getClaims()
  
  if (error || !claims) {
    redirect('/login')
  }
  
  // claims.sub = user ID
  // claims.email = email del usuario
  // claims.role = rol del usuario
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', claims.sub)
    .single()
  
  return <div>Bienvenido {profile?.name}</div>
}
```

**Uso en Server Actions:**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { claims } } = await supabase.auth.getClaims()
  if (!claims) {
    return { error: 'No autenticado' }
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({
      name: formData.get('name'),
    })
    .eq('id', claims.sub)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}
```

## Patrón 3: Proxy Session Refresh

**Archivo:** `proxy.ts` (root del proyecto)

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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session si es necesario (supabase-js lo hace automáticamente)
  // getClaims() valida JWT - si falla, el usuario no está autenticado
  const { data: { claims } } = await supabase.auth.getClaims()

  // Opcional: redirigir rutas protegidas
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isPublicRoute = request.nextUrl.pathname === '/' || 
                        request.nextUrl.pathname === '/login' ||
                        request.nextUrl.pathname === '/register'

  if (!claims && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Patrón 4: PKCE Auth Flow

**Archivo:** `app/auth/confirm/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error en auth
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

**Login con redirect:**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(email: string, password: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/dashboard')
}
```

**OAuth con PKCE:**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/confirm`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  if (data.url) {
    redirect(data.url)
  }
}
```

## Debugging Auth Issues

### Problema: "Session no persiste después de login"

**Checklist:**
1. ✅ ¿Estás usando `@supabase/ssr` (no auth-helpers)?
2. ✅ ¿Tienes `proxy.ts` configurado correctamente?
3. ✅ ¿El matcher de proxy.ts incluye tus rutas?
4. ✅ ¿Las cookies tienen el dominio correcto en producción?
5. ✅ ¿Tu app está en HTTPS en producción?

### Problema: "User null en Server Component"

**Checklist:**
1. ✅ ¿Estás usando `getClaims()` no `getSession()`?
2. ✅ ¿Estás usando el server client, no browser client?
3. ✅ ¿Estás awaiting cookies()?
4. ✅ ¿El usuario realmente está autenticado?

### Problema: "Auth funciona en desarrollo, no en producción"

**Checklist:**
1. ✅ ¿Variables de entorno correctas en producción?
2. ✅ ¿Site URL configurada en Supabase Dashboard?
3. ✅ ¿Redirect URLs autorizadas en Supabase Dashboard?
4. ✅ ¿HTTPS habilitado?

## Tipos Generados

```bash
# Generar tipos TypeScript desde Supabase
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > src/types/database.types.ts
```

**Uso con tipos:**
```typescript
import type { Database } from '@/types/database.types'

// Alias helpers
type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

type Profile = Tables<'profiles'>
type Post = Tables<'posts'>

// En queries
const supabase = createClient()
const { data } = await supabase
  .from('profiles')
  .select('*')
  .returns<Profile[]>()
```

## Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...  # Solo para uso servidor-side
```

## Recursos Adicionales

- Docs oficiales: https://supabase.com/docs/guides/auth/server-side/nextjs
- Ejemplo completo: https://github.com/supabase/supabase/tree/master/examples/auth/nextjs
