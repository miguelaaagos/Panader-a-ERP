---
name: fix-supabase-types
description: Diagnóstico y reparación de errores masivos de TypeScript causados por tipos de Supabase corruptos o desactualizados. Úsame cuando `pnpm typecheck` muestre 50+ errores en múltiples archivos, especialmente con mensajes sobre tablas no reconocidas o tipos incompatibles.
version: 1.0.0
tags: [supabase, typescript, types, database]
---

# Fix Supabase Types

## ⚠️ PROTOCOLO OBLIGATORIO: Antes de Tocar Cualquier Código

Cuando aparezcan 50+ errores de TypeScript simultáneamente en múltiples archivos,
**la causa es SIEMPRE el archivo `types/database.types.ts`**, no el código de la app.

**NO hagas esto:**
- ❌ Modificar componentes para "alinear con el schema"
- ❌ Cambiar `getSession()` por `getClaims()` en masa como fix de tipos
- ❌ Eliminar `any` en masa como fix de tipos
- ❌ "Adaptar componentes al nuevo esquema"
- ❌ Ejecutar `pnpm lint` como diagnóstico de errores TS

**Haz esto primero:**

```bash
head -3 types/database.types.ts
```

Si la respuesta NO es `export type Json =`, el archivo está corrupto → ir a sección "Reparación".
Si la respuesta ES `export type Json =`, los errores son reales → ir a sección "Tabla Faltante en Types".

## Síntomas de Tipos Corruptos

- `pnpm typecheck` muestra 100–300 errores en 20+ archivos simultáneamente
- Errores como: `Argument of type '"tabla_x"' is not assignable to parameter of type '"tabla_a" | "tabla_b" | ...`
- Errores como: `Type '...' is missing the following properties from type 'MiTipo': campo1, campo2`
- El archivo `types/database.types.ts` comienza con texto como `undefined`, `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` o `Command not found`

## Causa Raíz Común

El script `pnpm gen:types` redireccionaba stdout al archivo con `>`:

```bash
# ❌ PELIGROSO - si el comando falla, el error se escribe en el .ts
supabase gen types ... > types/database.types.ts

# ✅ SEGURO - usa --output para escritura atómica
supabase gen types ... --output types/database.types.ts
```

Si `supabase` no está instalado (`Command not found`), el mensaje de error sobreescribe el archivo `.ts`, corrompiendo todos los tipos.

## Diagnóstico (ejecutar en orden)

### Paso 1: Verificar si el archivo está corrupto
```bash
head -3 types/database.types.ts
```
- ✅ Normal: `export type Json =`
- ❌ Corrupto: cualquier otra cosa (mensaje de error, `undefined`, etc.)

### Paso 2: Contar errores actuales
```bash
pnpm typecheck 2>&1 | tail -10
```

### Paso 3: Ver qué tablas existen en los tipos actuales
```bash
grep -n "^      [a-z]" types/database.types.ts | grep -v "Row\|Insert\|Update\|Relationships"
```

## Reparación

### Opción A: Restaurar desde git (recomendada si hay commit reciente)

```bash
# Ver historial del archivo
git log --oneline -- types/database.types.ts

# Restaurar desde el commit más reciente que funciona
git checkout <COMMIT_HASH> -- types/database.types.ts

# Verificar
head -3 types/database.types.ts
pnpm typecheck 2>&1 | tail -5
```

### Opción B: Regenerar desde Supabase (requiere internet + auth)

```bash
# Verificar que supabase CLI esté disponible
pnpm exec supabase --version

# Regenerar (--output es atómico, no corrompe en caso de fallo)
pnpm gen:types

# Verificar
head -3 types/database.types.ts
pnpm typecheck 2>&1 | tail -5
```

## Tabla Faltante en Types

Si `pnpm typecheck` reporta `.from("mi_tabla")` como tabla inválida pero la tabla existe en Supabase:

### 1. Regenerar tipos (la forma correcta)
```bash
pnpm gen:types
```

### 2. Si el CLI no está disponible: agregar manualmente

Localizar en `types/database.types.ts` el bloque `Tables: {` y agregar la tabla en orden alfabético:

```typescript
// Plantilla para tabla nueva
      nombre_tabla: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
          // ... resto de columnas según el schema SQL
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
          // ... columnas requeridas sin ?
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
          // ... todas opcionales con ?
        }
        Relationships: [
          {
            foreignKeyName: "nombre_tabla_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
```

También agregar al bloque `from()` en el tipo `TablesAndViews`:
```typescript
// Buscar la línea con el tipo de from() y agregar:
| "nombre_tabla"
```

## Prevención

### 1. package.json — usar `--output` no `>`

```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --project-id TU_PROJECT_ID --output types/database.types.ts"
  }
}
```

### 2. supabase como devDependency

```json
{
  "devDependencies": {
    "supabase": "^2.23.4"
  }
}
```

### 3. Crear migration para cada tabla nueva

Cada tabla creada en Supabase Dashboard debe tener su migration en `supabase/migrations/`:

```bash
# Crear migration
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_nombre_tabla.sql
```

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_nombre_tabla.sql
CREATE TABLE IF NOT EXISTS public.nombre_tabla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- columnas...
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SELECT por tenant" ON public.nombre_tabla
FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "ALL para admins" ON public.nombre_tabla
FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);
```

## Supabase MCP (alternativa al CLI)

Si el MCP de Supabase está activo, se pueden usar sus herramientas para inspeccionar el schema **sin necesidad del CLI**:

### Verificar schema actual via MCP

Usar la herramienta MCP `execute_sql` con esta query para ver todas las tablas y columnas:

```sql
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

### Verificar tabla específica faltante

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'nombre_tabla'
ORDER BY ordinal_position;
```

### Configurar Supabase MCP (si no está activo)

Agregar al archivo `~/.claude/settings.json` en la sección `mcpServers`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "TU_SUPABASE_ACCESS_TOKEN"]
    }
  }
}
```

O como alternativa, con project URL directamente:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y", "@supabase/mcp-server-supabase@latest",
        "--supabase-url", "https://TU_PROJECT_ID.supabase.co",
        "--supabase-key", "TU_SERVICE_ROLE_KEY"
      ]
    }
  }
}
```

> El `access-token` se obtiene en: https://supabase.com/dashboard/account/tokens

## Regla de Comandos

> **SIEMPRE ejecutar comandos de forma INDIVIDUAL en este proyecto.**
> Nunca encadenar con `&&` — el entorno puede interrumpir la cadena
> y es imposible saber cuál falló. Un comando a la vez, revisar output, continuar.

```bash
# ✅ CORRECTO — uno por uno
pnpm typecheck
pnpm gen:types
pnpm lint
pnpm build

# ❌ NUNCA — encadenado
pnpm typecheck && pnpm gen:types && pnpm build
```

## Comandos de Diagnóstico

```bash
# Verificar estado del types file
head -3 types/database.types.ts

# Listar tablas en el types file
grep -n "^      [a-z]" types/database.types.ts | grep -v "Row\|Insert\|Update\|Relationships"

# Ver historial del types file
git log --oneline -- types/database.types.ts

# Restaurar a último commit conocido bueno
git checkout <COMMIT_HASH> -- types/database.types.ts
```
