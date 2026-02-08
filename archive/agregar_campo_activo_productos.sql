-- Migration: Add activo field to productos table
-- Purpose: Allow deactivating products instead of deleting them
-- This preserves historical sales data while removing products from active use

-- Add activo column to productos table
-- Default to true so all existing products remain active
ALTER TABLE productos 
ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;

-- Create index for filtering active products
-- This improves query performance when filtering by activo status
CREATE INDEX idx_productos_activo ON productos(activo);

-- Add column comment for documentation
COMMENT ON COLUMN productos.activo IS 'Indica si el producto está activo (true) o desactivado (false). Productos desactivados no aparecen en el POS pero mantienen historial de ventas.';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'productos' AND column_name = 'activo';

-- Verify index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'productos' AND indexname = 'idx_productos_activo';

-- Verify all existing products are active
SELECT COUNT(*) as total_productos_activos
FROM productos 
WHERE activo = true;
