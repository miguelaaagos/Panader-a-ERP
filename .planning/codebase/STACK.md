# Technology Stack

**Analysis Date:** 2024-07-31

## Languages

**Primary:**
- TypeScript 5.x - Used for all application code, including frontend components, backend logic (Next.js API routes), and utility functions. Enforced with `strict: true`.

**Secondary:**
- JavaScript - Used for configuration files like `next.config.ts` and `postcss.config.mjs`.
- SQL - Used for database migrations and schemas in the `scripts/` directory.

## Runtime

**Environment:**
- Node.js 20.x

**Package Manager:**
- npm - Indicated by the presence of `package-lock.json`.

## Frameworks

**Core:**
- Next.js (latest) - Full-stack framework for React. Used for routing, server-side rendering (SSR), API routes, and static site generation.

**UI:**
- React 19 - For building user interfaces.
- Shadcn/UI - A collection of re-usable UI components, built on Radix UI and Tailwind CSS. Components are not installed as a package but are integrated directly into the codebase under `components/ui/`.
- Tailwind CSS 3.4.1 - A utility-first CSS framework for styling.

**Data Fetching/State:**
- Refine.js (`@refinedev/core`) - A meta-framework used for rapidly building data-intensive applications. It uses a Supabase data provider (`@refinedev/supabase`) to interface with the backend.

**Testing:**
- Not detected. No testing frameworks like Jest or Vitest are present in the dependencies.

**Build/Dev:**
- Next.js CLI (`next build`, `next dev`) - For building and running the development server.
- TypeScript CLI (`tsc`) - For type checking.
- ESLint 9 - For code linting and style enforcement.

## Key Dependencies

**Critical:**
- `@supabase/ssr`, `@supabase/supabase-js`: JavaScript client libraries for interacting with the Supabase backend (database, auth, etc.).
- `@refinedev/core`, `@refinedev/supabase`: Core libraries for the Refine framework and its integration with Supabase.
- `react`, `react-dom`: Core libraries for the React framework.
- `next`: Core library for the Next.js framework.

**State Management:**
- `zustand`: A small, fast, and scalable state-management solution. Used for client-side state, for example in `hooks/use-pos-store.ts`.

**Forms:**
- `react-hook-form`: For building and managing forms.
- `zod`: For schema declaration and validation, often used with `react-hook-form`.

**UI & Styling:**
- `@radix-ui/*`: A set of low-level, unstyled, accessible UI primitives that power the Shadcn/UI components.
- `lucide-react`: For icons.
- `recharts`: For building charts and graphs.
- `tailwind-merge`, `clsx`: Utilities for conditionally combining Tailwind CSS classes.

## Configuration

**Environment:**
- Environment variables are managed via a `.env` file (inferred from `.env.example`).
- Key required variables include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Build:**
- `next.config.ts`: Main configuration for the Next.js application.
- `tsconfig.json`: TypeScript compiler options, including path aliases (`@/*`).
- `tailwind.config.ts`: Configuration for Tailwind CSS.
- `postcss.config.mjs`: Configuration for PostCSS.

## Platform Requirements

**Development:**
- Node.js and npm are required for dependency management and running the application.

**Production:**
- The application is designed to be deployed on a platform that supports Node.js and Next.js hosting (e.g., Vercel, AWS Amplify, Netlify).

---

*Stack analysis: 2024-07-31*
