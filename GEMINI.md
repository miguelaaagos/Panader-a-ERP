# Stack Contract — Panadería ERP (Marzo 2026)

## Stack
- **Next.js** 16 + App Router | **React** 19 | **TypeScript** 5.9 strict
- **Supabase** @supabase/ssr v0.8 | **Zod** v4 | **Tailwind** v3
- **Package Manager**: pnpm (ÚNICO — nunca `npm` ni `npx` directo)

## Reglas Absolutas (NUNCA VIOLAR)

### Arquitectura
- `proxy.ts` en raíz con `export async function proxy` (NO `middleware.ts`)
- Server Components por defecto; `"use client"` solo para event handlers / browser hooks

### Supabase
- `@supabase/ssr` siempre (NUNCA `@supabase/auth-helpers-nextjs`)
- `getClaims()` en servidor (NUNCA `getSession()` — no valida JWT)
- Cookies: solo patrón `getAll()/setAll()` (nunca métodos individuales)
- Keys: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`

### Next.js 16
- Request APIs son async: `await params`, `await cookies()`, `await headers()`
- Cache: `"use cache"` + `cacheTag()` + `cacheLife()` (NUNCA `unstable_cache`)
- `cacheComponents: true` en next.config.ts

### TypeScript
- `any` prohibido — usar `unknown` + type guards
- Return types explícitos en todas las funciones exportadas
- Interfaces para props de componentes

## Comandos

> **REGLA**: Ejecutar comandos de forma **INDIVIDUAL**, uno por uno. Nunca encadenar con `&&`.

```bash
pnpm dev              # servidor de desarrollo
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest
pnpm gen:types        # regenerar tipos Supabase (atómico, no corrompe)
pnpm lint
pnpm build
pnpm exec playwright test
```

> **CRÍTICO**: `pnpm gen:types` usa `--output` (no `>`). Si se usara `>` y el CLI falla,
> el mensaje de error sobreescribe el `.ts` y genera 200+ errores de TypeScript.
> Si los tipos se corrompieron: `git checkout <hash> -- types/database.types.ts`
> Ver skill `fix-supabase-types` para diagnóstico completo.

## Supabase MCP

Si el MCP de Supabase está configurado (`@supabase/mcp-server-supabase`),
usarlo para inspeccionar schema sin CLI. Ver skill `fix-supabase-types` para
setup y queries de diagnóstico.

## Deprecados (NUNCA USAR)

| ❌ | ✅ |
|---|---|
| `middleware.ts` | `proxy.ts` |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` |
| `getSession()` en servidor | `getClaims()` |
| `unstable_cache` | `"use cache"` |
| `npm` / `npx` directo | `pnpm` |
| `enum` | `const obj as const` |
| `moment.js` | `date-fns` |
| `axios` | `fetch` nativo |

## Estándares del Negocio

- **Tenant isolation**: todas las tablas tienen `tenant_id`; RLS habilitado con políticas por operación (SELECT/INSERT/UPDATE/DELETE)
- **Correlativo**: ventas/facturas usan correlativo secuencial por tenant, generado en DB con función `SECURITY DEFINER`
- **Toaster**: toda mutación de datos debe tener feedback visual (`sonner`)
- **Móvil primero**: sidebar → Sheet hamburguesa; grillas `grid-cols-1` → `md:grid-cols-2/3`
- **Gráficos**: `<ResponsiveContainer>` + `<LabelList>` siempre (estilo PowerBI)
- **Dark mode**: solo variables CSS (`bg-background`, `text-foreground`, `bg-muted`)

## Arquitectura de Carpetas

```
app/             → routes únicamente
actions/         → Server Actions del negocio
components/ui/   → shadcn/ui primitives
lib/supabase/    → client.ts | server.ts
server/actions/  → auth, asistencia, horarios
types/           → database.types.ts (auto-generado)
schemas/         → Zod validation schemas
supabase/migrations/ → SQL migrations
```

## Skills disponibles (ver .agent/skills/)
- `supabase-ssr` — clientes, auth, proxy.ts, PKCE flow
- `nextjs-16` — cache, async APIs, Server Components, streaming
- `typescript-strict` — tipos, helpers Supabase, Zod, generics
- `frontend-pos-design` — UI/UX, dark mode, gráficos, mobile
- `nextjs-supabase-scaffold` — scaffold proyectos nuevos desde cero
