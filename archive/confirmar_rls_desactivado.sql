-- =====================================================
-- CONFIRMACIÓN: RLS DESACTIVADO
-- =====================================================
-- Este script confirma que RLS está desactivado
-- y que las consultas funcionan correctamente
-- =====================================================

-- Verificar estado de RLS (debería mostrar false)
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'productos';

-- Si RLS sigue activado, desactivarlo
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Verificar de nuevo
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'productos';

-- Probar búsqueda
SELECT nombre, precio_venta, es_pesable 
FROM productos 
WHERE nombre ILIKE '%pan%' 
LIMIT 10;
