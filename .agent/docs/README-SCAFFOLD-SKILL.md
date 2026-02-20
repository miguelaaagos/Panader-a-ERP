# Next.js 16 + Supabase Scaffold Skill para Antigravity

Esta es la **Skill de Blueprint/Scaffold** completa que puedes llevar directamente a Antigravity. Genera proyectos Next.js 16 + Supabase completos siguiendo TODAS las mejores prácticas de 2026 y evitando TODOS los patrones deprecados.

## 🎯 Qué Hace Esta Skill

Esta skill orquesta la creación completa de un proyecto full-stack:

1. ✅ Inicializa Next.js 16.1.6+ con App Router
2. ✅ Configura TypeScript en modo estricto
3. ✅ Integra Supabase con @supabase/ssr (NO auth-helpers deprecado)
4. ✅ Genera estructura de carpetas óptima
5. ✅ Crea todos los archivos de configuración actualizados
6. ✅ Configura autenticación con PKCE flow
7. ✅ Establece proxy.ts (NO middleware.ts)
8. ✅ Genera clientes de Supabase correctos (browser + server)
9. ✅ Configura RLS policies si se necesita
10. ✅ Crea documentación completa

## 📦 Contenido del Paquete

```
nextjs-supabase-scaffold/
├── SKILL.md                                    # Skill principal
└── references/                                 # Templates
    ├── next-config.template.ts                 # Config Next.js con cacheComponents
    ├── tsconfig.template.json                  # TypeScript strict mode
    ├── proxy.template.ts                       # Session refresh (NUEVO patrón)
    ├── supabase-client.template.ts             # Browser client
    ├── supabase-server.template.ts             # Server client
    ├── env.template                            # Variables de entorno
    └── eslint-config.template.mjs              # ESLint flat config
```

## 🚀 Instalación en Antigravity

### Opción 1: Desde archivo comprimido

1. Descarga `nextjs-supabase-scaffold-skill.tar.gz`
2. Extrae en tu proyecto:
   ```bash
   cd tu-proyecto
   mkdir -p .agent/skills
   tar -xzf nextjs-supabase-scaffold-skill.tar.gz -C .agent/skills/
   ```

### Opción 2: Copia manual

Crea la estructura de carpetas en `.agent/skills/nextjs-supabase-scaffold/` y copia los archivos.

## 💡 Cómo Usar

Una vez instalada, simplemente escribe en Antigravity:

```
"Crea un nuevo proyecto Next.js con Supabase"
```

o

```
"Bootstrap una aplicación full-stack con auth"
```

o

```
"Inicializa un proyecto SaaS"
```

Antigravity detectará automáticamente que necesita usar esta skill y te guiará paso a paso.

## 🎨 Qué Genera

Después de ejecutar la skill, tendrás:

```
mi-proyecto/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── auth/confirm/route.ts        # PKCE callback
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # ✅ Con @supabase/ssr
│   │   │   ├── server.ts                # ✅ Async cookies()
│   │   │   └── proxy.ts
│   │   └── utils.ts
│   ├── server/
│   │   ├── actions/
│   │   ├── queries/
│   │   └── services/
│   ├── types/
│   │   ├── database.types.ts
│   │   └── index.ts
│   ├── schemas/
│   └── config/
├── proxy.ts                             # ✅ NO middleware.ts
├── next.config.ts                       # ✅ Con cacheComponents
├── tsconfig.json                        # ✅ Strict mode completo
├── eslint.config.mjs                    # ✅ Flat config
└── .env.local
```

## ✅ Garantías de Esta Skill

### ❌ NUNCA Generará Código Deprecado

Esta skill está explícitamente programada para **NUNCA** usar:

1. ❌ middleware.ts (deprecado Next.js 16)
2. ❌ @supabase/auth-helpers-nextjs (archivado 2025)
3. ❌ getSession() en servidor
4. ❌ Métodos individuales de cookies (get/set/remove)
5. ❌ unstable_cache
6. ❌ experimental.ppr
7. ❌ params/cookies/headers síncronos
8. ❌ TypeScript `any`
9. ❌ .eslintrc (formato viejo)
10. ❌ next lint wrapper

### ✅ SIEMPRE Usará Los Patrones Correctos

1. ✅ proxy.ts con `export async function proxy`
2. ✅ @supabase/ssr v0.8+
3. ✅ getClaims() para validación JWT
4. ✅ await params, await cookies(), await headers()
5. ✅ "use cache" directive
6. ✅ cacheComponents: true
7. ✅ TypeScript strict mode
8. ✅ Server Components por defecto
9. ✅ PKCE flow para auth
10. ✅ Publishable/Secret keys (formato nuevo)

## 🔧 Personalización

La skill te preguntará:

1. **Nombre del proyecto**: ¿Cómo lo llamamos?
2. **Autenticación**: ¿Necesitas login?
   - Email/password
   - OAuth (Google, GitHub, etc.)
   - Magic links
3. **Base de datos**: ¿Qué tablas iniciales?
4. **Features**: ¿Dashboard? ¿Admin panel?
5. **Deploy**: ¿Vercel? ¿Railway? ¿Self-hosted?

Y generará exactamente lo que necesitas.

## 📚 Lo Que Esta Skill Sabe

Esta skill tiene conocimiento completo de:

- ✅ Next.js 16.1.6 (Octubre 2025) con todos los breaking changes
- ✅ Cambio de middleware.ts → proxy.ts
- ✅ Request APIs async (params, cookies, headers)
- ✅ Nuevo sistema de caching con "use cache"
- ✅ React 19.2 con Server Components
- ✅ Supabase SSR (@supabase/ssr 0.8+)
- ✅ Deprecación de auth-helpers
- ✅ Nuevo formato de keys (publishable/secret)
- ✅ PKCE flow para auth
- ✅ TypeScript 5.7+ con noUncheckedIndexedAccess
- ✅ Tailwind CSS v4 (CSS-first config)
- ✅ ESLint flat config format
- ✅ Turbopack como bundler default

## 🎓 Comparación con Skills Modulares

Esta skill es **Level 5** (Full Composition) en la taxonomía de Antigravity:

- Usa **templates** en `references/`
- Puede llamar **scripts** (si los agregamos)
- Se puede **componer** con otras skills
- Es la **orquestadora** de todo el scaffold

Pero también puedes tener skills más pequeñas y especializadas:

- `supabase-auth-integration`: Solo auth
- `nextjs-16-setup`: Solo Next.js
- `typescript-strict-config`: Solo TypeScript
- `rls-policies-generator`: Solo RLS

Esta scaffold skill las puede invocar todas si es necesario.

## 🐛 Troubleshooting

### "La skill no se activa"

Verifica que:
1. El archivo SKILL.md está en `.agent/skills/nextjs-supabase-scaffold/`
2. El YAML frontmatter es válido
3. El `description` tiene keywords relevantes

### "Genera código viejo"

Si genera middleware.ts o usa auth-helpers:
1. Verifica que la skill está actualizada
2. Checa que Antigravity esté usando esta skill (pregúntale)
3. Menciónala explícitamente: "Usando la skill nextjs-supabase-scaffold, crea..."

### "Faltan templates"

Verifica que la carpeta `references/` tiene todos los archivos .template

## 🆕 Actualizaciones Futuras

Si Next.js 17 o Supabase hacen breaking changes:

1. Actualiza solo el SKILL.md
2. Actualiza los templates en `references/`
3. Mantén la estructura igual

## 📞 Uso Avanzado

### Invocar explícitamente

```
"Usando la skill nextjs-supabase-scaffold, crea un proyecto llamado 'mi-saas' con auth de Google"
```

### Combinar con otras skills

```
"Primero usa nextjs-supabase-scaffold para el proyecto, luego usa rls-policies-generator para las tablas"
```

### Verificar qué skill se usa

```
"¿Qué skill estás usando para esto?"
```

Antigravity te dirá qué skills tiene activas.

## 🎉 Ventajas de Esta Skill

1. **Cero configuración manual** - Todo generado automáticamente
2. **Siempre actualizada** - Usa los patrones de 2026
3. **Nunca código deprecado** - Constraints explícitos lo previenen
4. **Production-ready** - RLS, types, validación, todo incluido
5. **Documentada** - README generado con instrucciones completas
6. **Verificable** - Checks automáticos de build/lint/types
7. **Personalizable** - Pregunta qué necesitas exactamente
8. **Modular** - Puede trabajar con otras skills

## 🚀 Próximos Pasos

Después de usar esta skill:

1. **Inicializa git**: `git init && git add . && git commit -m "Initial scaffold"`
2. **Instala shadcn/ui**: Para componentes UI
3. **Agrega features**: Usa otras skills para funcionalidad específica
4. **Deploy a Vercel**: `vercel --prod`
5. **Configura CI/CD**: GitHub Actions para tests automáticos

## 📖 Recursos

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Antigravity Skills Docs](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)

---

**Creado para**: Next.js 16.1.6+, React 19.2+, Supabase SSR 0.8+, TypeScript 5.7+  
**Fecha**: Febrero 2026  
**Compatible con**: Google Antigravity  
**Nivel**: Level 5 (Full Composition)  
**Tipo**: Blueprint/Scaffold Orchestrator
