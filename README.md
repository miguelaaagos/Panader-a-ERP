# 🥖 POS Panadería - Sistema de Punto de Venta

> Sistema completo de punto de venta diseñado específicamente para panaderías, con gestión de inventario, ventas, y reportes en tiempo real.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Seguridad](#-seguridad)

---

## ✨ Características

### 🛒 Sistema POS (Punto de Venta) con Gestión de Turno
- ✅ **Interfaz por Pestañas**: Separación clara entre "Venta" (carrito/productos) y "Turno/Caja".
- ✅ **Gestión de Sesiones de Caja**: Apertura, arqueo y cierre centralizado directamente en el POS.
- ✅ **Resumen de Turno**: Visualización en tiempo real de ventas por método de pago y transacciones.
- ✅ **Escaneo de códigos de barras** con listener automático.
- ✅ **Organización por Categorías** (Pestañas laterales).
- ✅ **Búsqueda inteligente** con autocompletado y filtros.
- ✅ **Productos pesables** con ingreso flexible por precio.
- ✅ **Validación de stock** en tiempo real con alertas.
- ✅ **Modo Offline Resiliente**: Cola de ventas local para seguir operando sin internet.
- ✅ **Trazabilidad Total**: Cada venta queda vinculada al ID de sesión de caja (arqueo).

### 📊 Dashboard y Reportes
- ✅ **Métricas en tiempo real**: Ventas hoy, transacciones, ticket promedio
- ✅ **Optimización con Suspense**: Carga no bloqueante con esqueletos (streaming)
- ✅ **Gráficos interactivos**: Tendencias de ventas y productos TOP
- ✅ **Alertas de Stock Crítico**: Basadas en umbrales configurables

### 📦 Gestión de Inventario y Producción
- ✅ **CRUD de Insumos y Productos**: Gestión completa con soft-delete
- ✅ **Sistema de Recetas**: Cálculo automático de costos y márgenes sugeridos
- ✅ **Módulo de Producción**: Registro de panificación con descuento automático de insumos
- ✅ **Costeo de Recetas**: Integración con precios de proveedores

### 👥 Administración
- ✅ **Autenticación robusta**: Manejada vía server actions y Supabase Auth
- ✅ **Perfiles de usuario**: Con roles y permisos definidos (en expansión)
- ✅ **Configuración Global**: Personalización de boletas, moneda y umbrales de stock

---

## 🏗 Arquitectura

### Estructura del Proyecto

```
POS-Panaderia/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Páginas de login y registro
│   ├── dashboard/                # Panel de control principal
│   │   ├── configuracion/        # ✅ Ajustes globales
│   │   ├── inventario/           # ✅ CRUD Insumos y Productos
│   │   ├── pos/                  # ✅ Punto de venta
│   │   ├── produccion/           # ✅ Control de órdenes de producción
│   │   ├── recetas/              # ✅ Gestión de costeo y fórmulas
│   │   ├── usuarios/             # ✅ Gestión de personal
│   │   └── ventas/               # ✅ Historial y analíticas
│   ├── layout.tsx                # Layout raíz
│   └── page.tsx                  # Landing page
├── components/                   # Componentes React
│   ├── dashboard/                # Componentes analíticos y layouts
│   ├── pos/                      # Lógica de ventas y carrito
│   ├── recipes/                  # Componentes de gestión de recetas
│   └── ui/                       # Componentes base (shadcn/ui)
├── actions/                      # Server Actions (Lógica de negocio)
├── hooks/                        # Custom React Hooks
└── lib/                          # Utilidades y Supabase Client
```

---

## 🧠 Síntesis de Sesión: Gestión de Ventas y Arqueo 2.0 (Feb 2026)

Esta sesión transformó el POS de una herramienta de venta simple a un centro de gestión financiera robusto.

## 🚀 Logros Principales

### 1. Reinvención del POS
- **Diseño por Pestañas**: Organización semántica de tareas.
- **Cashier Tab**: Módulo dedicado al control de flujo de caja y ventas recientes del turno.

### 2. Estabilidad y Funcionalidad
- **Fix SQL**: Corrección del RPC `create_sale_v1` para manejar cálculos de `total` en detalles.
- **SaleDetailsModal**: Implementación de vista detallada funcional y libre de errores de carga.
- **Sincronización de Estado**: El POS reacciona dinámicamente al estado de la caja.

### 3. Calidad de Código
- **Tests**: Validación de cálculos críticos en el store del POS.
- **Seguridad**: RLS reforzado para asegurar que los usuarios solo vean datos de su propio tenant.

## 🛠 Estado Técnico
- **Branch**: `main`
- **Database**: RPCs actualizados y esquema verificado (`productos.codigo`).

---

### ✅ Completado (98%)
- [x] Punto de Venta (POS) funcional con soporte multi-pago
- [x] Lógica de ventas atómica mediante Supabase RPC
- [x] Sincronización offline con persistencia local
- **POS con Pestañas**: Nueva interfaz organizada en pestañas ("Venta" y "Turno / Caja") para separar la facturación de la gestión financiera.
- **Gestión de Turnos (Arqueo)**: Control total sobre la apertura y cierre de caja, con balances automáticos por método de pago (Efectivo, Débito, Crédito, Transferencia).
- **Detalle de Ventas**: Visualización completa de cada venta, incluyendo desglose de productos, metadatos de pago y notas del vendedor.
- **Validación Proactiva**: El sistema ahora previene ventas si no existe un turno activo, asegurando la integridad de los reportes.
- **Correcciones Críticas**: Resuelto error en la creación de ventas (constraint en `venta_detalles`) y errores de carga en el historial por desajuste de columnas.
- **PWA y Soporte Offline**: Implementación de Service Workers y cola de sincronización para operar sin conexión estable.
- [x] Gestión de inventario con alertas de stock crítico
- [x] Módulo de recetas con cálculo de costos automático
- [x] Control de producción con trazabilidad de insumos
- [x] Dashboard optimizado con streaming (Suspense)
- [x] Configuración centralizada de empresa

### ⏳ Próximos Pasos
- [ ] Integración con impresoras térmicas
- [ ] Exportación avanzada de reportes a PDF/Excel
- [ ] Auditoría de cambios en inventario

---

## 🚀 Instalación y Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con credenciales de Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Iniciar modo desarrollo
npm run dev
```

---

## 🔒 Seguridad

El sistema utiliza **Supabase Auth** para la gestión de sesiones y **Server Actions** para interactuar con la base de datos, asegurando que toda operación sea validada en el servidor antes de ejecutarse.

---

**Última actualización**: 15 de Febrero, 2026
**Versión**: 0.9.5 (Release Candidate)
