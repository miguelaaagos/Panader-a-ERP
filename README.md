# 🥖 POS Panadería - Sistema de Punto de Venta

> Sistema integral de gestión y punto de venta diseñado para optimizar la operación diaria de panaderías y pastelerías, con control total de inventario, producción y flujo de caja en tiempo real.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

---

## 📋 Funcionalidades Principales

### 🛒 Centro de Ventas (POS)
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
*   **Integridad Reforzada**: Uso de funciones de base de datos (RPC) para garantizar transacciones atómicas y prevenir inconsistencias financieras.

---

## 🏗 Stack Tecnológico

*   **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
*   **Componentes UI**: Shadcn/UI para una interfaz moderna y coherente.
*   **Backend & DB**: Supabase (PostgreSQL), Auth y Realtime.
*   **Estado & Datos**: Server Actions y hooks personalizados para una sincronización eficiente.

---

## 🚀 Hitos Recientes (Febrero 2026)

*   ✅ **Módulo de Historial de Turnos**: Implementación de vista histórica con detalle de ventas para auditorías post-cierre.
*   ✅ **Refactorización de Estabilidad**: Migración completa a tipos estrictos en el POS para eliminar errores de ejecución.
*   ✅ **Optimización de Carga**: Implementación de Streaming y Suspense para una interfaz más fluida.
*   ✅ **Mejora en Gestión Financiera**: Soporte multi-pago (Efectivo, Débito, Crédito, Transferencia) con arqueo diferenciado.

---

## 🛠 Instalación

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno (.env)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# 3. Iniciar servidor de desarrollo
npm run dev
```

---

**Versión**: 0.9.8 (Release Candidate)  
**Estado**: Estable / En optimización final  
**Última actualización**: 15 de febrero de 2026
