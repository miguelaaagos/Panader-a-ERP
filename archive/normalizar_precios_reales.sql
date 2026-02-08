-- ============================================================
-- NORMALIZACIÓN DE PRECIOS - Basado en Datos Reales
-- ============================================================
-- Actualiza precio_venta sin tocar margen_porcentaje
-- ============================================================

-- PASO 1: Multiplicar TODOS los precio_venta por 1000
UPDATE productos 
SET precio_venta = ROUND(precio_venta * 1000)
WHERE precio_venta < 1000;

-- PASO 2: Corregir productos con precio 0
UPDATE productos 
SET precio_venta = 1500, precio_costo = 750
WHERE precio_venta = 0 OR precio_venta IS NULL;

-- PASO 3: Ajustes específicos para productos conocidos

-- Cereales (Choco Krispis, Zucaritas): $2,000
UPDATE productos 
SET precio_venta = 2000
WHERE nombre ILIKE '%krispis%' OR nombre ILIKE '%zucaritas%';

-- Bebidas grandes (3lt): $3,000
UPDATE productos 
SET precio_venta = 3000
WHERE nombre ILIKE '%(3lt)%';

-- Bebidas medianas (1.5lt): $2,000
UPDATE productos 
SET precio_venta = 2000
WHERE nombre ILIKE '%(1.5%';

-- Bebidas pequeñas (591ml, 600ml): $1,500
UPDATE productos 
SET precio_venta = 1500
WHERE nombre ILIKE '%(591ml)%' OR nombre ILIKE '%(600ml)%';

-- Azúcar (pesables, por kilo): $10,000
UPDATE productos 
SET precio_venta = 10000
WHERE nombre ILIKE '%azucar%' AND es_pesable = true;

-- Cacao/Chocolate granel (por kilo): $15,000
UPDATE productos 
SET precio_venta = 15000
WHERE (nombre ILIKE '%cacao%' OR nombre ILIKE '%chocolate%') AND es_pesable = true;

-- Panes (Hallulla, Marraqueta, Coliza, Dobladita): $1,500
UPDATE productos 
SET precio_venta = 1500
WHERE nombre ILIKE '%hallulla%' OR nombre ILIKE '%marraqueta%' 
   OR nombre ILIKE '%coliza%' OR nombre ILIKE '%dobladita%';

-- Ciabatta: $3,500
UPDATE productos 
SET precio_venta = 3500
WHERE nombre ILIKE '%ciabatta%';

-- Berlín: $2,500
UPDATE productos 
SET precio_venta = 2500
WHERE nombre ILIKE '%berlin%';

-- Brownie: $2,800
UPDATE productos 
SET precio_venta = 2800
WHERE nombre ILIKE '%brownie%';

-- Cheesecake: $4,500
UPDATE productos 
SET precio_venta = 4500
WHERE nombre ILIKE '%cheese%';

-- Huevos: $1,200
UPDATE productos 
SET precio_venta = 1200
WHERE nombre ILIKE '%huevo%';

-- Jamón: $2,000/100g
UPDATE productos 
SET precio_venta = 2000
WHERE nombre ILIKE '%jamon%';

-- Alfajor: $2,500
UPDATE productos 
SET precio_venta = 2500
WHERE nombre ILIKE '%alfajor%';

-- Atún: $2,500
UPDATE productos 
SET precio_venta = 2500
WHERE nombre ILIKE '%atun%';

-- Avena: $3,000
UPDATE productos 
SET precio_venta = 3000
WHERE nombre ILIKE '%avena%';

-- Benedictino: $2,000
UPDATE productos 
SET precio_venta = 2000
WHERE nombre ILIKE '%benedictino%';

-- Aceitunas: $2,000
UPDATE productos 
SET precio_venta = 2000
WHERE nombre ILIKE '%aceituna%';

-- Cachitos/Delicias: $1,800
UPDATE productos 
SET precio_venta = 1800
WHERE nombre ILIKE '%cachito%' OR nombre ILIKE '%delicia%';

-- Leche en caja: $1,000
UPDATE productos 
SET precio_venta = 1000
WHERE nombre ILIKE '%caja leche%';

-- Jaleas: $1,500
UPDATE productos 
SET precio_venta = 1500
WHERE nombre ILIKE '%jalea%';

-- Jugos grandes (5lt): $5,000
UPDATE productos 
SET precio_venta = 5000
WHERE nombre ILIKE '%jugo%' AND nombre ILIKE '%(5lt)%';

-- PASO 4: Verificar resultados (SIN recalcular margen)
SELECT 
    nombre,
    precio_costo,
    precio_venta,
    margen_porcentaje,
    es_pesable,
    CASE 
        WHEN es_pesable THEN 'Por kilo'
        ELSE 'Por unidad'
    END as tipo
FROM productos
ORDER BY precio_venta DESC
LIMIT 50;

-- PASO 5: Estadísticas finales
SELECT 
    COUNT(*) as total_productos,
    ROUND(AVG(precio_venta)) as precio_promedio,
    MIN(precio_venta) as precio_minimo,
    MAX(precio_venta) as precio_maximo,
    COUNT(*) FILTER (WHERE precio_venta < 1000) as precios_bajos,
    COUNT(*) FILTER (WHERE precio_venta = 0) as precios_cero
FROM productos;
