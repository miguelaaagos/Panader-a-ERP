-- 004_create_user_trigger.sql
-- Este trigger automáticamente crea un registro en la tabla 'usuarios' 
-- cuando un nuevo usuario se registra via Supabase Auth

-- Función que maneja la creación del usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Por ahora, asignamos al primer tenant disponible
    -- En producción, esto debe venir de la UI de registro
    SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
    
    -- Si no hay tenants, crear uno por defecto
    IF default_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name)
        VALUES ('Panadería Principal')
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Insertar el nuevo usuario en la tabla usuarios
    INSERT INTO public.usuarios (
        id,
        tenant_id,
        email,
        nombre_completo,
        role,
        activo,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        default_tenant_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'cashier', -- Rol por defecto para nuevos usuarios
        true,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Nota: Este script debe ejecutarse en el SQL Editor de Supabase
