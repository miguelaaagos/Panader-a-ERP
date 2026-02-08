-- =====================================================
-- DIAGNÓSTICO Y FIX COMPLETO DE RLS
-- =====================================================

-- 1. Ver el estado actual de RLS en la tabla productos
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'productos';

-- 2. Ver todas las políticas actuales en productos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'productos';

-- 3. ELIMINAR TODAS las políticas existentes (por si hay conflictos)
DROP POLICY IF EXISTS "Permitir lectura de productos a usuarios autenticados" ON productos;
DROP POLICY IF EXISTS "Enable read access for all users" ON productos;
DROP POLICY IF EXISTS "Allow public read access" ON productos;
DROP POLICY IF EXISTS "productos_select_policy" ON productos;

-- 4. DESACTIVAR RLS temporalmente para verificar
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- 5. Probar consulta sin RLS
SELECT COUNT(*) as total_productos FROM productos;
SELECT nombre, precio_venta FROM productos WHERE nombre ILIKE '%pan%' LIMIT 3;

-- 6. REACTIVAR RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 7. Crear política PERMISIVA para usuarios autenticados
CREATE POLICY "productos_select_authenticated"
ON productos
FOR SELECT
TO authenticated
USING (true);

-- 8. IMPORTANTE: También crear política para usuarios anónimos (temporal para debug)
CREATE POLICY "productos_select_anon"
ON productos
FOR SELECT
TO anon
USING (true);

-- 9. Verificar que las políticas se crearon
SELECT 
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'productos';

-- 10. Probar consulta final
SELECT nombre, precio_venta, es_pesable 
FROM productos 
WHERE nombre ILIKE '%pan%' 
LIMIT 5;
