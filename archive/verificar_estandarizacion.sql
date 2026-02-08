-- ============================================================
-- VERIFICACIÓN COMPLETA: Estandarización de Tipos de Documento
-- ============================================================

-- 1. Verificar valores del enum
SELECT t.typname as enum_name, e.enumlabel as value, e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'tipo_documento_venta'
ORDER BY e.enumsortorder;

-- 2. Verificar distribución de valores en la tabla ventas
SELECT tipo_documento, COUNT(*) as cantidad
FROM ventas
GROUP BY tipo_documento
ORDER BY tipo_documento;

-- 3. Verificar que no hay valores NULL
SELECT COUNT(*) as ventas_sin_tipo_documento
FROM ventas
WHERE tipo_documento IS NULL;

-- 4. Verificar el valor por defecto de la columna
SELECT column_name, column_default, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'ventas' AND column_name = 'tipo_documento';

-- 5. Verificar que no existen enums antiguos
SELECT typname 
FROM pg_type 
WHERE typname LIKE '%tipo_documento%'
ORDER BY typname;
