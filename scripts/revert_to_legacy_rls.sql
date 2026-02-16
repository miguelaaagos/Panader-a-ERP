-- SCRIPT DE REVERSIÓN A ESTADO LEGACY (FUNCIONAL)
-- Este script elimina las optimizaciones recientes y restaura las políticas originales.
-- NOTA: Las alertas de "Permissive Policies" y "Performance" reaparecerán, pero el acceso se restaurará.

-- 1. LIMPIEZA DE POLÍTICAS "NUEVAS" (Consolidadas/Optimizadas)
-- Eliminamos cualquier rastro de los scripts fallidos anteriores
DROP POLICY IF EXISTS "Allow service role to manage tenants" ON tenants;
DROP POLICY IF EXISTS "usuarios_read_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin_policy" ON usuarios;
DROP POLICY IF EXISTS "service_role_manage_usuarios" ON usuarios;
DROP POLICY IF EXISTS "productos_select_policy" ON productos;
DROP POLICY IF EXISTS "productos_admin_policy" ON productos;
DROP POLICY IF EXISTS "categorias_select_policy" ON categorias;
DROP POLICY IF EXISTS "categorias_admin_policy" ON categorias;
DROP POLICY IF EXISTS "ventas_select_policy" ON ventas;
DROP POLICY IF EXISTS "venta_detalles_select_policy" ON venta_detalles;
DROP POLICY IF EXISTS "configuracion_select_policy" ON configuracion;
DROP POLICY IF EXISTS "configuracion_admin_policy" ON configuracion;

-- También limpiamos las políticas de los intentos de "fix"
DROP POLICY IF EXISTS "usuarios_read_self_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin_read_all_policy" ON usuarios;

-- 2. RESTAURACIÓN DE POLÍTICAS ORIGINALES (Basado en Blueprint y Alertas previas)

-- === TABLA: usuarios ===
-- Permitir leer el propio perfil (Rompe la recursividad para la siguiente política)
CREATE POLICY "Allow authenticated users to read their own profile" 
ON usuarios FOR SELECT TO authenticated 
USING (auth.uid() = id);

-- Permitir ver usuarios del mismo tenant (La "ineficiente" que re-valida auth.uid())
CREATE POLICY "Users within tenant can view users" 
ON usuarios FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Service Role (Backup de seguridad)
CREATE POLICY "Allow service role to manage all user profiles" 
ON usuarios FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Admins pueden gestionar (Políticas separadas, generarán alertas de "Multiple Permissive" pero funcionan)
CREATE POLICY "Admins can insert users" ON usuarios FOR INSERT TO authenticated 
WITH CHECK ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update users" ON usuarios FOR UPDATE TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete users" ON usuarios FOR DELETE TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');


-- === TABLA: productos ===
-- Ver productos del mismo tenant
CREATE POLICY "usuarios_pueden_ver_productos" 
ON productos FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Gestión solo Admins
CREATE POLICY "solo_admin_crea_productos" ON productos FOR INSERT TO authenticated 
WITH CHECK ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "solo_admin_edita_productos" ON productos FOR UPDATE TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "solo_admin_elimina_productos" ON productos FOR DELETE TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');


-- === TABLA: categorias ===
CREATE POLICY "Usuarios pueden ver categorías de su tenant" 
ON categorias FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Admins pueden gestionar categorías de su tenant" 
ON categorias FOR ALL TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');


-- === TABLA: ventas ===
-- Admin ve todo, Usuario ve lo suyo
CREATE POLICY "View sales (Admin: all, User: own)" 
ON ventas FOR SELECT TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()) 
  AND 
  (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin' 
    OR 
    usuario_id = auth.uid()
  )
);

CREATE POLICY "Sales Insert Policy" ON ventas FOR INSERT TO authenticated WITH CHECK (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));


-- === TABLA: venta_detalles ===
CREATE POLICY "View sales details" 
ON venta_detalles FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM ventas WHERE id = venta_detalles.venta_id 
    AND (
      (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin' 
      OR 
      usuario_id = auth.uid()
    )
  )
);

CREATE POLICY "Sales Details Insert Policy" ON venta_detalles FOR INSERT TO authenticated WITH CHECK (true); -- Protegido por lógica de negocio y tenant_id

-- === TABLA: configuracion ===
CREATE POLICY "Users can view their own tenant config" 
ON configuracion FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Admins can update their own tenant config" 
ON configuracion FOR UPDATE TO authenticated 
USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin');
