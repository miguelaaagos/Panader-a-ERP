# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**
- TypeScript 5.9.3 — modo estricto en todo el codebase

## Runtime

**Environment:**
- Node.js 18+
- Next.js 16.1.6 — App Router (NO Pages Router)

**Package Manager:**
- **pnpm** (lockfile: `pnpm-lock.yaml`)

## Frameworks

**Core:**
- Next.js 16.1.6 — framework principal, App Router
- React 19.2.4 — UI library con Server Components
- TanStack Query v5 — data fetching y cache en cliente
- Zustand 5.x — estado global del POS (carrito)

**UI:**
- ShadCN UI — componentes sobre Radix UI
- Tailwind CSS v3.4 — utility-first (`tailwind.config.ts`)
- Recharts 3.x — gráficos del dashboard
- Sonner — toast notifications

**Testing:**
- **Vitest** — unit tests para lógica de negocio (`vitest.config.ts`, env jsdom)
  - `pnpm test` → `vitest run`
  - Tests en `tests/*.test.ts` y `lib/**/__tests__/*.test.ts`
  - Excluye `.spec.ts` (son Playwright) y tests marcados como ignorados
- **Playwright** — E2E para flujos críticos únicamente
  - Local: solo Chromium (`playwright.config.ts`)
  - CI: Chromium + Firefox + Mobile Chrome

**Build/Dev:**
- Turbopack — bundler por defecto en dev
- ESLint — linting (`eslint.config.mjs`, flat config format)

## Key Dependencies

**Critical:**
- `@supabase/ssr` — auth SSR y clientes de Supabase
- `@supabase/supabase-js` — cliente JS
- `zod` v4.x — validación de formularios y Server Actions
- `react-hook-form` v7.x — manejo de formularios

**Infrastructure:**
- `lucide-react` — iconografía
- `date-fns` — manipulación de fechas
- `@radix-ui/react-*` — primitivos UI (via ShadCN)

## Configuration

**Environment:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # formato nuevo (2025)
SUPABASE_SECRET_KEY=                    # solo server-side
```

**Build:**
- `next.config.ts` — `cacheComponents: true` para habilitar `"use cache"`
- `tsconfig.json` — strict mode, path alias `@/*` → raíz
- `proxy.ts` — session refresh de Supabase (reemplaza `middleware.ts`)

## Platform

**Production:**
- Vercel (panader-a-erp-b37p.vercel.app) — plan Hobby
- Supabase — PostgreSQL + Auth + RLS

**Nota cold starts:** El plan Hobby de Vercel hiberna funciones tras ~5 min de inactividad.
Ver `.agent/skills/performance/SKILL.md` para estrategias de mitigación.

---

*Stack actualizado: 2026-03-03*
