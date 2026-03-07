# Risk Hotspots

## 1) Auth and Redirect Security

- Validar callbacks/auth routes contra open redirect.
- Nunca confiar en query params para redireccionar sin sanitizacion.
- Verificar continuidad entre `proxy.ts`, `lib/server/auth.ts` y acciones.

## 2) Permissions and Ownership

- Toda accion sensible debe usar `validateRequest('<permiso>')`.
- No depender solo de `RoleGuard` (es UI-side).
- Para lectura por ID (ventas, turnos, etc.), filtrar por:
  - `tenant_id`
  - ownership (`usuario_id`) cuando rol no sea admin

## 3) Tenant Isolation

- Confirmar que queries incluyan filtro por tenant.
- En acciones con IDs externos (`saleId`, `sessionId`), verificar pertenencia previa.

## 4) Stock and Financial Integrity

- Cambios en ventas/anulaciones/produccion deben mantener stock consistente.
- Preferir operaciones atomicas (RPC/transacciones DB) en operaciones criticas.
- Revisar recalculo de costos (recetas) y reportes financieros tras cambios de esquema.

## 5) Workflow Discipline

- Antes de push o cierre de hito, correr checklist de `.agent/workflows/sync-docs.md`.
- Si hay cambios en pruebas E2E, revisar `.agent/workflows/test-e2e.md`.

## Quick Review Checklist

1. ¿La accion server tiene permiso explicito?
2. ¿La query restringe tenant?
3. ¿Hay control de ownership para no-admin?
4. ¿Se valida input con Zod cuando aplica?
5. ¿Se ejecutaron checks del workflow activo?
