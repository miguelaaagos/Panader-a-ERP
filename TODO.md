# TODO: Sincronización de Desarrollo (Calama - Antofagasta)

## Estado Actual: Documentación & Calidad (Febrero 2026)
- **Fecha**: 2026-02-21
- **Ubicación**: Antofagasta
- **Hito**: Sistema estabilizado con pnpm y validado con react-doctor.

## Tareas Completadas [x]
- [x] Establecer y documentar estándares UI/UX (Notificaciones, Gráficos PowerBI style, Tablas móviles, Dark mode) en GEMINI.md y skills.
- [x] Optimizar la responsividad móvil en tablas de Inventario, Ventas y ERP.
- [x] Solucionar error 500 en creación de usuarios e incorporar estado visual de notificaciones (Toaster).
- [x] Consolidar `proxy.ts` y eliminar `middleware.ts`.
- [x] Actualizar clientes de Supabase SSR con `getClaims()` en Server Actions.
- [x] Implementar `"use cache"` en Dashboard y Acciones de Ventas.
- [x] Corregir errores de tipos en `production.ts` y `users.ts`.
- [x] Crear acción `getSession` para identificación de tenant en cliente.
- [x] Sincronizar Supabase MCP con el proyecto actual.
- [x] Implementar protocolo de sincronización Cross-PC (`TODO.md` + `GEMINI.md`).
- [x] Actualizar `README.md` y `GEMINI.md` con pnpm y react-doctor.
- [x] Implementar flujo de trabajo `/run-app` y `/sync-docs`.
- [x] Ejecutar auditoría `react-doctor` (92/100) y aplicar optimizaciones de performance.
- [x] Corregir error `AuthApiError: Refresh Token Not Found` en `proxy.ts`.
- [x] **Saneamiento de RLS**: Eliminación de recursividad infinita en políticas de `usuarios` y `ventas` mediante el uso de funciones `SECURITY DEFINER`.
- [x] **Infraestructura de Testing**: Integración completa de Playwright (E2E y Component testing) con auth global.
- [x] **Módulo de Gastos Operativos**: UI y Backend (Supabase + Actions) para registro de tickets de gastos.
- [x] **Reportes Financieros (SII)**: Dashboard integrado con Recharts para IVA Débito, Crédito, Ventas y Gastos.

## Tareas Pendientes [ ]
- [ ] Auditoría profunda de cálculos de costos en recetas vs precios de insumos.
- [ ] Implementar soporte 100% Offline (PWA) con IndexedDB para carga total de catálogo y sincronización en segundo plano.
- [x] Ejecución de pruebas iniciales con Playwright (Salud del sistema)
- [x] Configuración de Global Auth Setup para tests rápidos
- [ ] **Integración Transbank (Webpay Plus)**:
    - [ ] Configurar ambiente de Integration (Sandbox) y llaves en `.env`.
    - [ ] Implementar flujo de pago: `create` (Server Action) -> Redirección -> `commit` (API Route/Action).
    - [ ] Integrar con el flujo de cierre de venta en el ERP.

## Notas para el Agente
- Leer este archivo AL INICIO de cada sesión.
- `proxy.ts` usa `getUser()` (para middleware/session refresh).
- `lib/server/auth.ts` y Server Components usan `getClaims()` (validación JWT local).
- Claves en `.env`: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Skill activa: `.agent/skills/supabase-ssr/SKILL.md` — siempre consultarla antes de tocar auth.
- Workflow de arranque: `/run-app` → ejecuta `npm run dev` (usando npm).
- Estilo CSS: Tailwind v3.4.19 (configuración vía tailwind.config.ts).
