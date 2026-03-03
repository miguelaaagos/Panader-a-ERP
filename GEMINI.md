# Stack Contract — Panadería ERP (2026)

Stack: Next.js 16 + Supabase SSR + React 19 + TypeScript estricto + Tailwind CSS v3
Deploy: Vercel | Package manager: **pnpm**

## Reglas Absolutas (nunca violar)

1. **Proxy**: `proxy.ts` en raíz con `export async function proxy` — eliminar `middleware.ts`
2. **Supabase**: `@supabase/ssr` + `getAll()/setAll()` — nunca `auth-helpers-nextjs`
3. **Auth servidor**: `getClaims()` — nunca `getSession()`
4. **Request APIs**: `await params`, `await cookies()`, `await headers()` (todos async)
5. **Cache**: `"use cache"` + `cacheTag()` — nunca `unstable_cache`
6. **TypeScript**: no `any` — usar `unknown` + type guards
7. **Components**: Server por defecto, `"use client"` solo para estado/eventos/browser APIs
8. **Multi-tenant**: toda query filtra por `tenant_id`
9. **Keys Supabase**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`

## Skills (leer para detalles de implementación)

- `.agent/skills/supabase-ssr/` — clientes, auth, proxy, PKCE
- `.agent/skills/nextjs-16/` — App Router, "use cache", Suspense, Server Actions
- `.agent/skills/typescript-strict/` — tipos, interfaces, Zod, generics
- `.agent/skills/frontend-pos-design/` — UI responsiva, dark mode, Recharts
- `.agent/skills/domain-erp/` — entidades, flujos de negocio, POS, RLS
- `.agent/skills/performance/` — cold starts Vercel, caching, ISR, TanStack Query

## Paquetes prohibidos

- ❌ `@supabase/auth-helpers-nextjs` → ✅ `@supabase/ssr`
- ❌ `moment.js` → ✅ `date-fns`
- ❌ `axios` → ✅ `fetch` nativo
- ❌ `lodash` → ✅ métodos nativos JS

## Testing — política

**Playwright solo para flujos críticos** (auth, checkout POS, mutaciones de stock/dinero).
Para cambios de UI y features en desarrollo: testing manual.
Ver `playwright.config.ts` — local solo corre Chromium.

## Comandos

```bash
pnpm dev
pnpm typecheck && pnpm lint
pnpm exec playwright test --project=chromium
npx supabase gen types typescript --project-id "ID" > types/database.types.ts
```
