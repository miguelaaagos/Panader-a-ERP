---
name: nextjs-supabase-scaffold
description: Scaffolds complete Next.js 16 + Supabase projects from scratch with TypeScript, authentication, database setup, and proper architecture. Use when starting new projects, initializing full-stack applications, or bootstrapping Next.js + Supabase codebases. Triggers on 'new project', 'scaffold', 'bootstrap', 'initialize app'.
version: 1.0.0
tags: [nextjs, supabase, scaffold, typescript, full-stack]
related_skills: [nextjs-16-setup, supabase-auth-integration, typescript-strict-config, project-structure-generator]
---

# Next.js 16 + Supabase Project Scaffold

Complete project scaffolding for production-ready Next.js 16 + Supabase applications with TypeScript strict mode, authentication, and best practices baked in.

## Goal

Generate a complete, production-ready Next.js 16 project with Supabase integration that follows all 2026 best practices and avoids every deprecated pattern.

## When to Use

Trigger this skill when the user asks to:
- "Create a new Next.js project with Supabase"
- "Bootstrap a full-stack application"
- "Initialize a Next.js + Supabase app"
- "Scaffold a project with auth and database"
- "Start a new SaaS project"

## Critical Constraints (NEVER VIOLATE)

### ❌ NEVER Use These (Deprecated/Removed in 2026)
1. **middleware.ts** → Use `proxy.ts` (Next.js 16 breaking change)
2. **@supabase/auth-helpers-nextjs** → Use `@supabase/ssr`
3. **getSession() on server** → Use `getClaims()` or `getUser()`
4. **Individual cookie methods** → Use `getAll()/setAll()`
5. **unstable_cache** → Use `"use cache"` directive
6. **experimental.ppr** → Use `cacheComponents: true`
7. **Synchronous params/cookies** → ALWAYS await them
8. **TypeScript any** → Use proper types or unknown with guards
9. **next lint** → Use eslint directly with flat config
10. **.eslintrc** → Use `eslint.config.mjs` (flat config)

### ✅ ALWAYS Use These (Current 2026 Standards)
1. **proxy.ts** with `export async function proxy`
2. **@supabase/ssr** v0.8+ for all Supabase clients
3. **getClaims()** for JWT validation on server
4. **await params**, **await cookies()**, **await headers()**
5. **"use cache"** with cacheTag() and cacheLife()
6. **cacheComponents: true** in next.config.ts
7. **TypeScript strict mode** with noUncheckedIndexedAccess
8. **Server Components by default**, "use client" only when needed
9. **PKCE flow** for Supabase authentication
10. **Publishable/Secret keys** (new Supabase format)

## Instructions

### Phase 1: Gather Requirements

Ask the user for these details (offer smart defaults):

1. **Project name**: What to call the project? (default: suggested from context)
2. **Authentication**: Need user auth? (default: yes)
   - Email/password
   - OAuth providers (Google, GitHub, etc.)
   - Magic links
3. **Database**: What tables/entities do they need initially? (default: users/profiles)
4. **Features**: Any specific features to scaffold?
   - Dashboard
   - Admin panel
   - API routes
   - File uploads
5. **Deployment target**: Vercel (default), Railway, self-hosted?

### Phase 2: Initialize Project Structure

Execute these commands in sequence:

```bash
# 1. Create Next.js project
npx create-next-app@latest [project-name] \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd [project-name]

# 2. Install core dependencies
npm install @supabase/supabase-js@latest @supabase/ssr@^0.8.0

# 3. Install validation and forms
npm install zod react-hook-form @hookform/resolvers

# 4. Install dev dependencies
npm install -D @types/node@latest
```

### Phase 3: Create Project Structure

Generate this exact folder structure:

```
[project-name]/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── globals.css             # Tailwind v3 entry
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── dashboard/              # Protected routes
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── auth/
│   │       └── confirm/
│   │           └── route.ts        # PKCE callback
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── forms/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── proxy.ts            # Session refresh
│   │   └── utils.ts
│   ├── server/
│   │   ├── actions/                # Server Actions
│   │   ├── queries/                # Data fetching
│   │   └── services/               # Business logic
│   ├── hooks/                      # Custom React hooks
│   ├── types/
│   │   ├── database.types.ts       # Supabase generated
│   │   └── index.ts                # Type helpers
│   ├── schemas/                    # Zod validation schemas
│   └── config/                     # App configuration
├── proxy.ts                        # Session refresh (root level!)
├── next.config.ts                  # TypeScript config
├── tsconfig.json                   # Strict mode
├── eslint.config.mjs               # Flat config format
├── .env.local                      # Environment variables
└── README.md                       # Setup instructions
```

### Phase 4: Generate Core Files

Use the templates in `references/` directory to create these files:

1. **next.config.ts**: Copy from `references/next-config.template.ts`
2. **tsconfig.json**: Copy from `references/tsconfig.template.json`
3. **eslint.config.mjs**: Copy from `references/eslint-config.template.mjs`
4. **proxy.ts**: Copy from `references/proxy.template.ts`
5. **lib/supabase/client.ts**: Copy from `references/supabase-client.template.ts`
6. **lib/supabase/server.ts**: Copy from `references/supabase-server.template.ts`
7. **lib/supabase/proxy.ts**: Copy from `references/supabase-proxy.template.ts`
8. **.env.local**: Copy from `references/env.template`

Customize each file with:
- Project name
- User preferences from Phase 1
- Correct import paths
- TypeScript types

### Phase 5: Setup Supabase (if auth enabled)

Guide the user through Supabase setup:

1. **Create Supabase project**:
   ```
   Go to https://supabase.com/dashboard
   Click "New Project"
   Save the URL and Publishable Key
   ```

2. **Update .env.local** with actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

3. **Configure Auth in Supabase Dashboard**:
   - Enable Email provider
   - Set Site URL: http://localhost:3000 (dev) or production URL
   - Add redirect URLs: http://localhost:3000/auth/confirm

4. **Create initial schema** (if database tables requested):
   Generate SQL from user requirements in Phase 1
   Include RLS policies with proper indexes

5. **Generate TypeScript types**:
   ```bash
   pnpm add -D supabase
   npx supabase login
   npx supabase gen types typescript --project-id "YOUR_ID" > src/types/database.types.ts
   ```

### Phase 6: Create Authentication Pages (if enabled)

Generate these files using templates:

1. **app/(auth)/login/page.tsx**: Login form with Server Action
2. **app/(auth)/register/page.tsx**: Registration form
3. **app/dashboard/page.tsx**: Protected dashboard
4. **server/actions/auth-actions.ts**: login, signup, logout functions

### Phase 7: Create Initial Database Queries (if tables specified)

For each table the user specified, generate:

1. **server/queries/[table]-queries.ts**: CRUD functions
2. **types/index.ts**: Type helpers for the table
3. **schemas/[table]-schema.ts**: Zod validation

### Phase 8: Setup Scripts and Documentation

1. **Update package.json scripts**:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit",
       "format": "prettier --write .",
       "db:types": "supabase gen types typescript --project-id \"$PROJECT_ID\" > src/types/database.types.ts"
     }
   }
   ```

2. **Generate README.md** with:
   - Project description
   - Setup instructions
   - Environment variables needed
   - Development commands
   - Deployment guide

### Phase 9: Verify Everything Works

Run these checks:

```bash
# 1. TypeScript check
pnpm typecheck

# 2. Lint check
pnpm lint

# 3. Build check
pnpm build

# 4. Start dev server
pnpm dev
```

Report any errors and fix them.

### Phase 10: Final Checklist

Verify these items:

✅ Project builds without errors
✅ TypeScript has no warnings
✅ ESLint passes
✅ All config files use 2026 formats
✅ No deprecated packages in package.json
✅ proxy.ts exists (not middleware.ts)
✅ Supabase clients use @supabase/ssr
✅ Auth uses getClaims() not getSession()
✅ All async APIs are awaited
✅ .env.local has all required variables
✅ README has complete setup instructions

## Expected Outputs

After running this skill, the user should have:

1. **Complete project structure** with all folders
2. **All configuration files** properly set up
3. **Supabase integration** fully configured
4. **Authentication system** ready to use (if enabled)
5. **Database types** generated and helpers created
6. **Development environment** ready to run
7. **Documentation** for next steps

## Error Handling

If any step fails:

1. **Explain the error** in plain language
2. **Show the command** that failed
3. **Suggest fixes** based on common issues
4. **Ask if user wants to retry** or skip that step

Common issues:
- Node version too old (need 20.9+)
- pnpm not installed (suggest install)
- Supabase CLI not authenticated (run npx supabase login)
- Wrong project ID (double-check Supabase dashboard)
- Network issues (check internet connection)

## Examples

### Example 1: Minimal SaaS Starter

User: "Create a new SaaS project with auth"

Generate:
- Next.js 16 project
- Email/password auth
- users + profiles tables
- Dashboard with user info
- Login/register pages

### Example 2: Multi-tenant App

User: "Bootstrap an app with organizations and role-based access"

Generate:
- Next.js 16 project
- Auth with OAuth
- organizations, users, memberships tables
- RLS policies for tenant isolation
- Admin panel scaffold

### Example 3: API-First Project

User: "Initialize a Next.js API with Supabase backend"

Generate:
- Next.js 16 project
- No auth pages (just API)
- API routes in app/api/
- Supabase for database
- API key authentication

## Post-Scaffold Recommendations

After scaffolding is complete, suggest:

1. **Initialize git**: `git init && git add . && git commit -m "Initial commit"`
2. **Install shadcn/ui**: For UI components if needed
3. **Setup Prettier**: For code formatting
4. **Configure Vercel**: For deployment
5. **Add features**: Using related skills for specific functionality

## Related Skills

- `nextjs-16-setup`: Deep dive into Next.js 16 patterns
- `supabase-auth-integration`: Advanced auth scenarios
- `typescript-strict-config`: TypeScript configuration details
- `project-structure-generator`: Custom folder structures

## Version Notes

This skill is current as of February 2026 and uses:
- Next.js 16.1.6+
- React 19.2.1+
- @supabase/ssr 0.8.0+
- TypeScript 5.7+

If you're using this skill in the future, check for:
- Next.js 17 breaking changes
- Supabase SSR updates
- New TypeScript versions
- Framework deprecations
