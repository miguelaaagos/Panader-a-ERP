
-- ==============================================================================
-- FIX: HABILITAR PERMISOS DE INSERCIÓN PARA CAJEROS EN VENTAS
-- ==============================================================================

-- 1. Habilitar RLS en ventas (por si acaso no está)
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas restrictivas anteriores (limpieza preventiva)
DROP POLICY IF EXISTS "Permitir insercion de ventas a autenticados" ON ventas;
DROP POLICY IF EXISTS "Permitir insercion detalles a autenticados" ON detalle_ventas;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ventas;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON detalle_ventas;

-- 3. Crear política para permitir que CUALQUIER usuario autenticado cree ventas
--    (Asumimos que si puede loguearse al POS, puede vender)
CREATE POLICY "Permitir insercion de ventas a autenticados"
ON ventas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Crear política para permitir ver sus propias ventas (o todas, segun necesidad)
--    Para historial y reportes. Por ahora permitimos ver todas para simplificar debug,
--    o idealmente solo las del turno/cajero. Vamos con "permitir ver todas" para facilitar filtros.
DROP POLICY IF EXISTS "Permitir lectura ventas autenticados" ON ventas;
CREATE POLICY "Permitir lectura ventas autenticados"
ON ventas
FOR SELECT
TO authenticated
USING (true);

-- ==============================================================================
-- DETALLE DE VENTAS
-- ==============================================================================

-- 5. Permitir insertar detalles de venta
CREATE POLICY "Permitir insercion detalles a autenticados"
ON detalle_ventas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Permitir leer detalles
DROP POLICY IF EXISTS "Permitir lectura detalles autenticados" ON detalle_ventas;
CREATE POLICY "Permitir lectura detalles autenticados"
ON detalle_ventas
FOR SELECT
TO authenticated
USING (true);

-- ==============================================================================
-- PRODUCTOS (Update de stock)
-- ==============================================================================
-- Los cajeros necesitan poder actualizar el stock (UPDATE) al vender
-- O bien, la función RPC 'incrementar_stock' debe ser SECURITY DEFINER.

-- Revisemos si existe política de UPDATE para productos.
-- Por seguridad, agregamos una política que permita UPDATE a autenticados.
DROP POLICY IF EXISTS "Permitir update stock productos" ON productos;
CREATE POLICY "Permitir update stock productos"
ON productos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

