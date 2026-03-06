-- Migración: Módulo de Proveedores
-- Crea la tabla proveedores con RLS para multi-tenant

CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    contacto TEXT,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Usuarios ven proveedores de su tenant" ON public.proveedores
    FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin y manager insertan proveedores" ON public.proveedores
    FOR INSERT WITH CHECK (
        tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
        AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'manager', 'cajero')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin y manager actualizan proveedores" ON public.proveedores
    FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()))
    WITH CHECK ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'manager'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
