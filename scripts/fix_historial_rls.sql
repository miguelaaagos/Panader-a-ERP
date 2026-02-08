
-- ==============================================================================
-- FIX: HABILITAR PERMISOS PARA HISTORIAL DE INVENTARIO
-- ==============================================================================

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE historial_inventario ENABLE ROW LEVEL SECURITY;

-- 2. Limpieza preventiva de políticas antiguas
DROP POLICY IF EXISTS "Permitir insercion historial a autenticados" ON historial_inventario;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON historial_inventario;

-- 3. Crear política para permitir insertar registros en el historial
--    Necesario para los triggers que registran movimientos de stock al vender
CREATE POLICY "Permitir insercion historial a autenticados"
ON historial_inventario
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Permitir lectura (opcional, pero útil para reportes)
DROP POLICY IF EXISTS "Permitir lectura historial autenticados" ON historial_inventario;
CREATE POLICY "Permitir lectura historial autenticados"
ON historial_inventario
FOR SELECT
TO authenticated
USING (true);

