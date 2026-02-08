-- =====================================================
-- FIX: Habilitar lectura de productos para todos los usuarios autenticados
-- =====================================================
-- Este script soluciona el error 500 al buscar productos
-- Problema: RLS está bloqueando las consultas SELECT a la tabla productos

-- 1. Habilitar RLS en la tabla productos (si no está habilitado)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para permitir SELECT a usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura de productos a usuarios autenticados" ON productos;

CREATE POLICY "Permitir lectura de productos a usuarios autenticados"
ON productos
FOR SELECT
TO authenticated
USING (true);

-- 3. OPCIONAL: Si quieres que usuarios anónimos también puedan ver productos
-- (útil para catálogos públicos, pero NO recomendado para un POS interno)
-- DROP POLICY IF EXISTS "Permitir lectura de productos a anónimos" ON productos;
-- CREATE POLICY "Permitir lectura de productos a anónimos"
-- ON productos
-- FOR SELECT
-- TO anon
-- USING (true);

-- 4. Verificar que la política se creó correctamente
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

-- 5. Probar la consulta que estaba fallando
SELECT * FROM productos WHERE nombre ILIKE '%pan%' LIMIT 5;
