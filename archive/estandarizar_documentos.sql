-- ============================================================
-- SCRIPT DE ESTANDARIZACIÓN: Tipos de Documento (Versión Corregida)
-- ============================================================
-- Este script normaliza los valores a "Boleta" y "Factura"
-- Limpia el enum eliminando duplicados mediante una migración de tipo.
-- ============================================================

-- 1. Renombrar el enum actual para evitar conflictos si ya existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_venta') THEN
        -- Intentamos renombrarlo. Si ya existe un '_old', lo borramos primero.
        DROP TYPE IF EXISTS tipo_documento_venta_old;
        ALTER TYPE tipo_documento_venta RENAME TO tipo_documento_venta_old;
    END IF;
END $$;

-- 2. Crear el nuevo tipo enum con los valores deseados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_venta') THEN
        CREATE TYPE tipo_documento_venta AS ENUM ('Boleta', 'Factura');
    END IF;
END $$;

-- 3. Eliminar el valor por defecto temporalmente (causa conflicto con el cambio de tipo)
ALTER TABLE ventas ALTER COLUMN tipo_documento DROP DEFAULT;

-- 4. Cambiar el tipo de la columna y migrar los datos en un solo paso
-- El bloque USING es el responsable de transformar los datos viejos al nuevo tipo.
ALTER TABLE ventas 
ALTER COLUMN tipo_documento TYPE tipo_documento_venta 
USING (
    CASE 
        WHEN tipo_documento::text ILIKE 'boleta' THEN 'Boleta'::tipo_documento_venta
        WHEN tipo_documento::text ILIKE 'factura' THEN 'Factura'::tipo_documento_venta
        ELSE 'Boleta'::tipo_documento_venta
    END
);

-- 5. Restaurar el valor por defecto con el nuevo tipo
ALTER TABLE ventas ALTER COLUMN tipo_documento SET DEFAULT 'Boleta'::tipo_documento_venta;

-- 6. Limpiar el tipo antiguo
DROP TYPE IF EXISTS tipo_documento_venta_old;

-- 7. Verificación final
SELECT DISTINCT tipo_documento FROM ventas;
