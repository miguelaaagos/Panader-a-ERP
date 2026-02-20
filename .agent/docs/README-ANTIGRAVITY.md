# Configuración Completa de Antigravity para Next.js 16 + Supabase

Esta configuración incluye todo lo necesario para trabajar con Antigravity usando Next.js 16, Supabase SSR, y TypeScript estricto.

## 📦 Contenido

```
.gemini/
└── GEMINI.md                          # Reglas principales del proyecto

.agent/
├── skills/
│   ├── supabase-ssr/SKILL.md         # Patrones de auth con Supabase
│   ├── nextjs-16/SKILL.md            # Patrones de Next.js 16 App Router
│   └── typescript-strict/SKILL.md    # TypeScript en modo estricto
└── workflows/
    └── workflows.md                   # Workflows comunes (/setup-project, /create-feature, etc.)
```

## 🚀 Instalación

### Opción 1: Descarga el archivo completo

1. Descarga `antigravity-stack-config.tar.gz`
2. Extrae en la raíz de tu proyecto:
   ```bash
   cd tu-proyecto
   tar -xzf antigravity-stack-config.tar.gz
   mv antigravity-config/.gemini .
   mv antigravity-config/.agent .
   ```

### Opción 2: Copia manual

Crea los archivos manualmente en tu proyecto siguiendo la estructura arriba.

## 📝 Cómo Usar

### Reglas (.gemini/GEMINI.md)

Las reglas en `GEMINI.md` se aplican automáticamente a TODAS las conversaciones en este proyecto. Contienen:

- ✅ Versiones exactas del stack (Next.js 16.1.6, React 19.2, etc.)
- ✅ Patrones correctos de Supabase SSR
- ✅ Lista de paquetes deprecados que NUNCA usar
- ✅ Arquitectura de carpetas recomendada
- ✅ Comandos comunes

**No necesitas hacer nada** - Antigravity las lee automáticamente.

### Skills (.agent/skills/)

Las Skills se activan cuando Antigravity detecta que estás trabajando en algo relacionado. Por ejemplo:

- Trabajas en `lib/supabase/client.ts` → activa `supabase-ssr` skill
- Trabajas en `app/page.tsx` → activa `nextjs-16` skill
- Trabajas en archivos `.ts/.tsx` → activa `typescript-strict` skill

**También puedes invocarlas manualmente** en el chat:
```
"Usa la skill supabase-ssr para crear el cliente de servidor"
```

### Workflows (.agent/workflows/)

Los workflows son prompts guardados que invocas con `/nombre`:

```
/setup-project          # Inicia nuevo proyecto desde cero
/create-feature         # Crea CRUD completo
/add-auth              # Agrega autenticación
/debug-auth            # Debuggea problemas de auth
/generate-types        # Regenera tipos de Supabase
/create-rls            # Crea políticas RLS
/optimize-performance  # Analiza performance
/migrate-to-16         # Migra de Next.js 14/15 a 16
/review-code           # Revisa código pre-commit
/create-component      # Crea componente con best practices
/setup-testing         # Configura Vitest
```

## 🎯 Uso Típico

### Empezar un proyecto nuevo

```
/setup-project
```

Antigravity te guiará paso a paso.

### Agregar una feature

```
/create-feature

[Responde las preguntas]
```

Antigravity creará:
- Schema SQL
- Zod schema
- Server Actions
- Componentes React
- Todo con tipos correctos

### Debuggear auth

```
/debug-auth
```

Antigravity ejecutará checks y te dirá exactamente qué está mal.

## 🔧 Personalización

### Agregar tu propio Workflow

Edita `.agent/workflows/workflows.md` y agrega:

```markdown
## /mi-workflow

Descripción de qué hace.

[prompt aquí]
```

### Agregar tu propia Skill

Crea `.agent/skills/mi-skill/SKILL.md`:

```markdown
---
name: mi-skill
description: Cuándo usar esta skill
version: 1.0.0
tags: [tag1, tag2]
---

# Mi Skill

Instrucciones detalladas...
```

### Actualizar Reglas

Edita `.gemini/GEMINI.md` directamente. Los cambios se aplican inmediatamente.

## ✅ Verificación

Para verificar que todo está configurado:

1. Abre Antigravity en tu proyecto
2. Escribe: `"¿Qué reglas y skills tienes activas?"`
3. Antigravity debería listar:
   - GEMINI.md rules
   - supabase-ssr skill
   - nextjs-16 skill
   - typescript-strict skill
   - Workflows disponibles

## 🚨 Reglas Más Importantes

Estas son las reglas que Antigravity SIEMPRE enforce:

1. **proxy.ts NO middleware.ts** (Next.js 16)
2. **@supabase/ssr NO auth-helpers** (deprecado)
3. **getClaims() NO getSession()** (en servidor)
4. **await params/cookies/headers** (todos async en Next.js 16)
5. **"use cache" NO unstable_cache** (nuevo API)
6. **No usar `any` nunca** (TypeScript estricto)

## 📚 Recursos

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Antigravity Skills Guide](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)

## 🆘 Troubleshooting

### "Antigravity no está usando las reglas"

Verifica que `.gemini/GEMINI.md` existe en la raíz del proyecto (o donde abriste Antigravity).

### "Skills no se activan"

Las skills se activan por contexto. Menciónales explícitamente:
```
"Usando la skill supabase-ssr, crea el cliente browser"
```

### "Workflows no aparecen"

Los workflows se invocan con `/` en el chat. Escribe `/` y debería mostrar la lista.

## 💡 Tips Pro

1. **Combina workflows**: `/setup-project` → `/add-auth` → `/create-feature`
2. **Usa /review-code** antes de cada commit
3. **Personaliza GEMINI.md** con tus preferencias específicas
4. **Crea Skills** para patrones que repites mucho en tu proyecto

---

**Creado para**: Next.js 16.1.6, React 19.2, Supabase SSR, TypeScript 5.7+
**Fecha**: Febrero 2026
**Compatible con**: Google Antigravity
