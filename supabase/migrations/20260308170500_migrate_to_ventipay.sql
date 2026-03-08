-- Migración: Renombrar Stripe a VentiPay en tabla de tenants
-- Fecha: 2026-03-08

BEGIN;

-- Renombrar columnas si existen (para evitar errores si ya se ejecutó algo similar)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.tenants RENAME COLUMN stripe_customer_id TO ventipay_customer_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.tenants RENAME COLUMN stripe_subscription_id TO ventipay_subscription_id;
    END IF;
END $$;

-- Asegurar que los comentarios reflejen el cambio
COMMENT ON COLUMN public.tenants.ventipay_customer_id IS 'ID del cliente en VentiPay (Chile)';
COMMENT ON COLUMN public.tenants.ventipay_subscription_id IS 'ID de la suscripción activa en VentiPay';

-- Refrescar permisos para el super_admin (opcional si ya están por OWNER)
-- GRANT ALL ON public.global_audit_logs TO service_role; -- Ejemplo de lo que podría ir aquí

COMMIT;
