-- Migration: Add proveedores, and add estados to gastos and ingresos_inventario

-- 1. Create proveedores table
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rut TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver proveedores de su tenant" ON public.proveedores FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "Admins pueden modificar proveedores" ON public.proveedores FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);

-- 2. Add proveedor_id to ingresos_inventario
ALTER TABLE public.ingresos_inventario ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;

-- 3. Add estado to ingresos_inventario
ALTER TABLE public.ingresos_inventario ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'completada' CHECK(estado IN ('completada', 'anulada'));

-- 4. Add estado to gastos
ALTER TABLE public.gastos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'completada' CHECK(estado IN ('completada', 'anulada'));
