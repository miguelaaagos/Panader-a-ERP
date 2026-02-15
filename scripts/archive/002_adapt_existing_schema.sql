-- Script to adapt existing schema (tenants, usuarios) to Blueprint requirements
-- and fix the "column rol does not exist" error.

-- 1. ADAPT TENANTS TABLE
-- We keep 'name' as is, but ensure other Blueprint columns exist.
DO $$ 
BEGIN
    -- Add 'rut' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'rut') THEN
        ALTER TABLE tenants ADD COLUMN rut TEXT;
    END IF;
    -- Add 'direccion' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'direccion') THEN
        ALTER TABLE tenants ADD COLUMN direccion TEXT;
    END IF;
    -- Add 'telefono' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'telefono') THEN
        ALTER TABLE tenants ADD COLUMN telefono TEXT;
    END IF;
    -- Add 'email' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'email') THEN
        ALTER TABLE tenants ADD COLUMN email TEXT;
    END IF;
    -- Add 'logo_url' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- 2. ADAPT USUARIOS TABLE
-- We keep 'role' (text) as is.
DO $$ 
BEGIN
    -- Add 'nombre_completo' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'nombre_completo') THEN
        ALTER TABLE usuarios ADD COLUMN nombre_completo TEXT;
    END IF;
    -- Add 'activo' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'activo') THEN
        ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. UPDATE HELPER FUNCTIONS TO USE 'role' (TEXT) instead of 'rol' (ENUM)

-- Drop old function if it was created with errors or wrong name
DROP FUNCTION IF EXISTS get_user_rol();

-- Create new function using 'role' column
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update is_admin to use the new function and check for text 'admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT (get_user_role() = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. UPDATE POLICIES TO USE NEW FUNCTIONS

-- Recetas
DROP POLICY IF EXISTS "View recipes (Admin only)" ON recetas;
CREATE POLICY "View recipes (Admin only)" ON recetas FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());

-- Ordenes Produccion
DROP POLICY IF EXISTS "View production (Admin only)" ON ordenes_produccion;
CREATE POLICY "View production (Admin only)" ON ordenes_produccion FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());

-- Ventas
DROP POLICY IF EXISTS "View sales (Admin: all, User: own)" ON ventas;
CREATE POLICY "View sales (Admin: all, User: own)" ON ventas FOR SELECT USING (
    tenant_id = get_user_tenant_id() 
    AND (is_admin() OR usuario_id = auth.uid())
);

-- Venta Detalles
DROP POLICY IF EXISTS "View sales details (Admin: all, User: own via sale)" ON venta_detalles;
CREATE POLICY "View sales details (Admin: all, User: own via sale)" ON venta_detalles FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    AND (
        is_admin() 
        OR EXISTS (SELECT 1 FROM ventas WHERE ventas.id = venta_detalles.venta_id AND ventas.usuario_id = auth.uid())
    )
);

-- Usuarios Policies (Updated for role vs rol)
DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
CREATE POLICY "Admins can insert users" ON usuarios FOR INSERT WITH CHECK (is_admin() = true);

DROP POLICY IF EXISTS "Admins can update users" ON usuarios;
CREATE POLICY "Admins can update users" ON usuarios FOR UPDATE USING (is_admin() = true);

DROP POLICY IF EXISTS "Admins can delete users" ON usuarios;
CREATE POLICY "Admins can delete users" ON usuarios FOR DELETE USING (is_admin() = true);
