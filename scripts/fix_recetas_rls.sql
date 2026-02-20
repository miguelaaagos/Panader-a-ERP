-- SOLUCIÓN PARA EL ERROR DE RLS AL CREAR RECETAS
-- Ejecuta este script en el SQL Editor de Supabase (dashboard)

-- Asegurarse de que RLS está habilitado
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para la tabla 'recetas'
DROP POLICY IF EXISTS "Ver recetas del mismo tenant" ON recetas;
CREATE POLICY "Ver recetas del mismo tenant" 
ON recetas FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insertar recetas (admin, mismo tenant)" ON recetas;
CREATE POLICY "Insertar recetas (admin, mismo tenant)" 
ON recetas FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Actualizar recetas (admin, mismo tenant)" ON recetas;
CREATE POLICY "Actualizar recetas (admin, mismo tenant)" 
ON recetas FOR UPDATE TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Eliminar recetas (admin, mismo tenant)" ON recetas;
CREATE POLICY "Eliminar recetas (admin, mismo tenant)" 
ON recetas FOR DELETE TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);


-- 2. Políticas para la tabla 'receta_ingredientes'
DROP POLICY IF EXISTS "Ver ingredientes de recetas del mismo tenant" ON receta_ingredientes;
CREATE POLICY "Ver ingredientes de recetas del mismo tenant" 
ON receta_ingredientes FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insertar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;
CREATE POLICY "Insertar ingredientes de recetas (admin, mismo tenant)" 
ON receta_ingredientes FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Actualizar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;
CREATE POLICY "Actualizar ingredientes de recetas (admin, mismo tenant)" 
ON receta_ingredientes FOR UPDATE TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Eliminar ingredientes de recetas (admin, mismo tenant)" ON receta_ingredientes;
CREATE POLICY "Eliminar ingredientes de recetas (admin, mismo tenant)" 
ON receta_ingredientes FOR DELETE TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Como medida adicional de seguridad si todo falla, habilitar todo a service role
DROP POLICY IF EXISTS "Allow service role to manage recetas" ON recetas;
CREATE POLICY "Allow service role to manage recetas" 
ON recetas FOR ALL TO service_role 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to manage receta_ingredientes" ON receta_ingredientes;
CREATE POLICY "Allow service role to manage receta_ingredientes" 
ON receta_ingredientes FOR ALL TO service_role 
USING (true) WITH CHECK (true);

