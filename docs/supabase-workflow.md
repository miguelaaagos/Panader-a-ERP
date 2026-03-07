# Workflow de Supabase: Regeneración de Tipos

Para mantener la integridad de los tipos en TypeScript y evitar errores de build, sigue estas instrucciones exactamente.

## El Problema del Encoding (PowerShell)
Ejecutar `npx supabase gen types ... > types/database.types.ts` en Windows PowerShell produce un archivo en **UTF-16LE**, lo cual rompe la inferencia de tipos de TypeScript.

## Comando Único Permitido
Usa siempre el script definido en `package.json` que utiliza la CLI de Supabase de manera segura:

```bash
pnpm gen:types
```

## En caso de error "supabase no se reconoce"
Si el comando falla porque no encuentra la CLI, asegúrate de haber ejecutado primero:

```bash
pnpm install
```

Si el problema persiste, puedes intentar usar `npx` explícitamente pero asegurando el encoding UTF-8 (solo si es estrictamente necesario):

```powershell
npx supabase gen types typescript --project-id mzbiksxetgpogaqncorl | Out-File -FilePath types/database.types.ts -Encoding utf8
```

> [!IMPORTANT]
> Nunca modifiques `types/database.types.ts` manualmente. Cualquier cambio manual será sobrescrito la próxima vez que se generen los tipos.
