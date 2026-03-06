# TODO: Sincronización de Desarrollo (Calama - Antofagasta)

## Estado Actual: Consolidación de Ramas + Módulo de Compras (Marzo 2026)
- **Fecha**: 2026-03-06
- **Ubicación**: Antofagasta
- **Hito**: Consolidación total de ramas `main` y `desarrollo`. Cherry-pick de refactorización Ingresos→Compras (`e3bd7ad`). Ambas ramas sincronizadas en commit `9c1aa27`. Pendiente: arreglar error de build en Vercel.

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
- [x] Corregir permisos de rol Cajero para permitir el registro de Ingresos de inventario y Ajuste de Stock.
- [x] Garantizar visibilidad de "Mi Perfil" en la Sidebar para todos los roles.
- [x] Reemplazar mensaje de error en texto plano por un Modal de Diálogo elegante (shadcn) en el Login.
- [x] **Módulo Financiero**: Añadir gestión de "Gastos" del local con modal de creación rápida de categorías.
- [x] Refactorización de workflow `/sync-docs` para forzar `pnpm typecheck`, `lint`, `vitest` y `playwright` pre-push.
- [x] **Corrección Bug Conversión de Unidades (Recetas)**: `getLineCost` ahora usa `convertQuantity` internamente — 12g a $800/kg = $9.6 (no $9,600).
- [x] **Input de Cantidad en Tiempo Real**: `cantidad` cambiada a `string` en el estado del formulario para soportar decimales y actualización reactiva sin reseteos.
- [x] **Normalización de BD**: `UPDATE productos SET factor_conversion = 1000, unidad_medida_base = 'g'` para todos los productos en `kg` con factor incorrecto.
- [x] **Auditoría de cálculos de costos en recetas vs precios de insumos**: Completado — bug corregido y verificado.
- [x] **Consolidación de ramas Git**: `main` y `desarrollo` sincronizadas en `9c1aa27`. Ramas sucias (`pr-1`, `claude/musing-brattain`) depuradas.
- [x] **Módulo de Compras (ex-Ingresos)**: Cherry-pick de `e3bd7ad` a `main` — renombrado de Ingresos→Compras en sidebar, actions y páginas.
- [x] **Skill `shell-syntax-rules`**: Creada para prevenir uso de `&&` en PowerShell. Usar `;` o comandos separados.
## Tareas Pendientes [ ]
- [ ] **Arreglar error de build en Vercel** tras merge de refactorización Compras (nuevo chat).
- [ ] Integración de Gastos Fijos (sueldos, luz, agua) al Dashboard Financiero.
- [ ] Implementar soporte 100% Offline (PWA) con IndexedDB para carga total de catálogo y sincronización en segundo plano.
- [ ] Solucionar error de resolución de `eslint-plugin-react` con ESLint 9 Flat Config + PNPM.
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
- **`factor_conversion` en BD**: Productos en `kg` deben tener `factor_conversion = 1000` y `unidad_medida_base = 'g'`.
- **`cantidad` en recetas**: Es tipo `string` en el estado local — usar `parseFloat()` para cálculos.
- **PowerShell**: NUNCA usar `&&` para encadenar comandos. Usar `;` o comandos separados (skill `shell-syntax-rules`).
- **Rama activa de trabajo**: `desarrollo` (sincronizada con `main` en `9c1aa27`).
