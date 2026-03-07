# Project Map (POS Panaderia)

## Core Stack

- Next.js App Router + React + TypeScript
- Supabase SSR (auth + DB)
- Server Actions en `actions/` y `server/actions/`
- Estado de POS en Zustand (`hooks/use-erp-store.ts`)

## Directory Layout

- `app/`
  - Rutas y layouts (dashboard, auth, modulos funcionales)
- `components/`
  - UI y modulos de negocio (ERP, inventario, recetas, produccion, gastos, asistencia)
- `actions/`
  - Server Actions principales (ventas, caja, inventario, recetas, gastos, analytics, etc.)
- `server/actions/`
  - Acciones server-side complementarias (ej: asistencia)
- `lib/`
  - Auth helpers, roles/permisos, utilidades y supabase clients
- `.agent/workflows/`
  - Flujos operativos para Antigravity

## Business Modules

- Ventas/POS:
  - UI: `app/dashboard/erp/page.tsx`, `components/erp/*`
  - Acciones: `actions/sales.ts`, `actions/cash.ts`
  - Riesgo alto: stock, anulacion, permisos por rol, session/cash shift

- Inventario:
  - UI: `app/dashboard/inventario/*`, `components/inventario/*`
  - Acciones: `actions/inventory.ts`, `actions/ingresos.ts`
  - Riesgo alto: conversion de unidades y consistencia de stock

- Recetas y Produccion:
  - UI: `app/dashboard/recetas/*`, `app/dashboard/produccion/*`
  - Acciones: `actions/recipes.ts`, `actions/production.ts`
  - Riesgo alto: costos, consumo de insumos y RPCs de produccion

- Gastos y Reportes:
  - UI: `app/dashboard/gastos/*`, `app/dashboard/reportes/financiero/*`
  - Acciones: `actions/gastos.ts`, `actions/reportes.ts`, `actions/analytics.ts`
  - Riesgo alto: permisos de acceso y calculos financieros

- Asistencia:
  - UI: `app/dashboard/asistencia/page.tsx`
  - Acciones: `server/actions/attendance.ts`

## Auth and Access Control

- Proxy auth gate: `proxy.ts`
- Request auth + permission check: `lib/server/auth.ts` (`validateRequest`)
- Matriz de permisos: `lib/roles.ts`
- Flujo de confirmacion auth: `app/auth/confirm/route.ts`

## Operational Docs (source of truth)

- Estado de trabajo e hitos: `TODO.md`
- Traspaso entre sesiones: `SESSION_SUMMARY.md`
- Descripcion general del sistema: `README.md`
