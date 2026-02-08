-- =====================================================
-- ELIMINAR POLÍTICAS RLS QUE CAUSAN RECURSIÓN
-- =====================================================

-- 1. Ver exactamente cuáles son las 2 políticas activas
SELECT 
    policyname,
    cmd,
    qual::text as condicion
FROM pg_policies
WHERE tablename = 'perfiles';

-- 2. Eliminar TODAS las políticas de perfiles
-- (esto resolverá la recursión infinita)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'perfiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON perfiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Desactivar RLS en perfiles
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;

-- 4. Verificar que no quedan políticas
SELECT COUNT(*) as politicas_restantes
FROM pg_policies
WHERE tablename = 'perfiles';

-- 5. Verificar que RLS está desactivado
SELECT 
    tablename,
    rowsecurity as rls_activo
FROM pg_tables
WHERE tablename = 'perfiles';

-- Resultado esperado:
-- politicas_restantes: 0
-- rls_activo: false
