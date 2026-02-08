-- ============================================================
-- DIAGNÓSTICO: Revisar precios y stock de productos
-- ============================================================
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Ver productos con precios sospechosos (muy bajos o negativos)
SELECT 
    id,
    codigo_barras,
    nombre,
    precio_costo,
    precio_venta,
    margen_porcentaje,
    stock_cantidad,
    es_pesable
FROM productos
WHERE precio_venta < 100 OR precio_costo < 0 OR margen_porcentaje < 0
ORDER BY precio_venta ASC;

-- 2. Ver productos con stock bajo (menos de 5 unidades)
SELECT 
    id,
    codigo_barras,
    nombre,
    precio_venta,
    stock_cantidad,
    es_pesable
FROM productos
WHERE stock_cantidad < 5 AND stock_cantidad >= 0
ORDER BY stock_cantidad ASC;

-- 3. Ver productos con stock negativo (error)
SELECT 
    id,
    codigo_barras,
    nombre,
    precio_venta,
    stock_cantidad
FROM productos
WHERE stock_cantidad < 0;

-- 4. Ver todos los productos ordenados por precio
SELECT 
    id,
    codigo_barras,
    nombre,
    precio_costo,
    precio_venta,
    margen_porcentaje,
    stock_cantidad,
    stock_minimo,
    es_pesable
FROM productos
ORDER BY precio_venta DESC
LIMIT 50;

-- 5. Estadísticas generales
SELECT 
    COUNT(*) as total_productos,
    COUNT(*) FILTER (WHERE stock_cantidad < 5) as productos_stock_bajo,
    COUNT(*) FILTER (WHERE stock_cantidad <= 0) as productos_sin_stock,
    COUNT(*) FILTER (WHERE es_pesable = true) as productos_pesables,
    AVG(precio_venta) as precio_promedio,
    MIN(precio_venta) as precio_minimo,
    MAX(precio_venta) as precio_maximo
FROM productos;
