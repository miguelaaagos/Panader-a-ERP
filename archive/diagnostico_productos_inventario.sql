-- =====================================================
-- DIAGNÓSTICO COMPLETO - Por qué no se cargan productos
-- =====================================================

-- 1. VERIFICAR QUE EXISTEN PRODUCTOS
SELECT COUNT(*) as total_productos FROM productos;

-- 2. VER ALGUNOS PRODUCTOS DE EJEMPLO
SELECT 
    id,
    nombre,
    codigo_barras,
    precio_venta,
    stock_cantidad,
    es_pesable,
    categoria_id
FROM productos 
LIMIT 5;

-- 3. VERIFICAR ESTADO DE RLS
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('productos', 'categorias');

-- 4. VER POLÍTICAS ACTIVAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('productos', 'categorias');

-- 5. PROBAR LA QUERY EXACTA QUE USA LA APP
SELECT 
    p.*,
    c.nombre as categoria_nombre
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
ORDER BY p.nombre
LIMIT 10;

-- 6. VERIFICAR ESTRUCTURA DE CATEGORÍAS
SELECT COUNT(*) as total_categorias FROM categorias;
SELECT id, nombre FROM categorias LIMIT 5;

-- 7. SI RLS ESTÁ HABILITADO, DESACTIVARLO
-- Descomentar estas líneas si RLS está causando problemas:
-- ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- 8. VERIFICAR PERMISOS DE LA TABLA
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'productos'
AND table_schema = 'public';
