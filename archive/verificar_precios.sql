-- =====================================================
-- VERIFICAR PRECIOS ACTUALES
-- =====================================================

-- Ver precios de productos con "pan"
SELECT 
    nombre,
    precio_costo,
    precio_venta,
    margen_porcentaje,
    es_pesable
FROM productos 
WHERE nombre ILIKE '%pan%'
ORDER BY nombre;

-- Ver estadísticas de precios
SELECT 
    MIN(precio_venta) as precio_min,
    MAX(precio_venta) as precio_max,
    AVG(precio_venta) as precio_promedio,
    COUNT(*) as total_productos
FROM productos;

-- Ver productos con precios sospechosamente bajos (< $10)
SELECT 
    nombre,
    precio_venta,
    precio_costo
FROM productos
WHERE precio_venta < 10
ORDER BY precio_venta;
