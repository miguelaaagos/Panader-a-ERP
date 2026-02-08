-- =====================================================
-- SOLUCIÓN TEMPORAL: DESACTIVAR RLS COMPLETAMENTE
-- =====================================================
-- Esto desactiva RLS en la tabla productos
-- ADVERTENCIA: Esto permite acceso sin restricciones
-- Solo usar en desarrollo/testing
-- =====================================================

-- Desactivar RLS en productos
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'productos';

-- Probar consulta
SELECT nombre, precio_venta, es_pesable 
FROM productos 
WHERE nombre ILIKE '%pan%' 
LIMIT 5;
