# External Integrations

**Analysis Date:** 2024-07-31

## APIs & External Services

**Backend-as-a-Service (BaaS):**
- **Service:** Supabase
- **What it's used for:** Primary backend for the application, providing database, authentication, and API services.
  - **SDK/Client:** `@supabase/ssr`, `@supabase/supabase-js`, and `@refinedev/supabase`.
  - **Implementation:**
    - A client-side browser client is created in `lib/supabase/client.ts`.
    - A server-side client for use in Server Components and API routes is created in `lib/supabase/server.ts`.
    - A middleware in `lib/supabase/proxy.ts` appears to be used to manage session cookies for server-side rendering.
  - **Auth:** Authentication is handled via environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Data Storage

**Databases:**
- **Type/Provider:** Supabase (PostgreSQL)
  - **Connection:** Managed through the Supabase client via `NEXT_PUBLIC_SUPABASE_URL`.
  - **Client:** The application uses the `@supabase/supabase-js` client directly for some operations and the `@refinedev/supabase` data provider for Refine-powered UI components.
  - **Schema:** SQL schema and migration scripts are located in the `scripts/` directory. A `types/supabase.ts` file contains TypeScript type definitions generated from the database schema.

**File Storage:**
- Assumed to be Supabase Storage, although no direct usage is immediately visible. This is the standard offering with the Supabase stack.

**Caching:**
- None detected at the application level, aside from standard Next.js caching mechanisms.

## Authentication & Identity

**Auth Provider:**
- **Service:** Supabase Auth
  - **Implementation:** The application uses Supabase's built-in authentication.
    - The `@supabase/ssr` package is used to handle user sessions and authentication in a Next.js server-side context (Server Components, Route Handlers, Middleware).
    - UI components for login, registration, password reset, etc., are located in `components/` and `app/(auth)/`.
    - A custom `auth-button.tsx` component handles displaying login/logout state.

## Monitoring & Observability

**Error Tracking:**
- Not detected. No services like Sentry, LogRocket, or Datadog are configured.

**Logs:**
- Standard `console.log` / `console.error`. No structured logging or log shipping service is apparent.

## CI/CD & Deployment

**Hosting:**
- Not specified, but the structure is standard for Next.js hosting platforms like Vercel, Netlify, or AWS Amplify. The presence of a `deploy-button.tsx` pointing to Vercel suggests Vercel is the intended deployment target.

**CI Pipeline:**
- Not detected. There are no configuration files for GitHub Actions, CircleCI, or other CI providers in the repository root.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`: The URL for the Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public, anonymous key for the Supabase project.

**Secrets location:**
- A `.env.example` file is present, indicating that secrets and environment variables are stored in a `.env` file at the root of the project during local development.

## Webhooks & Callbacks

**Incoming:**
- `app/(auth)/confirm/route.ts`: An email confirmation callback route for Supabase Auth.

**Outgoing:**
- None detected. The application does not appear to be making webhook calls to external services.

---

*Integration audit: 2024-07-31*
