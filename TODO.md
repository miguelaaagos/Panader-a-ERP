# TODO: Sincronización de Desarrollo (Calama - Antofagasta)

## Estado Actual: Documentación & Calidad (Febrero 2026)
- **Fecha**: 2026-02-26
- **Ubicación**: Antofagasta
- **Hito**: Ajustes visuales, formatting en Recharts, corrección de desfase en gráfico de Flujo de Caja y refactorización UI en POS/Reportes.

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
- [x] **Estabilización Core ERP**: Resolución holística de inconsistencias de esquema (errores `total null`, enum states) reescribiendo `create_sale_v1` RPC.
- [x] **Flujo Auth PKCE**: Implementación completa de recuperación de contraseña (`forgot-password`, `reset-password`, actions).
- [x] **Limpieza de Repositorio**: Eliminación de rama `vercel` y consolidación de trabajo en la nueva rama `desarrollo`.
- [x] **UI/UX en Reportes y Dashboard**: Corrección de solapamiento de textos en Recharts, formateo `es-CL`, exclusión de labels en 0 y remoción de ambigüedad en tributos (IVA Ventas / IVA Compras).
- [x] **Refactorización POS**: Ocultar el desglose de IVA por método de pago individual en el checkout, simplificando a "IVA 19% incluido" en el global. Cambios de "ERP" a "Ventas" en la Sidebar.
- [x] **Gráficos Financieros**: Corrección del desfase (offset) en el eje X del gráfico de Flujo de Caja combinando barras de Ventas/Gastos en una sola con renderizado condicional.
- [x] **Mejoras UI Modal Recetas**: Agregado Quick Create de insumos, rediseño con variante Dark Mode, margen sugerido funcional.
## Tareas Pendientes [ ]
- [ ] **Módulo Financiero**: Añadir gestión de "Gastos Fijos" del local (arriendo, luz, agua, sueldos) para integrarlos en el cálculo de Utilidad Neta del Dashboard.
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
