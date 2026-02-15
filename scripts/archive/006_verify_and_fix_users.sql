-- 006_verify_and_fix_users.sql
-- Script para verificar y arreglar el estado de usuarios

-- 1. Ver todos los usuarios y su estado de confirmación
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Confirmar TODOS los usuarios existentes (para desarrollo)
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;

-- 3. Ver los usuarios en la tabla pública
SELECT 
    u.id,
    u.email,
    u.nombre_completo,
    u.role,
    u.tenant_id,
    u.activo
FROM public.usuarios u
ORDER BY u.created_at DESC;

-- 4. OPCIONAL: Crear un usuario admin de prueba
-- Ejecuta esto manualmente si quieres crear un usuario admin desde SQL:
/*
-- Primero inserta en auth.users (reemplaza con tu email y genera un hash de contraseña)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@panaderia.com',
    crypt('admin123', gen_salt('bf')), -- Contraseña: admin123
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador"}'
);
*/

-- Nota: Luego el trigger handle_new_user() creará automáticamente el registro en public.usuarios
