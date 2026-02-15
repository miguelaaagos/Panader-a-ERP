-- Tabla para sesiones de caja (Arqueos)
CREATE TABLE IF NOT EXISTS arqueos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monto_ventas_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monto_ventas_otros NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monto_final_real NUMERIC(12, 2), -- Lo que el usuario cuenta al cerrar
    estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE arqueos_caja ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own tenant's cash sessions"
    ON arqueos_caja FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Users can insert cash sessions for their tenant"
    ON arqueos_caja FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Users can update their own tenant's cash sessions"
    ON arqueos_caja FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Índices
CREATE INDEX idx_arqueos_tenant ON arqueos_caja(tenant_id);
CREATE INDEX idx_arqueos_usuario ON arqueos_caja(usuario_id);
CREATE INDEX idx_arqueos_estado ON arqueos_caja(estado);
