-- Crear tabla de logs de auditoría global
CREATE TABLE IF NOT EXISTS public.global_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB
);

-- Habilitar RLS
ALTER TABLE public.global_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Solo super_admin puede ver logs globales
CREATE POLICY "Super admins can see global audit logs"
ON public.global_audit_logs
FOR SELECT
TO authenticated
USING (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'super_admin'
);

-- Función para actualizar plan de tenant con logging (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_tenant_subscription_tier(
    p_tenant_id UUID,
    p_new_tier public.subscription_tier,
    p_admin_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_tier public.subscription_tier;
BEGIN
    -- Verificar que el ejecutor sea super_admin
    IF NOT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = p_admin_id AND rol = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'No autorizado. Se requiere rol super_admin.';
    END IF;

    -- Obtener valor antiguo
    SELECT subscription_tier INTO v_old_tier FROM public.tenants WHERE id = p_tenant_id;

    -- Actualizar tenant
    UPDATE public.tenants 
    SET subscription_tier = p_new_tier 
    WHERE id = p_tenant_id;

    -- Registrar log
    INSERT INTO public.global_audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        p_admin_id,
        'update_subscription',
        'tenant',
        p_tenant_id::text,
        jsonb_build_object('tier', v_old_tier),
        jsonb_build_object('tier', p_new_tier)
    );
END;
$$;
