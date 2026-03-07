-- Migration: Add horarios_roles and update asistencias

-- 1. Create horarios_roles table
CREATE TABLE IF NOT EXISTS public.horarios_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    rol TEXT NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, rol)
);

-- RLS para horarios_roles
ALTER TABLE public.horarios_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver horarios_roles de su tenant"
ON public.horarios_roles
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Solo admins pueden modificar horarios_roles"
ON public.horarios_roles
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);

-- 2. Update asistencias table
ALTER TABLE public.asistencias 
ADD COLUMN IF NOT EXISTS horas_extra NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Index for querying by state or role efficiency could be added if needed but not strictly required currently.
