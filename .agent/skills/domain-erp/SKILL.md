---
name: domain-erp
description: Dominio de negocio de la Panadería ERP. Úsame cuando trabajes con ventas, inventario, producción, recetas, gastos, caja POS, o cualquier entidad del negocio.
version: 1.0.0
tags: [erp, panaderia, pos, ventas, inventario, produccion, recetas, gastos]
---

# Dominio ERP Panadería

## Entidades principales

| Entidad | Tabla Supabase | Server Action | Descripción |
|---|---|---|---|
| Ventas | `sales` / `sale_items` | `actions/sales.ts` | Transacciones del POS |
| Inventario | `inventory` | `actions/inventory.ts` | Stock de insumos y productos |
| Producción | `production` | `actions/production.ts` | Lotes producidos |
| Recetas | `recipes` / `recipe_items` | `actions/recipes.ts` | Ingredientes por producto |
| Gastos | `gastos` | `actions/gastos.ts` | Egresos del negocio |
| Ingresos | `ingresos` | `actions/ingresos.ts` | Ingresos manuales |
| Usuarios | `profiles` | `actions/users.ts` | Perfiles por tenant |
| Roles | `roles` | `actions/roles.ts` | Permisos por rol |
| Caja | `cash` | `actions/cash.ts` | Apertura/cierre de caja |
| Reportes | — | `actions/reportes.ts` | Consultas de resumen |

## Multi-tenant

**Cada dato pertenece a un `tenant_id`**. Toda query DEBE filtrar por tenant:

```typescript
// ✅ CORRECTO
const { data } = await supabase
  .from('inventory')
  .select('*')
  .eq('tenant_id', claims.sub)  // o el tenant_id del perfil

// ❌ NUNCA hacer queries sin filtro de tenant
const { data } = await supabase.from('inventory').select('*')
```

## Correlativo por tenant (ventas/facturas)

Las ventas usan un correlativo secuencial **por tenant**, NO global:

```sql
-- La función SQL maneja atomicidad
SELECT next_sale_number(tenant_id) → '001', '002', '003'...
```

```typescript
// En Server Action de venta
const saleNumber = await getSaleCorrelativo(tenantId)
// Formato: '001' → '999' → reset o continúa
```

Reglas:
- Formato inicial: `000`, incrementa de a uno
- Función DB con `SECURITY DEFINER` para atomicidad
- NUNCA calcular en cliente

## Flujo POS — Checkout

```
1. Usuario agrega productos al carrito (Zustand: use-pos-store.ts)
2. Usuario hace "Cobrar"
3. Server Action: actions/sales.ts
   a. Validar autenticación (getClaims)
   b. Verificar stock disponible
   c. Crear sale + sale_items (transacción atómica)
   d. Descontar inventario
   e. Generar correlativo
   f. revalidateTag('sales', 'inventory')
4. Toast de confirmación
5. Limpiar carrito (Zustand)
```

**Este flujo es crítico** → candidato a test Playwright.

## Flujo Producción → Inventario

```
1. Crear lote de producción con receta
2. Server Action: actions/production.ts
   a. Calcular insumos necesarios (receta × cantidad)
   b. Verificar stock de insumos
   c. Descontar insumos del inventario
   d. Agregar producto terminado al inventario
   e. revalidateTag('inventory', 'production')
```

**Este flujo mueve stock** → candidato a test Playwright o Vitest unitario.

## Stock crítico — alertas

- Stock crítico: cantidad ≤ umbral definido por el usuario → card naranja/ámbar
- Sin stock: cantidad = 0 → card roja
- Links directo al inventario con query params: `?stock=bajo`, `?stock=sin_stock`

## RLS por tenant

```sql
-- Patrón estándar para todas las tablas del ERP
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON inventory FOR ALL TO authenticated
  USING ((select auth.uid()) = tenant_id)
  WITH CHECK ((select auth.uid()) = tenant_id);

CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
```

- `(select auth.uid())` en vez de `auth.uid()` directamente → mejor caching en Supabase
- Índice OBLIGATORIO en columnas de políticas

## Zustand — POS Store

```typescript
// hooks/use-pos-store.ts
interface POSState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clearCart: () => void
  total: number
}
```

- El store SOLO vive en cliente (`"use client"`)
- Se limpia después de cada venta exitosa
- No persistir en localStorage (seguridad de caja)

## TanStack Query — patterns

```typescript
// Para datos del dashboard que se actualizan frecuente
const { data: sales } = useQuery({
  queryKey: ['sales', tenantId, dateRange],
  queryFn: () => fetchSales(tenantId, dateRange),
  staleTime: 1000 * 60 * 5,  // 5 minutos en dashboard
})

// Para inventario (más crítico, stale rápido)
const { data: inventory } = useQuery({
  queryKey: ['inventory', tenantId],
  staleTime: 1000 * 60 * 2,  // 2 minutos
})
```

## Feedback visual obligatorio

Toda mutación del ERP DEBE terminar con:
```typescript
// En el componente cliente que llama la action
toast.success('Venta registrada — #001')
toast.error('Sin stock suficiente para ese producto')
```

## Comandos de DB

```bash
# Generar tipos desde Supabase
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > types/database.types.ts

# Verificar RLS activo
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
