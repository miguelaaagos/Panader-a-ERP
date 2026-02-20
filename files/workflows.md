# Common Development Workflows

Estos workflows son prompts guardados que puedes invocar con `/workflow-name` en Antigravity.

---

## /setup-project

Inicia un nuevo proyecto Next.js 16 + Supabase desde cero con todas las configuraciones.

```
Voy a crear un nuevo proyecto Next.js 16 + Supabase. Sigue estos pasos:

1. Ejecuta:
```bash
pnpm dlx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir
cd my-app
pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers
pnpm add -D @types/node
```

2. Crea la estructura de carpetas:
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- src/types/database.types.ts
- src/schemas/
- src/server/actions/
- src/server/queries/
- proxy.ts (en root)

3. Configura next.config.ts con:
```typescript
const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    typedRoutes: true,
  },
}
```

4. Crea .env.local con:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

5. Genera el browser client, server client, y proxy.ts usando los templates de la skill supabase-ssr

¿Listo para empezar?
```

---

## /create-feature

Crea una feature completa con CRUD usando Server Components y Server Actions.

```
Voy a crear una feature CRUD completa. Necesito que me digas:
1. Nombre de la entidad (ej: "producto", "usuario", "post")
2. Campos principales (ej: "nombre, precio, descripción")

Luego crearé:
- Schema de Supabase (SQL)
- Zod schema para validación
- TypeScript types
- Server Actions (create, update, delete)
- Server Component para listar
- Client Component para formulario
- Page que lo integra todo

Usaré:
- "use cache" para el listado
- revalidateTag después de mutations
- getClaims() para auth
- Suspense para loading states
```

---

## /add-auth

Agrega autenticación completa a un proyecto existente.

```
Voy a agregar autenticación Supabase completa al proyecto. Esto incluye:

1. Crear/verificar clientes de Supabase (browser, server, proxy)
2. Crear auth/confirm/route.ts para PKCE callback
3. Crear páginas:
   - app/(auth)/login/page.tsx
   - app/(auth)/register/page.tsx
4. Crear Server Actions:
   - server/actions/auth-actions.ts (login, register, logout, signInWithOAuth)
5. Actualizar proxy.ts para proteger rutas
6. Crear middleware de auth para Server Components

¿Qué provider OAuth necesitas? (google, github, discord, ninguno)
```

---

## /debug-auth

Debuggea problemas de autenticación.

```
Voy a debuggear tu problema de auth. Ejecuta estos checks:

1. Verifica que estás usando @supabase/ssr (no auth-helpers):
```bash
grep -r "@supabase/auth-helpers" .
# No debería retornar nada
```

2. Verifica que proxy.ts existe y exporta 'proxy':
```bash
cat proxy.ts | grep "export async function proxy"
```

3. Verifica variables de entorno:
```bash
cat .env.local | grep SUPABASE
```

4. Verifica que usas getClaims() no getSession():
```bash
grep -r "getSession()" app/
# Solo debería aparecer en client components
```

5. Verifica que awaits cookies():
```bash
grep -r "await cookies()" .
```

Comparte los resultados y te diré qué está mal.
```

---

## /generate-types

Regenera tipos de Supabase desde el schema remoto.

```
Voy a regenerar los tipos de Supabase:

1. ¿Cuál es tu PROJECT_ID de Supabase? (ej: abcdefghijklmnop)

2. Ejecutaré:
```bash
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > src/types/database.types.ts
```

3. Verificaré que los helpers de tipos existan en src/types/index.ts

4. Verificaré que tus clientes usen los tipos:
```typescript
createBrowserClient<Database>(...)
createServerClient<Database>(...)
```

¿Listo?
```

---

## /create-rls

Crea políticas de Row Level Security para una tabla.

```
Voy a crear políticas RLS para tu tabla. Necesito:

1. Nombre de la tabla
2. Columna que identifica al dueño (ej: user_id)
3. ¿Necesitas políticas para qué operaciones? (SELECT, INSERT, UPDATE, DELETE)

Crearé:
- ALTER TABLE para habilitar RLS
- Políticas separadas por operación
- Índice en la columna de ownership
- Políticas optimizadas con (select auth.uid())

Ejemplo:
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX idx_posts_user_id ON posts(user_id);
```

Dame los detalles.
```

---

## /optimize-performance

Analiza y optimiza performance de una ruta específica.

```
Voy a optimizar la performance. ¿Qué ruta está lenta?

Verificaré:

1. **Caching**: ¿Usa "use cache"?
2. **Queries N+1**: ¿Hay fetch en loops?
3. **Suspense**: ¿Usa Suspense boundaries?
4. **Client Components**: ¿Hay "use client" innecesarios?
5. **Images**: ¿Usa next/image?
6. **Dynamic imports**: ¿Componentes pesados lazy-loaded?
7. **RLS**: ¿Políticas tienen índices?
8. **Database**: ¿Queries optimizados con includes?

Luego te daré recomendaciones específicas.
```

---

## /migrate-to-16

Migra un proyecto de Next.js 14/15 a Next.js 16.

```
Voy a migrar tu proyecto a Next.js 16. Cambios necesarios:

1. **Actualizar dependencias**:
```bash
pnpm add next@latest react@latest react-dom@latest
```

2. **middleware.ts → proxy.ts**:
- Renombrar archivo
- Cambiar export default a export async function proxy
- Mover a root del proyecto

3. **Hacer async request APIs**:
```bash
# Encontrar usos sincrónicos
grep -r "const.*= params" app/
grep -r "const.*= cookies()" app/
grep -r "const.*= headers()" app/
```

4. **unstable_cache → "use cache"**:
```bash
grep -r "unstable_cache" .
```

5. **next.config**:
- experimental.ppr → cacheComponents: true
- Cambiar a next.config.ts

¿Empezamos?
```

---

## /review-code

Revisa código antes de hacer commit.

```
Voy a revisar tu código contra el checklist del stack:

✅ Verificando:
1. No hay imports de @supabase/auth-helpers-nextjs
2. No hay uso de getSession() en servidor
3. Todos params/cookies/headers tienen await
4. No hay middleware.ts (debe ser proxy.ts)
5. TypeScript strict (no 'any')
6. Server Actions tienen 'use server'
7. Client Components necesarios tienen 'use client'
8. Componentes exportados tienen tipos explícitos
9. Validación con Zod donde corresponde
10. Cache tags en queries frecuentes

Ejecuta:
```bash
pnpm typecheck && pnpm lint && pnpm format:check
```

Y comparte el output.
```

---

## /create-component

Crea un componente siguiendo best practices.

```
Voy a crear un componente. Necesito:

1. Nombre del componente
2. ¿Es Client o Server Component?
3. Props necesarias
4. ¿Necesita estado local?
5. ¿Necesita fetch data?

Crearé:
- Interface de props con tipos explícitos
- Componente funcional
- Validación de props (si aplica)
- Loading/error states (si fetch data)
- Styles con Tailwind
- Export nombrado

¿Qué componente necesitas?
```

---

## /setup-testing

Configura testing para el proyecto.

```
Voy a configurar Vitest para testing. Pasos:

1. Instalar dependencias:
```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vite-tsconfig-paths
```

2. Crear vitest.config.ts

3. Crear setup file en tests/setup.ts

4. Agregar scripts:
```json
"test": "vitest",
"test:watch": "vitest --watch",
"test:coverage": "vitest --coverage"
```

5. Crear ejemplo de test para Server Component y Client Component

¿Listo para empezar?
```

---

## Uso de Workflows

En Antigravity, escribe `/` en el chat y selecciona el workflow que necesitas, o escribe `/nombre-workflow` directamente.

Estos workflows son plantillas - Antigravity las personalizará según tu proyecto específico.
