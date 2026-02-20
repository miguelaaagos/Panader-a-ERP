---
description: Sincroniza README.md y TODO.md tras completar un hito
---

Este flujo asegura que la documentación técnica (`TODO.md`) y la documentación del proyecto (`README.md`) se mantengan alineadas.

1. **Actualizar el README.md**:
   - Refleja las nuevas funcionalidades, cambios en el stack o correcciones críticas.
   - Asegúrate de actualizar la sección de "Última actualización" al final del archivo.

2. **Actualizar el TODO.md**:
   - Mueve las tareas completadas de `Tareas Pendientes` a `Tareas Completadas`.
   - Agrega un nuevo hito en `Estado Actual` con la fecha y el resumen de lo logrado.
   - Actualiza las `Notas para el Agente` si hay nuevos patrones o reglas descubiertos.

3. **Verificación**:
   - Revisa que ambos archivos sean coherentes entre sí.
   - Si el cambio incluyó código React complejo, ejecuta `npx react-doctor` antes de cerrar el hito.
