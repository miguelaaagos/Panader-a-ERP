-- =====================================================
-- VERIFICAR Y CREAR RELACIÓN ENTRE PRODUCTOS Y CATEGORÍAS
-- =====================================================

-- 1. Verificar estructura de la tabla productos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'productos'
AND column_name = 'categoria_id';

-- 2. Verificar que existe la foreign key
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'productos';

-- 3. Si no existe la foreign key, crearla
-- ALTER TABLE productos
-- ADD CONSTRAINT fk_productos_categoria
-- FOREIGN KEY (categoria_id)
-- REFERENCES categorias(id);

-- 4. Verificar que los IDs de categoría son válidos
SELECT 
    p.nombre as producto,
    p.categoria_id,
    c.nombre as categoria
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.categoria_id IS NOT NULL
LIMIT 10;

-- 5. Ver productos sin categoría
SELECT COUNT(*) as productos_sin_categoria
FROM productos
WHERE categoria_id IS NULL;
