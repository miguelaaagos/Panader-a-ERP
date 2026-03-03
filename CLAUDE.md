# Panadería ERP — Claude Code

Stack: Next.js 16 + Supabase SSR + TypeScript estricto + TanStack Query v5 + Zustand + ShadCN UI
Deploy: Vercel (panader-a-erp-b37p.vercel.app) | DB: Supabase PostgreSQL + RLS
Package manager: **pnpm**

## Reglas Absolutas

1. `proxy.ts` en raíz — NUNCA `middleware.ts`
2. `@supabase/ssr` — NUNCA `@supabase/auth-helpers-nextjs`
3. `getClaims()` en servidor — NUNCA `getSession()`
4. `await params` / `await cookies()` / `await headers()` — todos async en Next.js 16
5. `"use cache"` + `cacheTag()` — NUNCA `unstable_cache`
6. No `any` en TypeScript — usar `unknown` + type guards
7. Server Components por defecto — `"use client"` solo si hay estado/eventos

## Skills disponibles

| Skill | Cuándo usarla |
|---|---|
| `supabase-ssr` | Clientes, auth, proxy, getClaims |
| `nextjs-16` | App Router, cache, Server Actions, Suspense |
| `typescript-strict` | Tipos, interfaces, Zod, generics |
| `frontend-pos-design` | UI responsiva, dark mode, Recharts, toasts |
| `domain-erp` | Entidades del negocio, flujos de caja/producción/inventario |
| `performance` | Cold starts Vercel, "use cache", ISR, TanStack Query |

## Testing — filosofía

**Vitest** para lógica de negocio. **Playwright** solo para flujos críticos. Manual para todo lo demás.

| Tipo | Cuándo | Comando |
|---|---|---|
| Vitest unit | Lógica matemática, store, conversiones | `pnpm test` |
| Playwright E2E | Auth, checkout POS, flujos con dinero/stock | `pnpm exec playwright test --project=chromium` |
| Manual | UI, estilos, navegación, features en desarrollo | — |

❌ No Playwright para:
- Cambios visuales, estilos, colores
- Navegación sin mutations
- Features nuevas durante desarrollo activo

## Arquitectura de carpetas (real)

```
app/           → Routes solamente
actions/       → Server Actions por dominio (sales.ts, inventory.ts, etc.)
components/    → UI components (ui/, dashboard/, pos/, etc.)
hooks/         → use-pos-store.ts (Zustand), otros hooks
lib/           → supabase/client.ts, supabase/server.ts, utils.ts
schemas/       → Zod schemas
server/        → queries y services
types/         → database.types.ts (generado de Supabase)
playwright/    → .auth/user.json (estado de sesión persistida)
proxy.ts       → Session refresh (raíz del proyecto)
```

## Comandos útiles

```bash
pnpm dev              # Dev server (Turbopack)
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint .
pnpm test                                       # Vitest unit tests
pnpm exec playwright test --project=chromium   # E2E críticos
pnpm exec playwright test --project=chromium --headed  # con UI
```

## Vercel cold starts

El plan gratuito/hobby de Vercel hiberna las funciones serverless tras ~5 min de inactividad.
Ver skill `performance` para estrategias de mitigación.
