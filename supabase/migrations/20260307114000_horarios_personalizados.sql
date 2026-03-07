-- Migration: Create horarios_usuarios table for per-user daily schedules

CREATE TABLE IF NOT EXISTS public.horarios_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7), -- 1: Lunes, 7: Domingo
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, usuario_id, dia_semana)
);

-- RLS para horarios_usuarios
ALTER TABLE public.horarios_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver horarios_usuarios de su tenant"
ON public.horarios_usuarios
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Solo admins pueden modificar horarios_usuarios"
ON public.horarios_usuarios
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);
