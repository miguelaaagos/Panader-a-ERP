-- SCRIPT UNIFICADO: 003_complete_schema_setup.sql
-- Este script se "adecua a lo que tienen" (tenants, usuarios con 'role')
-- Y crea todo lo que falta (productos, recetas, ventas, etc.)

-- HABITILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADAPTAR TABLA: tenants (Ya existe, aseguramos columnas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'rut') THEN
        ALTER TABLE tenants ADD COLUMN rut TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'direccion') THEN
        ALTER TABLE tenants ADD COLUMN direccion TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'telefono') THEN
        ALTER TABLE tenants ADD COLUMN telefono TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'email') THEN
        ALTER TABLE tenants ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- 2. ADAPTAR TABLA: usuarios (Ya existe, aseguramos columnas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'nombre_completo') THEN
        ALTER TABLE usuarios ADD COLUMN nombre_completo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'activo') THEN
        ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. CREAR TIPOS ENUM (Si no existen)
DO $$ BEGIN
    CREATE TYPE producto_tipo AS ENUM ('ingrediente', 'producto_terminado', 'ambos');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE unidad_medida AS ENUM ('kg', 'g', 'L', 'ml', 'unidades');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. CREAR TABLA: productos (Si no existe)
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    nombre TEXT NOT NULL,
    codigo TEXT,
    descripcion TEXT,
    tipo producto_tipo NOT NULL,
    categoria TEXT,
    unidad_medida unidad_medida NOT NULL,
    stock_actual DECIMAL(10, 3) DEFAULT 0,
    stock_minimo DECIMAL(10, 3) DEFAULT 0,
    costo_unitario DECIMAL(10, 2),
    precio_venta DECIMAL(10, 2),
    margen_deseado DECIMAL(10, 2),
    tiene_receta BOOLEAN DEFAULT false,
    costo_receta DECIMAL(10, 2),
    precio_sugerido DECIMAL(10, 2),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_productos_tenant_activo ON productos(tenant_id, activo);

-- 5. CREAR TABLA: recetas (Si no existe)
CREATE TABLE IF NOT EXISTS recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    producto_id UUID REFERENCES productos(id) NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    instrucciones TEXT,
    rendimiento DECIMAL(10, 2) NOT NULL,
    costo_total DECIMAL(10, 2),
    costo_por_unidad DECIMAL(10, 2),
    tiempo_preparacion_minutos INTEGER,
    activa BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, producto_id)
);

-- 6. CREAR TABLA: receta_ingredientes (Si no existe)
CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    receta_id UUID REFERENCES recetas(id) NOT NULL,
    ingrediente_id UUID REFERENCES productos(id) NOT NULL,
    cantidad DECIMAL(10, 3) NOT NULL,
    costo_linea DECIMAL(10, 2),
    notas TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(receta_id, ingrediente_id)
);

-- 7. CREAR TABLA: ordenes_produccion (y sus enums)
DO $$ BEGIN
    CREATE TYPE orden_estado AS ENUM ('pendiente', 'en_proceso', 'completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS ordenes_produccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    numero_orden TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_programada DATE,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    receta_id UUID REFERENCES recetas(id) NOT NULL,
    producto_id UUID REFERENCES productos(id) NOT NULL,
    cantidad_a_producir DECIMAL(10, 2) NOT NULL,
    cantidad_producida DECIMAL(10, 2),
    costo_ingredientes DECIMAL(10, 2),
    estado orden_estado NOT NULL,
    notas TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, numero_orden)
);

-- 8. CREAR TABLA: ventas (y sus enums)
DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
    CREATE TYPE venta_estado AS ENUM ('completada', 'anulada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    numero_venta TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cliente_nombre TEXT,
    cliente_rut TEXT,
    subtotal DECIMAL(10, 2),
    descuento DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago metodo_pago,
    estado venta_estado DEFAULT 'completada',
    usuario_id UUID REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, numero_venta)
);

-- 9. CREAR TABLA: venta_detalles
CREATE TABLE IF NOT EXISTS venta_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    venta_id UUID REFERENCES ventas(id) NOT NULL,
    producto_id UUID REFERENCES productos(id) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    costo_unitario DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. HELPER FUNCTIONS (Corregidas para usar 'role')

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT (get_user_role() = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. HABILITAR RLS y POLICIES

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;

-- Usuarios Policies
DROP POLICY IF EXISTS "Users within tenant can view users" ON usuarios;
CREATE POLICY "Users within tenant can view users" ON usuarios FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
CREATE POLICY "Admins can insert users" ON usuarios FOR INSERT WITH CHECK (is_admin() = true);

DROP POLICY IF EXISTS "Admins can update users" ON usuarios;
CREATE POLICY "Admins can update users" ON usuarios FOR UPDATE USING (is_admin() = true);

DROP POLICY IF EXISTS "Admins can delete users" ON usuarios;
CREATE POLICY "Admins can delete users" ON usuarios FOR DELETE USING (is_admin() = true);

-- Productos Policies
DROP POLICY IF EXISTS "View products" ON productos;
CREATE POLICY "View products" ON productos FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Recetas Policies
DROP POLICY IF EXISTS "View recipes (Admin only)" ON recetas;
CREATE POLICY "View recipes (Admin only)" ON recetas FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());

-- Ordenes Produccion Policies
DROP POLICY IF EXISTS "View production (Admin only)" ON ordenes_produccion;
CREATE POLICY "View production (Admin only)" ON ordenes_produccion FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());

-- Ventas Policies
DROP POLICY IF EXISTS "View sales (Admin: all, User: own)" ON ventas;
CREATE POLICY "View sales (Admin: all, User: own)" ON ventas FOR SELECT USING (
    tenant_id = get_user_tenant_id() 
    AND (is_admin() OR usuario_id = auth.uid())
);
DROP POLICY IF EXISTS "Insert sales" ON ventas;
CREATE POLICY "Insert sales" ON ventas FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Venta Detalles Policies
DROP POLICY IF EXISTS "View sales details" ON venta_detalles;
CREATE POLICY "View sales details" ON venta_detalles FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    AND (
        is_admin() 
        OR EXISTS (SELECT 1 FROM ventas WHERE ventas.id = venta_detalles.venta_id AND ventas.usuario_id = auth.uid())
    )
);
DROP POLICY IF EXISTS "Insert sales details" ON venta_detalles;
CREATE POLICY "Insert sales details" ON venta_detalles FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
