---
name: pos-project-workflow-compass
description: Entiende rápidamente la arquitectura, módulos, riesgos y workflows operativos de este ERP POS de panadería antes de implementar cambios. Úsala cuando necesites onboarding técnico del repositorio, decidir qué workflow de `.agent/workflows` ejecutar, mapear impactos de una feature entre módulos (ventas, caja, inventario, recetas, producción, gastos/reportes), o validar qué checks correr antes de push.
---

# POS Project Workflow Compass

## Overview

Esta skill define un protocolo de lectura y ejecución para trabajar este repositorio sin romper flujos críticos del POS.

## Workflow

1. Leer contexto operativo mínimo antes de tocar código:
- `TODO.md`
- `SESSION_SUMMARY.md`
- `README.md`

2. Elegir workflow según intención:
- Si vas a levantar entorno: usar `.agent/workflows/run-app.md`.
- Si vas a validar E2E: usar `.agent/workflows/test-e2e.md`.
- Si vas a cerrar un hito o preparar push: usar `.agent/workflows/sync-docs.md`.
- Si la tarea es más amplia, cargar `.agent/workflows/workflows.md` y elegir `/...` adecuado.

3. Cargar mapa técnico del proyecto:
- Leer `references/project-map.md` para ubicar módulos, capas y archivos de entrada.
- Leer `references/risk-hotspots.md` si hay cambios en auth, permisos, ventas, caja o inventario.

4. Ejecutar implementación y verificación:
- Aplicar cambios en la capa correcta (UI, action, DB/RPC, o policy).
- Validar con checks del workflow activo antes de cerrar.

## Decision Tree

- Solicitud de onboarding o "entiende primero el proyecto":
  - Leer `references/project-map.md`.
  - Resumir arquitectura + módulos + puntos críticos.
- Solicitud de cambio funcional:
  - Mapear módulo impactado en `references/project-map.md`.
  - Cargar workflow operativo correspondiente desde `.agent/workflows/`.
  - Revisar riesgos en `references/risk-hotspots.md` antes de editar.
- Solicitud de bug en auth/permisos/datos:
  - Priorizar `references/risk-hotspots.md`.
  - Verificar guardas de permisos en server actions y filtros por tenant/ownership.

## Required Output

Cuando uses esta skill, entrega siempre:

1. Resumen corto del módulo afectado.
2. Workflow elegido y por qué.
3. Riesgos detectados (si aplica).
4. Plan de validación ejecutable (comandos/checks).
