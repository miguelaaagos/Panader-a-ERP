-- ============================================================
-- MIGRACIÓN: Agregar soporte para Boletas y Facturas
-- ============================================================
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Paso 1: Agregar columnas a tabla ventas para documentos
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(10) DEFAULT 'boleta',
ADD COLUMN IF NOT EXISTS cliente_rut VARCHAR(12),
ADD COLUMN IF NOT EXISTS cliente_razon_social VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_direccion TEXT,
ADD COLUMN IF NOT EXISTS cliente_giro VARCHAR(255);

-- Paso 2: Crear tabla de clientes para reutilizar datos
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(12) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    direccion TEXT,
    giro VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paso 3: Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_documento ON ventas(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_rut ON ventas(cliente_rut);
CREATE INDEX IF NOT EXISTS idx_clientes_rut ON clientes(rut);

-- Paso 4: Agregar columnas opcionales para anulación de ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS anulada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
ADD COLUMN IF NOT EXISTS anulada_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS anulada_at TIMESTAMPTZ;

-- Paso 5: Crear índice para ventas anuladas
CREATE INDEX IF NOT EXISTS idx_ventas_anulada ON ventas(anulada);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecuta esto para verificar que las columnas se agregaron:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ventas'
ORDER BY ordinal_position;

-- Verifica que la tabla clientes existe:
SELECT * FROM clientes LIMIT 1;
