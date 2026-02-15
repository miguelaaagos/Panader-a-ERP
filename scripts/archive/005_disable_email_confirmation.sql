-- 005_disable_email_confirmation.sql
-- Este script confirma manualmente los usuarios existentes que no han confirmado su email
-- IMPORTANTE: Solo para desarrollo. En producción deberías usar confirmación de email.

-- Confirmar todos los usuarios no confirmados
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Nota: Para deshabilitar la confirmación de email para NUEVOS usuarios,
-- debes hacerlo desde el Dashboard de Supabase:
-- 1. Ve a Authentication > Settings
-- 2. En "Email Auth" desmarca "Enable email confirmations"
-- 3. Guarda los cambios
