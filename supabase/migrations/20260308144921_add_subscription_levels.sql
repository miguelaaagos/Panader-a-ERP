-- Crear tipo enumerado para los niveles de suscripción
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE public.subscription_tier AS ENUM ('initial', 'advanced', 'pro');
    END IF;
END $$;

-- Añadir columnas a la tabla tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_tier public.subscription_tier DEFAULT 'initial',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

-- Comentarios para documentación y herramientas de IA
COMMENT ON COLUMN public.tenants.subscription_tier IS 'Nivel de plan del tenant: initial, advanced, pro';
COMMENT ON COLUMN public.tenants.subscription_status IS 'Estado de la suscripción (Stripe sync): active, trailing, past_due, canceled, etc.';
COMMENT ON COLUMN public.tenants.stripe_customer_id IS 'ID de cliente de Stripe para vinculación futura';
COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'ID de suscripción de Stripe activa';

-- Ejemplo de cómo se usaría en RLS (referencia futura):
-- CREATE POLICY "Pro access only" ON public.recetas
-- FOR SELECT TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.tenants t 
--     WHERE t.id = public.recetas.tenant_id 
--     AND t.subscription_tier IN ('advanced', 'pro')
--   )
-- );
