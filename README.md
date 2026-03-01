# 🥖 ERP Panadería - Sistema de Gestión Integral

> Sistema integral de gestión (ERP) diseñado para optimizar la operación diaria de panaderías y pastelerías, con control total de inventario, producción, ventas y flujo de caja en tiempo real.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4.1-38bdf8)](https://tailwindcss.com/)

---

## 📋 Funcionalidades Principales

### 🛒 Módulo de Ventas (ERP)
*   **Gestión de Turnos Activa**: Control de apertura y cierre de caja con arqueo automatizado.
*   **Historial de Turnos**: Consulta detallada de sesiones pasadas, ventas realizadas y balances por método de pago.
*   **Interfaz Táctil y Rápida**: Organización por categorías, búsqueda inteligente y soporte para escáner de códigos de barras.
*   **Venta de Productos Pesables**: Ingreso flexible por peso o precio con cálculo automático.
*   **Modo Offline Resiliente**: Capacidad de continuar operando sin conexión mediante persistencia local y sincronización diferida.

### 📦 Inventario y Producción
*   **Control de Stock**: Gestión de insumos y productos finales con alertas de stock crítico configurables.
*   **Sistema de Recetas**: Fórmulas detalladas con cálculo automático de costos basados en precios de proveedores.
*   **Módulo de Producción**: Registro de panificación que descuenta automáticamente los insumos utilizados de las recetas.

### 📊 Inteligencia de Negocio
*   **Dashboard en Tiempo Real**: Visualización de métricas clave (Ventas del día, Ticket Promedio, Transacciones).
*   **Análisis de Tendencias**: Gráficos interactivos de ventas históricas y ranking de productos más vendidos.
*   **Reportes de Cierre**: Resúmenes detallados por turno para una auditoría sencilla.

---

## 🔒 Seguridad y Robustez

El sistema ha sido diseñado priorizando la integridad de los datos y la seguridad de la información:

*   **Autenticación Centralizada**: Gestión de identidades mediante Supabase Auth con soporte para múltiples roles.
*   **Seguridad a Nivel de Datos (RLS)**: Cada consulta a la base de datos está protegida por políticas de *Row Level Security*, asegurando que el personal solo acceda a la información que le corresponde.
*   **Validación en Servidor**: Todas las operaciones críticas (ventas, ajustes de stock, cierres de caja) se ejecutan mediante *Server Actions*, eliminando la manipulación de datos en el cliente.
*   **Integridad Reforzada**: Uso de funciones de base de datos (RPC) para garantizar transacciones atómicas.
*   **Aceleración por Caché**: Implementación de `"use cache"` de Next.js 16 para una respuesta instantánea y reducción de latencia en el Dashboard y ERP.

---

## 🏗 Stack Tecnológico

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v3.
*   **Gestor de Paquetes**: pnpm 10.x
*   **Componentes UI**: Shadcn/UI para una interfaz moderna y coherente.
*   **Backend & DB**: Supabase (PostgreSQL), Auth SSR y Realtime.
*   **Estado & Datos**: TanStack Query v5, Server Actions y hooks personalizados.

---
## 🚀 Funcionalidades Completas (Versión 1.0)

### 🏪 Sistema ERP Profesional
-   **Interfaz Optimizada**: Diseño limpio y rápido para pantallas táctiles.
-   **Múltiples Métodos de Pago**: Efectivo, Débito, Crédito y Transferencia.
-   **Recargo Automático**: Cálculo automático del 19% IVA para pagos con tarjeta.
-   **Control de Caja**: Gestión de turnos con apertura, cierre y arqueo de efectivo.
-   **Productos Pesables**: Soporte nativo para venta a granel (Pan, Pasteles) con cálculo de precio por peso.
-   **Modo Offline**: Capacidad de seguir vendiendo sin internet (Sincronización automática).

### 📦 Gestión de Inventario Avanzada
-   **Control de Stock**: Seguimiento en tiempo real de insumos y productos terminados.
-   **Unidades de Medida**: Soporte para Kg, Gramos, Litros y Unidades con conversiones inteligentes.
-   **Protección de Datos**: Bloqueo de seguridad para evitar cambios de unidad en productos con ventas históricas.
-   **Alertas de Stock Bajo**: Indicadores visuales para reabastecimiento.
-   **Conversión de Unidades en Recetas**: Cálculo de costos en tiempo real con conversión automática kg↔g y L↔ml. El input de cantidad es estable (soporte para decimales y comas). Los datos de la BD (`factor_conversion`, `unidad_medida_base`) están normalizados.

### 📊 Dashboard y Reportes
-   **Métricas en Vivo**: Ventas diarias, métodos de pago y rendimiento de productos.
-   **Historial de Ventas**: Registro detallado de cada transacción con opción de anulación segura.
-   **Restauración de Stock**: Al anular una venta, el stock se devuelve automáticamente al inventario.
-   **Reportes Financieros (SII)**: Cálculo automático de IVA Débito, IVA Crédito y Utilidad Neta mensual basados en ingresos y gastos con facturas.

### 💳 Control de Gastos Operativos
-   **Registro de Compras**: Gestión de gastos y comprobantes.
-   **Automatización de Ingresos**: Integración automática de gastos al ingresar mercancía de proveedores al inventario.

---

## 🛠️ Stack Tecnológico
-   **Frontend**: Next.js 16, React 19, Tailwind CSS v3, ShadCN UI.
-   **Backend**: Supabase (PostgreSQL + Edge Functions).
-   **Seguridad**: Row Level Security (RLS) y autenticación SSR robusta.
-   **Estado**: Zustand y TanStack Query.

---

## 🛠 Instalación

```bash
# 1. Instalar pnpm (si no lo tienes)
npm install -g pnpm

# 2. Clonar e instalar dependencias
pnpm install

# 3. Configurar variables de entorno (.env)
# Copiar .env.example a .env y completar las llaves

# 4. Iniciar servidor de desarrollo
pnpm dev

# 5. Verificar tipos
pnpm typecheck
```

---

**Version**: 1.2.4 (Unit Conversion Bugfix & Real-time Cost Calculation)  
**Estado**: Estable / Producción  
**Última actualización**: 1 de marzo de 2026 — Corrección crítica de cálculo de costos en recetas (12g de harina ahora cuesta ~$9.6, no $9,600). Se unificó la lógica en `getLineCost` → `convertQuantity`, se migró `cantidad` a `string` en el formulario para soporte real-time y decimales, y se normalizaron los `factor_conversion` en la BD (1000 para kg/L).
