-- ============================================================
-- CORRECCIÓN: Dividir precios por 1000
-- ============================================================
-- Los precios fueron multiplicados por 1000 por error
-- Este script los corrige dividiéndolos por 1000
-- ============================================================

-- Actualizar todos los precios dividiéndolos por 1000
UPDATE productos
SET 
    precio_costo = precio_costo / 1000,
    precio_venta = precio_venta / 1000;

-- Recalcular los márgenes correctamente
-- margen = (precio_venta - precio_costo) / precio_costo
UPDATE productos
SET margen_porcentaje = 
    CASE 
        WHEN precio_costo > 0 THEN 
            (precio_venta - precio_costo) / precio_costo
        ELSE 
            0
    END;

-- Verificar los resultados
SELECT 
    nombre,
    precio_costo,
    precio_venta,
    margen_porcentaje,
    ROUND((margen_porcentaje * 100)::numeric, 2) as margen_porcentaje_display
FROM productos
ORDER BY nombre
LIMIT 10;
