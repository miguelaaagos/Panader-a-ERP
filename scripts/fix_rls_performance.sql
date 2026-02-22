-- SCRIPT DE OPTIMIZACIÓN DE RLS (Supabase Performance Fix)
-- Fecha: 2026-02-20
-- Objetivos: 
-- 1. Resolver 'auth_rls_initplan' usando (select auth.uid())
-- 2. Resolver 'multiple_permissive_policies' consolidando políticas redundantes.

BEGIN;

-- ==========================================
-- 1. TABLA: usuarios
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON usuarios;
DROP POLICY IF EXISTS "Users within tenant can view users" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_consolidated" ON usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
DROP POLICY IF EXISTS "Admins can update users" ON usuarios;
DROP POLICY IF EXISTS "Admins can delete users" ON usuarios;

-- Política de lectura consolidada (SELECT)
CREATE POLICY "usuarios_select_optimized" 
ON usuarios FOR SELECT TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
);

-- Política de gestión para Admins (INSERT, UPDATE, DELETE)
CREATE POLICY "usuarios_admin_manage_optimized" 
ON usuarios FOR ALL TO authenticated 
USING (
  (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
)
WITH CHECK (
  (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
);

-- ==========================================
-- 2. TABLA: ventas
-- ==========================================
DROP POLICY IF EXISTS "ventas_select" ON ventas;
DROP POLICY IF EXISTS "View sales (Admin: all, User: own)" ON ventas;
DROP POLICY IF EXISTS "Sales Insert Policy" ON ventas;

-- SELECT: Admin ve todo del tenant, Staff ve lo propio
CREATE POLICY "ventas_select_optimized" 
ON ventas FOR SELECT TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
  AND (
    (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin' 
    OR usuario_id = (SELECT auth.uid())
  )
);

-- INSERT: Permite insertar si el tenant coincide (validado en server action usualmente)
CREATE POLICY "ventas_insert_optimized" 
ON ventas FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
);

-- ==========================================
-- 3. TABLA: recetas
-- ==========================================
DROP POLICY IF EXISTS "Ver recetas del mismo tenant" ON recetas;
DROP POLICY IF EXISTS "recetas_select_admin" ON recetas;
DROP POLICY IF EXISTS "Insertar recetas (admin, mismo tenant)" ON recetas;
DROP POLICY IF EXISTS "recetas_insert_admin" ON recetas;
DROP POLICY IF EXISTS "Actualizar recetas (admin, mismo tenant)" ON recetas;
DROP POLICY IF EXISTS "recetas_update_admin" ON recetas;
DROP POLICY IF EXISTS "Eliminar recetas (admin, mismo tenant)" ON recetas;
DROP POLICY IF EXISTS "recetas_delete_admin" ON recetas;

-- SELECT: Todos los autenticados del tenant pueden ver
CREATE POLICY "recetas_select_optimized" 
ON recetas FOR SELECT TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
);

-- GESTIÓN: Solo admin del mismo tenant puede CUD
CREATE POLICY "recetas_admin_manage_optimized" 
ON recetas FOR ALL TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
  AND (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
)
WITH CHECK (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
  AND (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
);

-- ==========================================
-- 4. TABLA: receta_ingredientes
-- ==========================================
DROP POLICY IF EXISTS "Ver ingredientes de recetas del mismo tenant" ON receta_ingredientes;
DROP POLICY IF EXISTS "Insertar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;
DROP POLICY IF EXISTS "Actualizar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;
DROP POLICY IF EXISTS "Eliminar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;

-- SELECT
CREATE POLICY "receta_ingredientes_select_optimized" 
ON receta_ingredientes FOR SELECT TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
);

-- GESTIÓN
CREATE POLICY "receta_ingredientes_admin_manage_optimized" 
ON receta_ingredientes FOR ALL TO authenticated 
USING (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
  AND (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
)
WITH CHECK (
  tenant_id = (SELECT u.tenant_id FROM usuarios u WHERE u.id = (SELECT auth.uid()))
  AND (SELECT u.rol FROM usuarios u WHERE u.id = (SELECT auth.uid())) = 'admin'
);

COMMIT;
