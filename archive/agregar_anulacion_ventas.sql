-- =====================================================
-- AGREGAR SOPORTE PARA ANULAR VENTAS
-- =====================================================
-- Este script agrega la columna 'anulada' a la tabla ventas
-- para permitir anular ventas sin borrarlas de la base de datos

-- 1. Agregar columna anulada (por defecto false)
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS anulada BOOLEAN DEFAULT false NOT NULL;

-- 2. Agregar columna para registrar quién anuló y cuándo
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS anulada_por UUID REFERENCES auth.users(id);

ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS anulada_at TIMESTAMPTZ;

-- 3. Agregar columna para motivo de anulación
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT;

-- 4. Crear índice para mejorar performance en queries que filtran por anulada
CREATE INDEX IF NOT EXISTS idx_ventas_anulada ON ventas(anulada);

-- 5. Verificar que se agregaron las columnas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ventas'
AND column_name IN ('anulada', 'anulada_por', 'anulada_at', 'motivo_anulacion')
ORDER BY column_name;

-- 6. Verificar que todas las ventas existentes tienen anulada = false
SELECT 
    COUNT(*) as total_ventas,
    COUNT(*) FILTER (WHERE anulada = false) as ventas_activas,
    COUNT(*) FILTER (WHERE anulada = true) as ventas_anuladas
FROM ventas;

-- NOTA: Después de ejecutar este script, necesitarás:
-- 1. Implementar la funcionalidad de anular ventas en el frontend
-- 2. Crear una función para revertir el stock cuando se anula una venta
-- 3. Agregar permisos para controlar quién puede anular ventas
