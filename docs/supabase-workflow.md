# Workflow de Supabase: Regeneración de Tipos

Para mantener la integridad de los tipos en TypeScript y evitar errores de build, sigue estas instrucciones exactamente.

## El Problema del Encoding (PowerShell)
Ejecutar `npx supabase gen types ... > types/database.types.ts` en Windows PowerShell produce un archivo en **UTF-16LE**, lo cual rompe la inferencia de tipos de TypeScript.

## Comando Único Permitido
Usa siempre el script definido en `package.json` que utiliza la CLI de Supabase de manera segura:

```bash
pnpm gen:types
```

Si el problema persiste y `node_modules/.bin/supabase` no existe, fuerza la instalación:

```bash
pnpm add -D supabase
```

Luego ejecuta los tipos usando el prefijo de `pnpm exec`:

```powershell
pnpm exec supabase gen types typescript --project-id mzbiksxetgpogaqncorl | Out-File -FilePath types/database.types.ts -Encoding utf8
```

> [!IMPORTANT]
> Nunca modifiques `types/database.types.ts` manualmente. Cualquier cambio manual será sobrescrito la próxima vez que se generen los tipos.
