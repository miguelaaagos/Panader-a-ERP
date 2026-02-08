-- Ver los primeros 50 productos con sus nombres exactos
SELECT 
    id,
    nombre,
    precio_costo,
    precio_venta,
    es_pesable,
    stock_cantidad
FROM productos
ORDER BY nombre
LIMIT 50;
