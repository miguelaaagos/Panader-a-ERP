# Resumen de Sesión - 27 de Febrero de 2026

## Logros Técnicos
1. **Gastos Operativos (Resolución de Bugs)**:
   - Se arregló un problema crítico de Row Level Security (RLS) en la tabla `gastos` que causaba rechazos silenciosos.
   - Manejo de excepciones adecuado (`try-catch/finally`) en botones de guardado con feedback visual en pantalla en caso de bloqueos del backend.

2. **UX en Gastos Operativos**:
   - Se añadió un modal (`Dialog`) "Nueva Categoría" en el formulario de `/gastos/nuevo`. 
   - A través de *Server Actions* el usuario puede crear categorías al instante sin abandonar la pantalla y sin refrescar.

3. **Pipelines / Workflows**:
   - Refactorización de `/sync-docs` para incluir una etapa obligatoria de _Testing Pre-Push_.
   - Se re-configuraron las pruebas E2E en Playwright (`testMatch`) para ignorar archivos `.test.ts` (Vitest) y enfocarse en `.spec.ts` / `.e2e.ts`.
   - Se ejecutó `pnpm typecheck`, arreglando un bug TS en `tests/erp-store.test.ts`.
   - Se ejecutó `pnpm test` (Vitest unitarios), pasando sin errores.
   - Pnpm exec `playwright test` (Playwright E2E), pasando sin errores.

## Gotchas Encontrados
- **ESLint 9 + Next.js Flat Config**: Existen problemas de resolución en `pnpm` con `eslint-plugin-react` provocando un Error Code 2. Este linter falla en la terminal actualmente. Se agregó a the TODO list para revisiones de toolings a futuro.
- **Playwright Match**: La configuración preestablecida estaba recogiendo los Unit Tests de Zustand (`erp-store.test.ts`) provocando crashes en Playwright. Playwright Config ahora aísla archivos E2E/Spec explícitamente.

## Próximos Pasos Sugeridos
- Completar la visualización/vinculación de los reportes financieros del Dashboard frente a estos nuevos tickets de gastos fijos.
- Resolver el conflicto de la Flat Config en ESLint 9 y limpiar el error en CI local.
- Revisar y avanzar en la implementación Transbank.
