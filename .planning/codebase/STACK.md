# Technology Stack

**Analysis Date:** 2025-02-27

## Languages

**Primary:**
- TypeScript 5.x - Throughout the entire codebase (`tsconfig.json`, `package.json`).

## Runtime

**Environment:**
- Node.js (implicitly via Next.js 15)
- Next.js 15.3.1 - Web framework

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15 - Main application framework using App Router (`app/`).
- React 19 - UI library.
- Refine 5.x - Internal CRUD and CRM framework (`@refinedev/core`, `@refinedev/nextjs-router`, `@refinedev/supabase`).

**Testing:**
- Vitest 4.0.18 - Test runner (`vitest.config.ts`).
- React Testing Library 16.3.2 - UI testing.
- JSDOM - Browser environment simulation for tests.

**Build/Dev:**
- Tailwind CSS 3.4.1 - Styling framework.
- PostCSS - CSS transformation.
- Autoprefixer - CSS vendor prefixing.
- ESLint - Linting (`eslint.config.mjs`).

## Key Dependencies

**Critical:**
- Supabase SSR - Authentication and database connection handling (`@supabase/ssr`, `@supabase/supabase-js`).
- Radix UI - Primitive UI components (`@radix-ui/react-*`).
- Zustand 5.0.11 - State management (`hooks/use-pos-store.ts`).
- React Hook Form 7.x - Form management (`package.json`).
- Zod 4.x - Schema validation (`actions/sales.ts`).

**Infrastructure:**
- Lucide React - Iconography.
- Recharts 3.7.0 - Data visualization and charts (`components/dashboard/`).
- Sonner - Toast notifications.
- Date-fns - Date manipulation.

## Configuration

**Environment:**
- Managed via `.env` (seen in `.env.example`).
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Build:**
- `next.config.ts` - Configures Next.js behavior (note: currently set to ignore TS/ESLint errors during build).
- `tsconfig.json` - TypeScript configuration with path alias `@/*` pointing to root.
- `tailwind.config.ts` - Tailwind CSS configuration.

## Platform Requirements

**Development:**
- Node.js 18+ (typical for Next.js 15).
- Access to a Supabase project.

**Production:**
- Deployment target likely Vercel or similar Next.js-compatible hosting.
- Requires Supabase instance for DB and Auth.

---

*Stack analysis: 2025-02-27*
