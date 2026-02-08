-- =====================================================
-- ARREGLAR RECURSIÓN INFINITA EN POLÍTICAS RLS
-- =====================================================
-- Error: "infinite recursion detected in policy for relation perfiles"
-- Causa: Las políticas RLS están haciendo referencia circular

-- 1. Ver las políticas actuales de la tabla perfiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'perfiles';

-- 2. SOLUCIÓN TEMPORAL: Desactivar RLS en tabla perfiles
-- Esto permitirá que el dashboard funcione mientras arreglamos las políticas
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que RLS está desactivado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'perfiles';

-- 4. OPCIONAL: Si quieres eliminar todas las políticas de perfiles
-- (descomenta si es necesario)
-- DROP POLICY IF EXISTS "perfiles_select_authenticated" ON perfiles;
-- DROP POLICY IF EXISTS "perfiles_select_anon" ON perfiles;
-- DROP POLICY IF EXISTS "perfiles_insert_authenticated" ON perfiles;
-- DROP POLICY IF EXISTS "perfiles_update_authenticated" ON perfiles;

-- 5. Verificar que no hay políticas activas
SELECT COUNT(*) as politicas_activas
FROM pg_policies
WHERE tablename = 'perfiles';

-- NOTA: Después de ejecutar este script:
-- 1. El dashboard debería cargar sin errores
-- 2. Todas las queries a la tabla ventas funcionarán
-- 3. Para producción, necesitarás crear políticas RLS correctas sin recursión
