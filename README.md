# 🥖 POS Panadería - Sistema de Punto de Venta

> Sistema completo de punto de venta diseñado específicamente para panaderías, con gestión de inventario, ventas, y reportes en tiempo real.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
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
- [Roadmap](#-roadmap)
- [Seguridad](#-seguridad)

---

## ✨ Características

### 🛒 Sistema POS (Punto de Venta)
- ✅ **Escaneo de códigos de barras** con listener automático
- ✅ **Organización por Categorías** (Pestañas)
- ✅ **Búsqueda inteligente** con autocompletado y filtros
- ✅ **Productos activos/inactivos** (Filtrado automático)
- ✅ **Productos pesables** con ingreso flexible por precio
- ✅ **Validación de stock** en tiempo real con alertas
- ✅ **Carrito de compras** con gestión de estado (Zustand)
- ✅ **Documentos tributarios**: Boleta y Factura
- ✅ **Múltiples métodos de pago**: Efectivo, Débito, Crédito, Transferencia
- ✅ **Datos de facturación**: RUT y Razón Social validados

### 📊 Dashboard y Reportes
- ✅ **Estadísticas en tiempo real**: Ventas hoy, transacciones, inventario
- ✅ **Alerta de Stock Bajo** corregida y verificada
- ✅ **Gráficos interactivos** con Recharts
- ⚠️ **Histórico de ventas** con filtros avanzados (en corrección)
- ⚠️ **Exportación a CSV** (implementado, requiere pruebas)

### 📦 Gestión de Inventario
- ✅ **142 productos** precargados con categorías
- ✅ **Carga masiva** desde Excel/CSV
- ✅ **Indicadores de stock**: OK, Bajo, Sin Stock
- ✅ **Productos pesables vs unitarios**
- ✅ **Vista de inventario** completa con paginación
- ✅ **CRUD de productos**: Crear, Editar, Eliminar, Desactivar
- ✅ **Gestión de categorías**: Crear, Editar, Eliminar, Filtrar
- ✅ **Ajuste rápido de stock**
- ✅ **Filtrado avanzado**: Por categoría, tipo, estado y stock

### 👥 Administración
- ✅ **Autenticación** con Supabase Auth
- ✅ **Perfiles de usuario** (cajeros)
- ⏳ **Gestión de usuarios** (pendiente)
- ⏳ **Roles y permisos** (pendiente)
- ⏳ **Configuración del sistema** (pendiente)

---

## 🛠 Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.1.6 | Framework React con SSR y App Router |
| **React** | 19.0.0 | Librería UI con Server Components |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4.1 | Estilos utility-first |
| **shadcn/ui** | Latest | Componentes UI accesibles |
| **Zustand** | 5.0.11 | Gestión de estado global |
| **Recharts** | 3.7.0 | Gráficos y visualizaciones |
| **Lucide React** | 0.511.0 | Iconos |
| **date-fns** | 4.1.0 | Manipulación de fechas |
| **Sonner** | 2.0.7 | Notificaciones toast |

### Backend y Base de Datos
| Tecnología | Propósito |
|------------|-----------|
| **Supabase** | Backend as a Service (BaaS) |
| **PostgreSQL** | Base de datos relacional |
| **Supabase Auth** | Autenticación y autorización |
| **Supabase Realtime** | Actualizaciones en tiempo real |
| **Row Level Security (RLS)** | Seguridad a nivel de fila |

### DevOps y Herramientas
| Herramienta | Propósito |
|-------------|-----------|
| **Turbopack** | Bundler de desarrollo rápido |
| **ESLint** | Linter de código |
| **PostCSS** | Procesamiento de CSS |
| **Autoprefixer** | Prefijos CSS automáticos |

---

## 🏗 Arquitectura

### Estructura del Proyecto

```
POS-Panaderia/
├── app/                          # Next.js App Router
│   ├── auth/                     # Páginas de autenticación
│   │   ├── login/
│   │   └── signup/
│   ├── protected/                # Rutas protegidas
│   │   ├── dashboard/            # ✅ Dashboard principal
│   │   ├── pos/                  # ✅ Punto de venta
│   │   ├── ventas/               # ⚠️ Histórico de ventas
│   │   ├── inventario/           # ⚠️ Gestión de inventario
│   │   ├── usuarios/             # ⏳ Admin de usuarios
│   │   └── config/               # ⏳ Configuración
│   ├── layout.tsx                # Layout raíz
│   └── page.tsx                  # Página de inicio
├── components/                   # Componentes React
│   ├── pos/                      # Componentes del POS
│   │   ├── BarcodeListener.tsx   # Listener de códigos
│   │   ├── ProductSearch.tsx     # Búsqueda de productos
│   │   ├── Cart.tsx              # Carrito de compras
│   │   ├── PaymentDialog.tsx     # Diálogo de pago
│   │   └── Sidebar.tsx           # Navegación lateral
│   └── ui/                       # Componentes shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── calendar.tsx          # ⚠️ Requiere corrección
├── hooks/                        # Custom React Hooks
│   └── use-pos-store.ts          # ✅ Store de Zustand para POS
├── lib/                          # Utilidades y configuración
│   ├── supabase/                 # Cliente de Supabase
│   │   ├── client.ts             # Cliente para componentes
│   │   ├── server.ts             # Cliente para Server Components
│   │   └── middleware.ts         # Middleware de autenticación
│   └── utils.ts                  # Funciones auxiliares
├── scripts/                      # Scripts SQL y Python
│   ├── normalizar_precios_reales.sql
│   ├── diagnostico_precios_stock.sql
│   └── generar_sql.py
└── public/                       # Archivos estáticos
```

### Base de Datos (Supabase/PostgreSQL)

#### Esquema de Tablas

```sql
-- Tabla de Categorías
categorias (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP
)

-- Tabla de Productos
productos (
  id UUID PRIMARY KEY,
  codigo_barras TEXT UNIQUE,
  nombre TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  precio_costo NUMERIC(10,2),
  precio_venta NUMERIC(10,2),
  margen_porcentaje NUMERIC(5,4),
  tasa_impuesto NUMERIC(5,4),
  es_pesable BOOLEAN DEFAULT false,
  stock_cantidad NUMERIC(10,3),
  stock_minimo NUMERIC(10,3),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tabla de Ventas
ventas (
  id UUID PRIMARY KEY,
  perfil_id UUID REFERENCES perfiles(id),
  total NUMERIC(10,2),
  metodo_pago TEXT,
  tipo_documento TEXT,
  cliente_rut TEXT,
  cliente_razon_social TEXT,
  anulada BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

-- Tabla de Detalle de Ventas
detalle_ventas (
  id UUID PRIMARY KEY,
  venta_id UUID REFERENCES ventas(id),
  producto_id UUID REFERENCES productos(id),
  cantidad NUMERIC(10,3),
  precio_unitario NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  created_at TIMESTAMP
)

-- Tabla de Perfiles de Usuario
perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre_completo TEXT,
  rol TEXT DEFAULT 'cajero',
  created_at TIMESTAMP
)
```

#### Datos Actuales
- **Productos**: 142 productos cargados
- **Categorías**: 8 categorías (Panes, Dulces, Bebidas, etc.)
- **Precios**: Rango $500 - $96,000 CLP
- **Stock**: Configurado para productos unitarios

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 20.x o superior
- npm o pnpm
- Cuenta de Supabase (gratuita)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd "POS Panadería Software"
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

4. **Ejecutar migraciones de base de datos**
- Ir a Supabase Dashboard > SQL Editor
- Ejecutar los scripts en orden:
  1. `schema.sql` (crear tablas)
  2. `carga_productos_completa.sql` (cargar productos)
  3. `normalizar_precios_reales.sql` (opcional: normalizar precios)

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

6. **Abrir en navegador**
```
http://localhost:3000
```

---

## ⚙️ Configuración

### Supabase Setup

#### 1. Crear Proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar URL y Anon Key

#### 2. Configurar Autenticación
- **Email/Password**: Habilitado por defecto
- **Confirmación de email**: Opcional (desactivar para desarrollo)

#### 3. Row Level Security (RLS)
⚠️ **Actualmente desactivado** para troubleshooting.

Para producción, habilitar RLS:
```sql
-- Ejecutar en SQL Editor
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas (ver fix_rls_completo.sql)
```

#### 4. Realtime (Opcional)
Para actualizaciones en tiempo real:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE productos;
ALTER PUBLICATION supabase_realtime ADD TABLE ventas;
```

---

## 📊 Estado del Proyecto

### ✅ Completado (80%)

#### Frontend
- [x] Estructura base con Next.js 16 App Router
- [x] Componentes UI con shadcn/ui
- [x] Sistema de autenticación
- [x] Layout y navegación
- [x] POS completo con todas las funcionalidades
- [x] Dashboard con estadísticas
- [x] Gestión de estado con Zustand
- [x] Responsive design

#### Backend
- [x] Configuración de Supabase
- [x] Esquema de base de datos
- [x] 142 productos cargados
- [x] Categorías configuradas
- [x] Queries optimizadas
- [x] Triggers y funciones (básicas)

#### Seguridad
- [x] Autenticación con Supabase Auth
- [x] Middleware de protección de rutas
- [x] Validación de formularios
- [ ] RLS habilitado (desactivado temporalmente)
- [ ] Políticas de seguridad completas

### ⚠️ En Progreso (20%)

- [ ] Histórico de ventas (componente Calendar con error)
- [ ] Normalización de precios en BD
- [ ] Pruebas de integración
- [ ] Implementación final de RLS en producción

### ⏳ Pendiente (5%)

#### Frontend
- [ ] Página de gestión de usuarios
- [ ] Página de configuración
- [ ] Reportes por período avanzados
- [ ] Impresión de tickets de venta
- [ ] Modo offline

#### Backend
- [ ] Políticas RLS completas
- [ ] Funciones de negocio avanzadas
- [ ] Triggers para auditoría
- [ ] Backup automático
- [ ] Optimización de queries

#### Seguridad
- [ ] Habilitar RLS en producción
- [ ] Implementar roles granulares
- [ ] Auditoría de acciones
- [ ] Rate limiting
- [ ] Validación de datos del lado del servidor

---

## 🗺 Roadmap

### Fase 1: Estabilización (Actual)
- [ ] Corregir errores de compilación
- [ ] Verificar todas las rutas funcionan
- [ ] Ejecutar normalización de precios
- [ ] Pruebas de flujo completo de venta
- [ ] Documentación completa

### Fase 2: Funcionalidades Core
- [ ] CRUD completo de productos
- [ ] Gestión de usuarios y roles
- [ ] Reportes avanzados
- [ ] Impresión de tickets
- [ ] Backup y restauración

### Fase 3: Optimización
- [ ] Habilitar RLS
- [ ] Optimización de rendimiento
- [ ] Modo offline con PWA
- [ ] Sincronización automática
- [ ] Analytics y métricas

### Fase 4: Características Avanzadas
- [ ] Integración con sistemas contables
- [ ] API REST para integraciones
- [ ] App móvil para inventario
- [ ] Sistema de fidelización
- [ ] Predicción de stock con ML

---

## 🔒 Seguridad

### Autenticación
- ✅ Supabase Auth con email/password
- ✅ Sesiones seguras con JWT
- ✅ Middleware de protección de rutas
- ⏳ 2FA (pendiente)

### Autorización
- ✅ Rutas protegidas con middleware
- ⚠️ RLS desactivado (temporal)
- ⏳ Roles granulares (pendiente)
- ⏳ Permisos por funcionalidad (pendiente)

### Datos
- ✅ Validación en frontend
- ⏳ Validación en backend (pendiente)
- ⏳ Sanitización de inputs (pendiente)
- ⏳ Encriptación de datos sensibles (pendiente)

### Mejores Prácticas
- ✅ Variables de entorno para secretos
- ✅ HTTPS en producción (Vercel/Supabase)
- ⏳ Rate limiting (pendiente)
- ⏳ Logging de seguridad (pendiente)

---

## 🐛 Problemas Conocidos

### Críticos
1. **Calendar Component** - Incompatibilidad con react-day-picker v8
   - **Ubicación**: `components/ui/calendar.tsx`
   - **Impacto**: Página de ventas no carga
   - **Estado**: En corrección

### Menores
2. **Precios en BD** - Valores no normalizados
   - **Solución**: Ejecutar `normalizar_precios_reales.sql`
   - **Estado**: Script listo, pendiente ejecución

3. **RLS Desactivado** - Seguridad reducida
   - **Solución**: Ejecutar `fix_rls_completo.sql`
   - **Estado**: Solo para producción

---

## 📝 Scripts Útiles

### Desarrollo
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter
```

### Base de Datos
```bash
# Ejecutar en Supabase SQL Editor
-- Ver productos con precios sospechosos
\i diagnostico_precios_stock.sql

-- Normalizar todos los precios
\i normalizar_precios_reales.sql

-- Habilitar RLS (solo producción)
\i fix_rls_completo.sql
```

---

## 👥 Contribución

Este es un proyecto privado. Para contribuir:

1. Crear un branch desde `main`
2. Hacer cambios y commit
3. Crear Pull Request
4. Esperar revisión

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar la documentación en `/docs`
2. Consultar artifacts en `.gemini/antigravity/brain/`
3. Contactar al equipo de desarrollo

---

## 📅 Historial de Actualizaciones (Sesión Reciente)

### Febrero 2026 - Sprint de Estabilización y Features
1. **Inventario Completo**:
   - Se implementó gestión completa (CRUD) de productos y categorías.
   - Sistema de "Soft Delete" (Activo/Inactivo) para preservar historial de ventas.
   - Filtros avanzados por categoría, stock y estado.

2. **Mejoras en POS**:
   - Organización visual por categorías (Pestañas).
   - Filtrado automático de productos inactivos y sin stock.

3. **Correcciones Críticas**:
   - **Dashboard**: Alerta de stock bajo ahora usa lógica real (`stock <= min`).
   - **Base de Datos**: Corrección de relaciones y tipos de datos.

---


## 📚 Documentación Adicional

- [System Health Check](file:///.gemini/antigravity/brain/20880502-902a-4438-b92e-8fc7b154630e/system_health_check.md)
- [Task List](file:///.gemini/antigravity/brain/20880502-902a-4438-b92e-8fc7b154630e/task.md)
- [Implementation Plan](file:///.gemini/antigravity/brain/20880502-902a-4438-b92e-8fc7b154630e/implementation_plan.md)
- [Walkthrough](file:///.gemini/antigravity/brain/20880502-902a-4438-b92e-8fc7b154630e/walkthrough.md)

---

**Última actualización**: 2026-02-06
**Versión**: 0.8.0 (Beta)
**Estado**: En desarrollo activo
