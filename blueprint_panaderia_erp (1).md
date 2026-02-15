# BLUEPRINT: SISTEMA ERP PARA PANADERÍA
## Proyecto: Sistema de gestión integral para panadería/pastelería

---

## 🎯 OBJETIVO DEL PROYECTO

Desarrollar un sistema ERP completo para una panadería que permita:
- Gestionar inventario de ingredientes y productos terminados
- Crear y costear recetas con cálculo automático de márgenes
- Controlar órdenes de producción que transformen ingredientes en productos
- Registrar ventas mediante un POS intuitivo
- Generar análisis de ventas, costos y rentabilidad
- Control de acceso por roles (Administrador y Cajero)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Frontend**: Next.js 15 con App Router, React 19, TypeScript
- **Framework**: Refine (para operaciones CRUD automáticas)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security + Auth)
- **Gráficos**: Recharts para análisis y dashboards
- **Validación**: Zod + React Hook Form

### Estructura del Proyecto
Monolito modular con separación clara por dominios de negocio:
- `/app/(auth)` - Rutas de autenticación
- `/app/(dashboard)` - Rutas protegidas del sistema
- `/modules/ventas` - Lógica de ventas
- `/modules/productos` - Gestión de productos e ingredientes
- `/modules/recetas` - Sistema de recetas y costeo
- `/modules/produccion` - Órdenes de producción
- `/modules/analytics` - Reportes y análisis

---

## 📊 MODELO DE DATOS

### 1. TABLA: tenants (Multi-tenant)
**Propósito**: Soportar múltiples panaderías en el mismo sistema

**Campos**:
- `id` (UUID, primary key)
- `nombre` (texto, requerido) - Nombre de la panadería
- `rut` (texto, único, opcional) - RUT de la empresa
- `direccion` (texto)
- `telefono` (texto)
- `email` (texto)
- `logo_url` (texto) - URL del logo
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Notas**: 
- Sistema multi-tenant para que en el futuro puedas vender a otras panaderías
- Cada registro es una panadería diferente

---

### 2. TABLA: usuarios
**Propósito**: Usuarios del sistema con roles específicos

**Campos**:
- `id` (UUID, referencia a auth.users de Supabase)
- `tenant_id` (UUID, referencia a tenants) - A qué panadería pertenece
- `nombre_completo` (texto, requerido)
- `email` (texto, requerido)
- `rol` (enum, requerido) - Valores: 'admin' o 'cajero'
- `activo` (boolean, default true) - Para deshabilitar usuarios
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relaciones**:
- Pertenece a UN tenant (muchos usuarios → un tenant)
- Unique constraint en (tenant_id, email) - No emails duplicados por tenant

**Permisos por Rol**:

**Administrador**:
- ✅ Gestionar usuarios (crear, editar, deshabilitar cajeros)
- ✅ Gestionar productos e ingredientes (CRUD completo)
- ✅ Crear y modificar recetas
- ✅ Crear órdenes de producción
- ✅ Completar órdenes de producción (restar inventario)
- ✅ Realizar ventas
- ✅ Ver todas las ventas del sistema
- ✅ Ajustar inventario manualmente
- ✅ Ver reportes y analytics completos
- ✅ Configurar categorías y unidades de medida

**Cajero**:
- ✅ Realizar ventas (acceso al POS)
- ✅ Ver solo SUS PROPIAS ventas
- ❌ NO puede ver recetas
- ❌ NO puede modificar inventario
- ❌ NO puede crear productos
- ❌ NO puede ver producción
- ❌ NO puede ver analytics completos (solo su rendimiento)
- ❌ NO puede gestionar usuarios

---

### 3. TABLA: productos
**Propósito**: Inventario unificado que contiene TANTO ingredientes como productos terminados

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `nombre` (texto, requerido) - Ej: "Harina", "Torta de Frambuesa"
- `codigo` (texto, único) - SKU o código interno
- `descripcion` (texto, opcional)
- `tipo` (enum, requerido) - Valores: 'ingrediente', 'producto_terminado', 'ambos'
  - 'ingrediente': Solo materia prima (harina, azúcar, huevos)
  - 'producto_terminado': Solo se vende, no se usa en recetas (torta empaquetada)
  - 'ambos': Se vende Y se usa en recetas (frambuesas frescas por kilo)
- `categoria` (texto) - Ej: "Harinas", "Lácteos", "Tortas", "Panes"
- `unidad_medida` (enum, requerido) - Valores: 'kg', 'g', 'L', 'ml', 'unidades'
- `stock_actual` (decimal, 3 decimales) - Stock disponible en bodega
- `stock_minimo` (decimal, 3 decimales) - Para alertas de stock bajo
- `costo_unitario` (decimal, 2 decimales) - Costo si lo COMPRAS (para ingredientes)
- `precio_venta` (decimal, 2 decimales) - Precio al que lo VENDES
- `margen_deseado` (decimal, 2 decimales) - % de margen que quieres (ej: 45.00)
- `tiene_receta` (boolean) - TRUE si es un producto con receta
- `costo_receta` (decimal, 2 decimales) - CALCULADO: costo desde la receta
- `precio_sugerido` (decimal, 2 decimales) - CALCULADO: precio con margen deseado
- `imagen_url` (texto, opcional)
- `activo` (boolean, default true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relaciones**:
- Pertenece a UN tenant
- Puede ser referenciado por receta_ingredientes (como ingrediente)
- Puede tener UNA receta (tabla recetas)

**Índices importantes**:
- Por tipo (para filtrar ingredientes vs productos)
- Por código (para búsquedas rápidas)
- Por tenant_id + activo

**Lógica de Negocio**:
- Si `tiene_receta = true` → `costo_receta` y `precio_sugerido` se calculan automáticamente
- Si `tiene_receta = false` → usuario define `costo_unitario` y `precio_venta` manualmente
- Stock se modifica SOLO en 3 momentos:
  1. Ajuste manual (admin agrega compras)
  2. Producción completada (resta ingredientes, suma productos)
  3. Venta (resta productos terminados)

---

### 4. TABLA: recetas
**Propósito**: Define CÓMO se hace un producto (solo información, NO afecta inventario)

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `producto_id` (UUID, referencia a productos) - QUÉ producto produces
- `nombre` (texto, requerido) - Ej: "Torta de Frambuesa Clásica"
- `descripcion` (texto, opcional)
- `instrucciones` (texto largo, opcional) - Pasos para hacer la receta
- `rendimiento` (decimal, 2 decimales, requerido) - Cuántas unidades produce esta receta
  - Ej: 1 (produce 1 torta), 12 (produce 12 panes), 8 (produce 8 porciones)
- `costo_total` (decimal, 2 decimales) - CALCULADO: suma de todos los ingredientes
- `costo_por_unidad` (decimal, 2 decimales) - CALCULADO: costo_total / rendimiento
- `tiempo_preparacion_minutos` (entero, opcional)
- `activa` (boolean, default true)
- `version` (entero, default 1) - Para versionamiento de recetas
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relaciones**:
- Pertenece a UN tenant
- Pertenece a UN producto (one-to-one)
- Tiene MUCHOS ingredientes (tabla receta_ingredientes)

**Unique constraint**: (tenant_id, producto_id) - Un producto solo puede tener UNA receta activa

**Lógica de Negocio**:
- Al agregar/modificar/eliminar ingredientes → recalcular `costo_total` y `costo_por_unidad`
- Al cambiar `costo_unitario` de un ingrediente → recalcular TODAS las recetas que lo usan
- Actualizar automáticamente `costo_receta` y `precio_sugerido` en la tabla productos

---

### 5. TABLA: receta_ingredientes
**Propósito**: Lista de ingredientes necesarios para cada receta

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `receta_id` (UUID, referencia a recetas)
- `ingrediente_id` (UUID, referencia a productos donde tipo = 'ingrediente' o 'ambos')
- `cantidad` (decimal, 3 decimales, requerido) - Cantidad en la unidad_medida del ingrediente
  - Ej: 0.5 (si la unidad es kg), 4 (si la unidad es unidades)
- `costo_linea` (decimal, 2 decimales) - CALCULADO: cantidad × costo_unitario del ingrediente
- `notas` (texto, opcional) - Notas específicas sobre este ingrediente
- `orden` (entero, default 0) - Para ordenar ingredientes en la UI
- `created_at` (timestamp)

**Relaciones**:
- Pertenece a UNA receta
- Referencia a UN producto (ingrediente)

**Unique constraint**: (receta_id, ingrediente_id) - No puedes agregar el mismo ingrediente 2 veces

**Lógica de Negocio**:
- Al insertar/actualizar → calcular `costo_linea` automáticamente
- Al insertar/actualizar/eliminar → disparar recálculo de la receta padre
- Validar que el producto referenciado sea tipo 'ingrediente' o 'ambos'

**Cálculos automáticos**:
```
costo_linea = cantidad × productos.costo_unitario

Luego:
recetas.costo_total = SUM(costo_linea) de todos los ingredientes
recetas.costo_por_unidad = costo_total / rendimiento

Luego:
productos.costo_receta = recetas.costo_por_unidad
productos.precio_sugerido = costo_receta / (1 - margen_deseado/100)
```

---

### 6. TABLA: ordenes_produccion
**Propósito**: ⭐ REGISTRO CRÍTICO donde REALMENTE se transforma inventario

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `numero_orden` (texto, requerido) - Número correlativo: "OP-001", "OP-002"
- `fecha_creacion` (timestamp, default now)
- `fecha_programada` (fecha, opcional) - Cuándo planeas producir
- `fecha_completada` (timestamp, nullable) - Cuándo realmente completaste
- `receta_id` (UUID, referencia a recetas) - QUÉ receta usas
- `producto_id` (UUID, referencia a productos) - QUÉ producto produces
- `cantidad_a_producir` (decimal, 2 decimales, requerido) - Cuántas unidades planeas
- `cantidad_producida` (decimal, 2 decimales) - Cuántas REALMENTE hiciste
- `costo_ingredientes` (decimal, 2 decimales) - Snapshot del costo al producir
- `estado` (enum, requerido) - Valores: 'pendiente', 'en_proceso', 'completada', 'cancelada'
- `notas` (texto, opcional)
- `usuario_id` (UUID, referencia a usuarios) - Quién creó la orden
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relaciones**:
- Pertenece a UN tenant
- Referencia a UNA receta
- Referencia a UN producto
- Creada por UN usuario

**Unique constraint**: (tenant_id, numero_orden)

**Estados del flujo**:
1. `pendiente`: Orden creada, no ha pasado nada (inventario sin cambios)
2. `en_proceso`: Opcional, puedes marcarlo cuando empiezas a hacer
3. `completada`: ⭐ AQUÍ OCURRE LA MAGIA (se resta inventario)
4. `cancelada`: Orden cancelada (no afecta inventario)

**Lógica de Negocio CRÍTICA**:

**Al cambiar estado a 'completada'**:
1. RESTAR ingredientes del inventario:
   ```
   Para cada ingrediente en la receta:
     productos.stock_actual -= (cantidad_ingrediente × cantidad_producida)
   ```

2. SUMAR producto terminado al inventario:
   ```
   productos.stock_actual += cantidad_producida
   ```

3. GUARDAR snapshot del costo:
   ```
   costo_ingredientes = recetas.costo_por_unidad × cantidad_producida
   ```

4. REGISTRAR timestamp:
   ```
   fecha_completada = NOW()
   ```

**Validaciones ANTES de completar**:
- Verificar que hay stock suficiente de TODOS los ingredientes
- Si falta algún ingrediente → mostrar error específico
- Si cantidad_producida no está definida → usar cantidad_a_producir

**Ejemplo del flujo**:
```
Admin crea orden:
  - Receta: Torta de Frambuesa
  - Cantidad a producir: 2 tortas
  - Estado: 'pendiente'
  → Inventario NO cambia

Luego, cuando realmente hizo las tortas:
  Admin marca como 'completada'
  → Sistema AUTOMÁTICAMENTE:
    - Resta harina: 1 kg
    - Resta azúcar: 0.6 kg
    - Resta mantequilla: 0.4 kg
    - Resta huevos: 8 unidades
    - Resta frambuesas: 0.6 kg
    - Suma tortas: +2 unidades
```

---

### 7. TABLA: ventas
**Propósito**: Registro de transacciones de venta (cabecera)

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `numero_venta` (texto, requerido) - Número correlativo: "V-001", "V-002"
- `fecha` (timestamp, default now)
- `cliente_nombre` (texto, opcional) - Nombre del cliente si se registra
- `cliente_rut` (texto, opcional) - RUT del cliente si se registra
- `subtotal` (decimal, 2 decimales) - Suma de líneas antes de descuento
- `descuento` (decimal, 2 decimales, default 0) - Descuento aplicado
- `total` (decimal, 2 decimales, requerido) - Total final
- `metodo_pago` (enum) - Valores: 'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'
- `estado` (enum, default 'completada') - Valores: 'completada', 'anulada'
- `usuario_id` (UUID, referencia a usuarios) - Cajero o admin que hizo la venta
- `notas` (texto, opcional)
- `created_at` (timestamp)

**Relaciones**:
- Pertenece a UN tenant
- Realizada por UN usuario
- Tiene MUCHOS detalles (tabla venta_detalles)

**Unique constraint**: (tenant_id, numero_venta)

**Lógica de Negocio**:
- Al crear venta con estado 'completada' → restar stock de productos
- Si estado cambia a 'anulada' → devolver stock (funcionalidad admin)
- Número de venta debe ser autoincremental por tenant

**Permisos de acceso**:
- Admin: Ve TODAS las ventas del tenant
- Cajero: Ve SOLO sus propias ventas (WHERE usuario_id = auth.uid())

---

### 8. TABLA: venta_detalles
**Propósito**: Líneas de productos vendidos en cada venta

**Campos**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, referencia a tenants)
- `venta_id` (UUID, referencia a ventas)
- `producto_id` (UUID, referencia a productos)
- `cantidad` (decimal, 2 decimales, requerido)
- `precio_unitario` (decimal, 2 decimales, requerido) - Precio al momento de venta
- `subtotal` (decimal, 2 decimales, requerido) - cantidad × precio_unitario
- `descuento` (decimal, 2 decimales, default 0) - Descuento en esta línea
- `total` (decimal, 2 decimales, requerido) - subtotal - descuento
- `costo_unitario` (decimal, 2 decimales) - Snapshot del costo para calcular ganancia real
- `created_at` (timestamp)

**Relaciones**:
- Pertenece a UNA venta
- Referencia a UN producto

**Lógica de Negocio**:

**Al insertar detalle (si venta está 'completada')**:
1. RESTAR stock:
   ```
   productos.stock_actual -= cantidad
   ```

2. GUARDAR snapshot del costo:
   ```
   costo_unitario = COALESCE(productos.costo_receta, productos.costo_unitario, 0)
   ```

**Cálculos para analytics**:
```
Ganancia por línea = (precio_unitario - costo_unitario) × cantidad
Margen real % = ((precio_unitario - costo_unitario) / precio_unitario) × 100
```

**Validación ANTES de vender**:
- Verificar que productos.stock_actual >= cantidad
- Si no hay stock → mostrar error

---

## 🔐 SEGURIDAD Y ROW LEVEL SECURITY (RLS)

### Reglas de RLS por Tabla

**Principio general**: TODAS las tablas tienen `tenant_id` y SOLO se pueden ver/modificar registros del tenant del usuario autenticado

### Políticas RLS:

**usuarios**:
- SELECT: Todos los usuarios autenticados pueden ver usuarios de su tenant
- INSERT: Solo admins pueden crear usuarios
- UPDATE: Solo admins pueden modificar usuarios
- DELETE: Solo admins pueden eliminar usuarios

**productos**:
- SELECT: Admin y Cajero pueden ver
- INSERT/UPDATE/DELETE: Solo Admin

**recetas y receta_ingredientes**:
- SELECT: Solo Admin (cajeros NO ven recetas)
- INSERT/UPDATE/DELETE: Solo Admin

**ordenes_produccion**:
- SELECT: Solo Admin
- INSERT/UPDATE/DELETE: Solo Admin

**ventas**:
- SELECT: 
  - Admin: Todas las ventas del tenant
  - Cajero: Solo SUS ventas (WHERE usuario_id = auth.uid())
- INSERT: Admin y Cajero
- UPDATE: Solo Admin (para anular ventas)
- DELETE: Nadie (no se borran ventas, se anulan)

**venta_detalles**:
- SELECT: 
  - Admin: Todos los detalles
  - Cajero: Solo detalles de SUS ventas
- INSERT: Admin y Cajero
- UPDATE/DELETE: Nadie

### Función Helper para RLS:
```
Crear función: get_user_tenant_id()
  Retorna: tenant_id del usuario actual desde auth.uid()
  
Crear función: get_user_rol()
  Retorna: rol del usuario actual desde auth.uid()
  
Crear función: is_admin()
  Retorna: true si get_user_rol() = 'admin'
```

---

## 🎨 MÓDULOS DE LA APLICACIÓN

### 1. Módulo de Autenticación
**Rutas**: `/login`, `/register`

**Funcionalidades**:
- Login con email y contraseña
- Registro de nuevo usuario (solo Admin puede aprobar)
- Recuperación de contraseña
- Logout

**UI**: Pantalla simple y limpia con logo de la panadería

---

### 2. Módulo de Dashboard Principal
**Ruta**: `/dashboard`

**Vista Admin**:
- KPIs principales:
  - Total ventas del día
  - Productos más vendidos hoy
  - Alertas de stock bajo (ingredientes)
  - Órdenes de producción pendientes
- Gráfico de ventas últimos 7 días
- Acceso rápido a módulos principales

**Vista Cajero**:
- KPIs personales:
  - Mis ventas del día
  - Mi ticket promedio
  - Cantidad de transacciones realizadas
- Botón prominente "Nueva Venta" (POS)

---

### 3. Módulo de Productos/Inventario
**Ruta**: `/dashboard/inventario`

**Solo Admin tiene acceso**

**Funcionalidades**:
- **Listado de productos e ingredientes**:
  - Tabla con filtros por tipo (ingrediente/producto/ambos)
  - Columnas: Código, Nombre, Categoría, Stock actual, Unidad, Costo, Precio venta
  - Búsqueda por nombre o código
  - Badges visuales de estado de stock (OK, Bajo, Sin stock)

- **Crear/Editar producto o ingrediente**:
  - Formulario con campos según tipo
  - Si es ingrediente:
    - Nombre, código, categoría
    - Stock actual, stock mínimo, unidad de medida
    - Costo unitario (cuánto pagaste)
    - Puede tener precio de venta si tipo = 'ambos'
  - Si es producto terminado:
    - Nombre, código, categoría
    - Stock actual (readonly si tiene receta, se suma desde producción)
    - Margen deseado (%)
    - Checkbox: "Tiene receta"
    - Si NO tiene receta → pedir costo_unitario y precio_venta manual
    - Si tiene receta → mostrar costo_receta y precio_sugerido (readonly)

- **Ajustar stock manualmente**:
  - Modal para agregar o restar stock
  - Tipo de ajuste: "Compra", "Merma", "Corrección", "Otro"
  - Cantidad (positiva o negativa)
  - Notas obligatorias

- **Ver alertas de stock bajo**:
  - Vista filtrada de ingredientes donde stock_actual <= stock_minimo
  - Mostrar cantidad sugerida a comprar
  - Botón "Ajustar stock" directo

**UI**: Tabla moderna con shadcn/ui Table, filtros superiores, botón "Nuevo producto" destacado

---

### 4. Módulo de Recetas ⭐ (MÁS COMPLEJO)
**Ruta**: `/dashboard/recetas`

**Solo Admin tiene acceso**

**Funcionalidades**:

**Listado de recetas**:
- Tabla mostrando:
  - Nombre receta
  - Producto que produce
  - Rendimiento
  - Costo total
  - Costo por unidad
  - Acciones (Ver, Editar, Duplicar)

**Crear/Editar receta** (pantalla compleja):

**Sección 1: Información básica**
- Seleccionar producto (dropdown de productos tipo 'producto_terminado' con tiene_receta = false)
- Nombre de la receta
- Descripción
- Rendimiento (número) + unidad (del producto)
- Tiempo de preparación (minutos)

**Sección 2: Ingredientes** (tabla editable)
- Buscador de ingredientes (autocomplete de productos tipo 'ingrediente' o 'ambos')
- Al seleccionar ingrediente → agregar fila con:
  - Nombre ingrediente (readonly)
  - Cantidad (input numérico)
  - Unidad (readonly, del ingrediente)
  - Costo unitario (readonly, del ingrediente)
  - Costo línea (readonly, CALCULADO: cantidad × costo_unitario)
  - Botón eliminar
- Total de ingredientes dinámico en tiempo real

**Sección 3: Cálculo de costos** (panel lateral o inferior)
Mostrar EN TIEMPO REAL mientras editas:
```
💰 Costo total de ingredientes: $4,570
📦 Rendimiento: 1 unidad
💵 Costo por unidad: $4,570

🎯 Margen deseado: 45%
💰 Precio sugerido: $8,309
```

- Input: Margen deseado (%)
- Calculadora: "¿A cuánto debería vender?"
  - Input: Precio de venta deseado
  - Output: Margen resultante

**Sección 4: Instrucciones** (opcional)
- Editor de texto rico para pasos de la receta

**Botón "Guardar receta"**:
- Validar que hay al menos 1 ingrediente
- Validar que todos los ingredientes tienen cantidad > 0
- Guardar receta + ingredientes
- Actualizar automáticamente el producto con costo_receta y precio_sugerido

**Funcionalidades extras**:
- **Duplicar receta**: Crear versión 2 de una receta existente
- **Comparar recetas**: Ver 2 versiones lado a lado con diferencias de costo
- **Simular cambios**: "¿Qué pasa si cambio harina por cantidad X?"

**UI**: Formulario multi-sección con tabs o pasos, cálculos en tiempo real muy visibles

---

### 5. Módulo de Producción
**Ruta**: `/dashboard/produccion`

**Solo Admin tiene acceso**

**Funcionalidades**:

**Listado de órdenes de producción**:
- Tabla con columnas:
  - Número orden
  - Fecha programada
  - Producto
  - Cantidad a producir
  - Estado (badge con color)
  - Fecha completada
  - Acciones
- Filtros por estado y fecha

**Crear nueva orden**:
1. Seleccionar receta (dropdown de recetas activas)
2. Cantidad a producir (input numérico)
3. Fecha programada (datepicker, opcional)
4. **VALIDACIÓN CRÍTICA**: Antes de crear, verificar stock:
   ```
   ⚠️ Verificación de ingredientes:
   ✓ Harina: 49 kg disponibles (necesitas 1 kg) ✓
   ✓ Azúcar: 29.4 kg disponibles (necesitas 0.6 kg) ✓
   ✓ Mantequilla: 9.6 kg disponibles (necesitas 0.4 kg) ✓
   ✗ Frambuesas: 0.2 kg disponibles (necesitas 0.6 kg) ✗
   
   ❌ No puedes producir. Te faltan 0.4 kg de frambuesas.
   ```
5. Si hay stock suficiente → crear orden con estado 'pendiente'

**Ver/Editar orden pendiente**:
- Ver detalle de ingredientes necesarios
- Editar cantidad a producir (recalcula ingredientes)
- Cambiar fecha programada
- Cancelar orden

**Completar orden** (acción crítica):
1. Botón "Marcar como completada"
2. Modal de confirmación:
   ```
   ⚠️ CONFIRMAR PRODUCCIÓN
   
   ¿Confirmas que YA PRODUJISTE estos productos?
   
   Se restarán los siguientes ingredientes:
   - Harina: 1 kg
   - Azúcar: 0.6 kg
   - Mantequilla: 0.4 kg
   - Huevos: 8 unidades
   - Frambuesas: 0.6 kg
   
   Se agregarán al inventario:
   + Torta de Frambuesa: 2 unidades
   
   Esta acción NO se puede deshacer.
   
   [Cancelar] [SÍ, COMPLETAR PRODUCCIÓN]
   ```
3. Al confirmar → cambiar estado a 'completada' → trigger hace el resto

**Opción de producción parcial**:
- Campo adicional: "Cantidad realmente producida"
- Si planeaste 5 pero solo hiciste 3 → poner 3
- Sistema resta ingredientes solo por las 3

**UI**: Tabla con badges de estado, modal de confirmación muy claro para completar

---

### 6. Módulo de Ventas (POS)
**Ruta**: `/dashboard/ventas/nueva`

**Admin y Cajero tienen acceso**

**Funcionalidades**:

**Pantalla de POS** (punto de venta):

**Layout de 2 columnas**:

**Columna izquierda: Selector de productos**
- Grid de productos con imagen/icono
- Filtros por categoría (tabs superiores)
- Búsqueda rápida por nombre o código
- Cada producto muestra:
  - Nombre
  - Precio
  - Badge de stock (OK/Bajo/Sin stock)
- Al hacer click → agregar al carrito

**Columna derecha: Carrito/Ticket**
- Lista de productos agregados:
  - Nombre
  - Cantidad (editable con +/-)
  - Precio unitario
  - Subtotal
  - Botón eliminar
- Totales:
  - Subtotal
  - Descuento (opcional, input %)
  - **TOTAL** (grande y destacado)
- Método de pago (select)
- Cliente (opcional, nombre y RUT)
- Botones:
  - "Cancelar venta" (limpia todo)
  - "PROCESAR VENTA" (botón grande)

**Al procesar venta**:
1. Validar que hay stock de todos los productos
2. Si no hay stock → error específico
3. Crear registro en ventas + detalles
4. Restar stock automáticamente
5. Mostrar confirmación:
   ```
   ✅ Venta completada
   
   Total: $8,500
   Método: Efectivo
   
   [Ver ticket] [Nueva venta]
   ```
6. Opcional: Imprimir ticket (PDF)

**Historial de ventas**:
- Ruta: `/dashboard/ventas`
- **Admin**: Ve TODAS las ventas
- **Cajero**: Ve SOLO sus ventas
- Tabla con:
  - Número venta
  - Fecha
  - Cajero (solo visible para admin)
  - Total
  - Método pago
  - Estado
  - Acciones (Ver detalle, Anular si admin)
- Filtros por fecha, cajero (admin), método de pago

**Ver detalle de venta**:
- Información de la venta
- Tabla de productos vendidos
- Totales
- Opción de descargar/imprimir ticket

**UI**: POS estilo moderno tipo Square o Toast, grid de productos con imágenes, carrito lateral

---

### 7. Módulo de Analytics
**Ruta**: `/dashboard/analytics`

**Solo Admin tiene acceso completo**
**Cajero tiene acceso limitado a sus métricas**

**Funcionalidades**:

**Dashboard principal**:
- Selector de período (hoy, semana, mes, personalizado)
- KPIs:
  - Total ventas del período
  - Cantidad de transacciones
  - Ticket promedio
  - Ganancia bruta
  - Margen promedio

**Gráfico 1: Ventas en el tiempo**
- Gráfico de línea (Recharts LineChart)
- Eje X: Fechas
- Eje Y: Monto de ventas
- Comparación con período anterior (opcional)

**Gráfico 2: Productos más vendidos**
- Gráfico de barras horizontales (Recharts BarChart)
- Top 10 productos
- Mostrar: unidades vendidas y monto total

**Gráfico 3: Distribución por categoría**
- Gráfico de torta (Recharts PieChart)
- % de ventas por categoría de producto

**Tabla: Rentabilidad por producto**
- Columnas:
  - Producto
  - Unidades vendidas
  - Precio promedio
  - Costo promedio
  - Ganancia promedio
  - Margen %
  - Ganancia total
- Ordenable por cualquier columna
- Exportar a CSV

**Análisis de rendimiento de cajeros** (solo admin):
- Tabla de cajeros:
  - Nombre
  - Ventas realizadas
  - Total vendido
  - Ticket promedio
- Gráfico de barras comparativo

**Vista de Cajero** (limitada):
- Solo sus propios KPIs
- Gráfico de sus ventas en el tiempo
- Sus productos más vendidos
- NO ve comparaciones con otros cajeros
- NO ve costos ni márgenes

**UI**: Dashboard con cards de KPIs, gráficos de Recharts, tablas con ordenamiento

---

### 8. Módulo de Configuración
**Ruta**: `/dashboard/configuracion`

**Solo Admin tiene acceso**

**Funcionalidades**:

**Gestión de usuarios**:
- Tabla de usuarios:
  - Nombre completo
  - Email
  - Rol
  - Estado (Activo/Inactivo)
  - Acciones
- Crear nuevo usuario:
  - Nombre, email, contraseña temporal
  - Rol (Admin/Cajero)
- Deshabilitar/habilitar usuario (cambiar campo activo)
- NO borrar usuarios (solo deshabilitar)

**Gestión de categorías**:
- Lista de categorías de productos
- CRUD simple: crear, editar, eliminar
- Validar que no esté en uso antes de eliminar

**Configuración de panadería**:
- Nombre
- RUT
- Dirección
- Teléfono
- Email
- Logo (subir imagen)

**UI**: Tabs para cada sección, formularios simples

---

## 🎯 FLUJOS CRÍTICOS DEL SISTEMA

### Flujo 1: Crear receta y calcular precio
1. Admin va a Recetas → Crear receta
2. Selecciona producto: "Torta de Frambuesa"
3. Define rendimiento: 1 torta
4. Agrega ingredientes uno por uno con cantidades
5. Sistema calcula EN TIEMPO REAL:
   - Costo total de ingredientes
   - Costo por unidad
6. Admin define margen deseado: 45%
7. Sistema calcula precio sugerido: $8,309
8. Admin decide precio final: $8,500
9. Guardar receta
10. Sistema actualiza automáticamente:
    - productos.costo_receta = $4,570
    - productos.precio_sugerido = $8,309
    - productos.precio_venta = $8,500 (si admin lo define)

### Flujo 2: Producir productos
1. Admin va a Producción → Nueva orden
2. Selecciona receta: "Torta de Frambuesa"
3. Cantidad: 2 tortas
4. Sistema verifica stock de ingredientes:
   - Si NO hay stock suficiente → ERROR con detalle específico
   - Si hay stock → permite crear orden
5. Orden creada con estado 'pendiente'
6. **MÁS TARDE** cuando realmente hizo las tortas:
7. Admin marca orden como 'completada'
8. Sistema AUTOMÁTICAMENTE:
   - Resta ingredientes según receta × cantidad
   - Suma producto terminado
   - Guarda costo de producción
9. Confirmación mostrada

### Flujo 3: Vender producto
1. Cajero abre POS
2. Busca o selecciona "Torta de Frambuesa"
3. Agrega al carrito (cantidad: 1)
4. Sistema muestra precio: $8,500
5. Cajero selecciona método de pago: Efectivo
6. Click en "Procesar venta"
7. Sistema:
   - Valida stock (hay 2 tortas)
   - Crea venta
   - Resta stock: 2 → 1 torta
   - Guarda costo para calcular ganancia
8. Muestra confirmación y opción de imprimir

### Flujo 4: Admin ve analytics
1. Admin va a Analytics
2. Selecciona período: "Último mes"
3. Ve:
   - Total vendido
   - Ganancia bruta
   - Margen promedio
   - Gráfico de ventas diarias
   - Top productos
4. Identifica que "Pan amasado" es muy rentable
5. Decide producir más basándose en data

### Flujo 5: Cajero ve solo sus ventas
1. Cajero hace login
2. Ve dashboard limitado
3. Va a "Mis ventas"
4. Ve SOLO las ventas que él hizo
5. NO ve recetas
6. NO ve producción
7. NO ve inventario
8. Solo puede hacer ventas y ver su rendimiento

---

## 📱 CONSIDERACIONES DE UX/UI

### Diseño general
- Layout con sidebar colapsable
- Tema claro con opción de tema oscuro
- Paleta de colores cálidos (panadería)
- Iconos de Lucide React
- Fuente legible (Inter o similar)

### Componentes clave
- Todas las tablas con ordenamiento y filtros
- Todos los formularios con validación en tiempo real
- Confirmaciones para acciones destructivas
- Loading states en todas las operaciones async
- Error states claros y accionables
- Success toasts para feedback

### Responsive
- Prioridad: Desktop first (uso en local)
- Tablet: Layout adaptado
- Mobile: POS funcional básico

### Accesibilidad
- Contraste suficiente
- Keyboard navigation
- Labels claros en formularios
- Error messages descriptivos

---

## 🔧 REQUERIMIENTOS TÉCNICOS

### Supabase Setup
1. Crear proyecto en Supabase
2. Ejecutar schema SQL completo
3. Configurar Storage para imágenes de productos
4. Configurar Auth:
   - Email + Password
   - Confirmación de email (opcional)
5. Habilitar Row Level Security en todas las tablas
6. Configurar políticas RLS según roles

### Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Paquetes NPM requeridos
- next (v15+)
- react, react-dom (v19+)
- @refinedev/core
- @refinedev/nextjs-router
- @refinedev/supabase
- @supabase/supabase-js
- @supabase/ssr
- shadcn/ui components
- recharts
- zod
- react-hook-form
- @hookform/resolvers
- date-fns
- lucide-react

### Estructura de carpetas
```
src/
├── app/                 # Next.js App Router
├── modules/             # Lógica de negocio por dominio
├── components/          # Componentes UI reutilizables
├── lib/                 # Utils y configuración
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── providers/           # Refine providers
```

---

## 🎯 PRIORIDADES DE DESARROLLO

### Sprint 1 (Semana 1): Fundamentos
- Setup de proyecto (Next.js + Supabase)
- Autenticación básica
- Schema de base de datos completo
- RLS configurado
- Layout básico con sidebar

### Sprint 2 (Semana 2): Inventario
- CRUD de productos/ingredientes
- Ajustes manuales de stock
- Alertas de stock bajo
- Categorías

### Sprint 3 (Semana 3-4): Recetas ⭐
- CRUD de recetas
- Selector de ingredientes
- Cálculo de costos en tiempo real
- Calculadora de margen/precio

### Sprint 4 (Semana 5): Producción
- CRUD de órdenes
- Validación de stock
- Completar producción con triggers
- Historial de producción

### Sprint 5 (Semana 6): Ventas
- POS funcional
- Carrito de compras
- Procesar ventas
- Historial de ventas

### Sprint 6 (Semana 7): Analytics
- Dashboard con KPIs
- Gráficos de ventas
- Rentabilidad por producto
- Vista de cajero limitada

### Sprint 7 (Semana 8): Pulido
- Configuración de usuarios
- Mejoras de UX
- Testing
- Deployment

---

## ✅ VALIDACIONES Y REGLAS DE NEGOCIO

### Productos
- ✅ Código debe ser único
- ✅ Si tiene_receta = true → costo_unitario NO es editable
- ✅ Stock no puede ser negativo
- ✅ Margen_deseado debe ser entre 0 y 100

### Recetas
- ✅ Debe tener al menos 1 ingrediente
- ✅ Todas las cantidades deben ser > 0
- ✅ Rendimiento debe ser > 0
- ✅ Solo productos tipo 'producto_terminado' pueden tener receta

### Producción
- ✅ Validar stock suficiente ANTES de crear orden
- ✅ No permitir completar si estado != 'pendiente'
- ✅ Cantidad_producida no puede ser > cantidad_a_producir * 1.5 (margen de error)
- ✅ No permitir cancelar orden ya completada

### Ventas
- ✅ Validar stock suficiente ANTES de vender
- ✅ Total debe ser >= 0
- ✅ No permitir vender productos inactivos
- ✅ Solo admin puede anular ventas

---

## 🎨 NOTAS DE IMPLEMENTACIÓN

### Cálculos en tiempo real
Usar React hooks para recalcular costos mientras el usuario edita:
- En formulario de receta: useEffect que recalcula cuando cambian ingredientes
- Mostrar loader solo en guardado final, no en cálculos

### Optimistic updates
Usar optimistic updates de Refine para mejor UX:
- Al agregar producto al carrito
- Al ajustar cantidad en carrito
- Al completar orden de producción

### Manejo de errores
Siempre mostrar mensajes claros:
- "No hay stock suficiente de Harina (tienes 0.3 kg, necesitas 1 kg)"
- "No puedes eliminar esta categoría porque tiene 5 productos asociados"
- "Este usuario ya existe en tu panadería"

### Performance
- Usar índices en BD correctamente
- Paginar listados largos
- Lazy load de imágenes
- Debounce en búsquedas

---

## 📊 MÉTRICAS DE ÉXITO

El sistema será exitoso si:
- ✅ Admin puede crear una receta completa en < 3 minutos
- ✅ Cajero puede procesar una venta en < 30 segundos
- ✅ Cálculos de costo/precio son 100% precisos
- ✅ Inventario siempre refleja la realidad
- ✅ No hay forma de vender sin stock
- ✅ Cajeros NO pueden ver información restringida
- ✅ Sistema funciona fluido en computadora básica

---

FIN DEL BLUEPRINT
