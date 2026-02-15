-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    rut TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: usuarios
-- Note: Check if type exists before creating
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'cajero');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    rol user_role NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, email)
);

-- 3. TABLA: productos
DO $$ BEGIN
    CREATE TYPE producto_tipo AS ENUM ('ingrediente', 'producto_terminado', 'ambos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE unidad_medida AS ENUM ('kg', 'g', 'L', 'ml', 'unidades');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);

-- 4. TABLA: recetas
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

-- 5. TABLA: receta_ingredientes
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

-- 6. TABLA: ordenes_produccion
DO $$ BEGIN
    CREATE TYPE orden_estado AS ENUM ('pendiente', 'en_proceso', 'completada', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- 7. TABLA: ventas
DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE venta_estado AS ENUM ('completada', 'anulada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- 8. TABLA: venta_detalles
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

-- RLS Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS user_role AS $$
    SELECT rol FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT (get_user_rol() = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies
-- usuarios
DO $$ BEGIN
    CREATE POLICY "Users within tenant can view users" ON usuarios FOR SELECT USING (tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert users" ON usuarios FOR INSERT WITH CHECK (is_admin() = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update users" ON usuarios FOR UPDATE USING (is_admin() = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can delete users" ON usuarios FOR DELETE USING (is_admin() = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- productos
DO $$ BEGIN
    CREATE POLICY "View products" ON productos FOR SELECT USING (tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- recetas
DO $$ BEGIN
    CREATE POLICY "View recipes (Admin only)" ON recetas FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ordenes_produccion
DO $$ BEGIN
    CREATE POLICY "View production (Admin only)" ON ordenes_produccion FOR SELECT USING (is_admin() = true AND tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ventas
DO $$ BEGIN
    CREATE POLICY "View sales (Admin: all, User: own)" ON ventas FOR SELECT USING (
        tenant_id = get_user_tenant_id() 
        AND (is_admin() OR usuario_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Insert sales" ON ventas FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- venta_detalles
DO $$ BEGIN
    CREATE POLICY "View sales details (Admin: all, User: own via sale)" ON venta_detalles FOR SELECT USING (
        tenant_id = get_user_tenant_id()
        AND (
            is_admin() 
            OR EXISTS (SELECT 1 FROM ventas WHERE ventas.id = venta_detalles.venta_id AND ventas.usuario_id = auth.uid())
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Insert sales details" ON venta_detalles FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
