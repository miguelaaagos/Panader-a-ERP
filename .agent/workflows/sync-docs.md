---
description: Sincroniza README.md y TODO.md tras completar un hito
---

Este flujo asegura que la calidad del código, la documentación técnica (`TODO.md`) y la documentación del proyecto (`README.md`) se mantengan alineadas antes de hacer push a GitHub.

1. **Testing Pre-Push**:
   - Ejecuta verificaciones estáticas: `pnpm typecheck` y `pnpm lint`.
   - Si el cambio incluyó código React complejo, ejecuta `npx react-doctor`.
   - Ejecuta las pruebas unitarias: `pnpm test` (Vitest).
   - Ejecuta las pruebas integradas y E2E referenciadas en la regla del usuario: `pnpm exec playwright test` (Ver workflow `/test-e2e`).

2. **Actualizar el README.md**:
   - Refleja las nuevas funcionalidades, cambios en el stack o correcciones críticas.
   - Asegúrate de actualizar la sección de "Última actualización" al final del archivo.

3. **Actualizar el TODO.md**:
   - Mueve las tareas completadas de `Tareas Pendientes` a `Tareas Completadas`.
   - Agrega un nuevo hito en `Estado Actual` con la fecha y el resumen de lo logrado.
   - Actualiza las `Notas para el Agente` si hay nuevos patrones o reglas descubiertos.

4. **Actualizar SESSION_SUMMARY.md / Verificación**:
   - Resume los logros técnicos, los "gotchas" encontrados y el estado en el que dejas el proyecto para la siguiente sesión o PC.
   - Revisa que todos los archivos sean coherentes entre sí.
