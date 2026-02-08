-- ============================================================
-- SCRIPT DE CORRECCIÓN: Trigger de Precio Venta
-- ============================================================
-- Este script corrige el trigger para que NO sobrescriba
-- los precios que vienen del Excel
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script completo
-- 3. Presiona "Run" (o Ctrl+Enter)
-- ============================================================

-- Paso 1: Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS trigger_update_precio_venta ON productos;
DROP FUNCTION IF EXISTS funcion_calcular_precio_venta();

-- Paso 2: Crear nueva función mejorada
CREATE OR REPLACE FUNCTION funcion_calcular_precio_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo calculamos si el precio_venta no viene especificado (NULL o 0)
    -- Esto permite que los datos del Excel se respeten
    IF NEW.precio_venta IS NULL OR NEW.precio_venta = 0 THEN
        NEW.precio_venta := NEW.precio_costo * (1 + NEW.margen_porcentaje) * (1 + NEW.tasa_impuesto);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Recrear el trigger
CREATE TRIGGER trigger_update_precio_venta
    BEFORE INSERT OR UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION funcion_calcular_precio_venta();

-- Paso 4: Agregar comentario para documentación
COMMENT ON FUNCTION funcion_calcular_precio_venta() IS 
'Calcula precio_venta automáticamente solo si no viene especificado desde importación. 
Si precio_venta > 0, se respeta el valor importado del Excel.';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecuta esta consulta para verificar que el trigger se creó:
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_precio_venta';

-- Deberías ver 1 fila con el trigger actualizado
