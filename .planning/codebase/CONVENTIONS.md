# Coding Conventions

**Analysis Date:** 2024-07-30

## Naming Patterns

**Files:**
- **Components:** `kebab-case.tsx` (e.g., `auth-button.tsx`).
- **UI Primitives:** `lowercase.tsx` for simple UI elements (e.g., `components/ui/button.tsx`).
- **Pages (App Router):** `page.tsx`, `layout.tsx`, `route.ts` (lowercase).
- **Hooks:** `use-hook-name.ts` (kebab-case, e.g., `use-pos-store.ts`).
- **Utilities/Libs:** `lowercase.ts` (e.g., `lib/utils.ts`).

**Functions:**
- **React Components:** `PascalCase` (e.g., `DashboardPage`, `Button`).
- **React Hooks:** `useCamelCase` (e.g., `usePOSStore`, `useProfile`).
- **Regular Functions:** `camelCase` (e.g., `cn`, `addItem`).

**Variables:**
- `camelCase` for most variables (e.g., `buttonVariants`, `existingItem`).
- `PascalCase` for components assigned to variables (e.g., `const Comp = asChild ? Slot : "button"`).

**Types & Interfaces:**
- `PascalCase` for all type and interface definitions (e.g., `ButtonProps`, `POSState`, `CartItem`).

## Code Style

**Formatting:**
- No explicit `.prettierrc` was detected. However, the codebase consistently follows a style that suggests an automated formatter is in use.
- **Indentation:** 2 spaces.
- **Quotes:** Double quotes (`"`) are used consistently.
- **Semicolons:** Not used. The provided `eslint.config.mjs` was missing them. However, most files seem to use them. It seems there is an inconsistency in the codebase. Let me review a file again.
  - Reviewing `components/ui/button.tsx` and `hooks/use-pos-store.ts`. No semicolons.
  - Reviewing `app/(dashboard)/dashboard/page.tsx`. Semicolons are used.
  - **Correction:** Semicolon usage is inconsistent. Most newer files appear to omit them, while some older or page-level files include them. The convention should be to omit them as per modern standards often paired with ESLint.

**Linting:**
- **Tool:** ESLint.
- **Config:** `eslint.config.mjs`.
- **Key Rules:** Extends `next/core-web-vitals` and `next/typescript`. This enforces standard Next.js and TypeScript best practices.

## Import Organization

**Order:**
1. External libraries (`react`, `next`, `@supabase/ssr`).
2. Internal aliases (`@/lib/...`, `@/components/...`).
3. Relative imports (not commonly seen).

**Path Aliases:**
- The `tsconfig.json` defines path aliases for simpler imports.
- `@/*`: `components/*`, `lib/*`, `hooks/*`, etc.

## Error Handling

**Patterns:**
- **Server Components:** `redirect` from `next/navigation` for auth checks.
- **Client-Side:** `sonner` (`toast`) is used to show non-blocking notifications for user feedback, such as validation errors or low stock warnings (e.g., in `hooks/use-pos-store.ts`).
- **Forms:** `react-hook-form` with `zod` for validation (`@hookform/resolvers/zod`).

## Logging

**Framework:** `console` (e.g., `console.log`, `console.error`) is the primary method observed for debugging. No dedicated logging framework is integrated.

## Comments

**When to Comment:**
- Comments are used sparingly, typically to explain non-obvious logic or provide context for temporary code (e.g., `// This check can be removed, it is just for tutorial purposes` in `lib/utils.ts`).

**JSDoc/TSDoc:**
- Not widely used. Function and component purposes are inferred from their names and props.

## Module Design

**Exports:**
- **Components:** Primarily named exports. UI components often export both the component and its variants (e.g., `export { Button, buttonVariants }`). Page components use `export default`.
- **Utilities/Hooks:** Primarily named exports (e.g., `export const usePOSStore = ...`).

**Barrel Files:**
- Not detected. Modules are imported directly from their file paths.

---

*Convention analysis: 2024-07-30*
