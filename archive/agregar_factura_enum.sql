-- =====================================================
-- AGREGAR "FACTURA" AL ENUM tipo_documento_venta
-- =====================================================
-- Error: invalid input value for enum tipo_documento_venta: "factura"
-- Solución: Agregar "factura" como valor válido al enum

-- Ver valores actuales del enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'tipo_documento_venta'::regtype
ORDER BY enumsortorder;

-- Agregar "factura" al enum si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'factura' 
        AND enumtypid = 'tipo_documento_venta'::regtype
    ) THEN
        ALTER TYPE tipo_documento_venta ADD VALUE 'factura';
        RAISE NOTICE '✅ Valor "factura" agregado al enum tipo_documento_venta';
    ELSE
        RAISE NOTICE 'ℹ️ El valor "factura" ya existe en el enum';
    END IF;
END $$;

-- Verificar que se agregó correctamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'tipo_documento_venta'::regtype
ORDER BY enumsortorder;
