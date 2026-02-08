-- ============================================================
-- SCRIPT DE LIMPIEZA Y RECARGA DE PRODUCTOS
-- ============================================================
-- Este script elimina todos los productos actuales (con datos incorrectos)
-- para que puedas recargarlos con el script Python mejorado
-- 
-- INSTRUCCIONES:
-- 1. PRIMERO ejecuta fix_trigger_precio.sql
-- 2. LUEGO ejecuta este script en Supabase Dashboard > SQL Editor
-- 3. FINALMENTE ejecuta: python cargar_supabase_mejorado.py
-- ============================================================

-- Eliminar todos los productos existentes
DELETE FROM productos;

-- Verificar que la tabla esté vacía
SELECT COUNT(*) as productos_restantes FROM productos;
-- Debería mostrar 0

-- ============================================================
-- NOTA: Después de ejecutar este script, corre en tu terminal:
-- python cargar_supabase_mejorado.py
-- ============================================================
