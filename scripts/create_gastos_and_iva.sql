-- Migración para añadir soporte de IVA (Impuestos) y el Módulo de Gastos a los ingresos de inventario.

-- 1. Modificar tabla de ingresos_inventario para soportar totales, IVA, tipo_documento y flag de generación de gasto
ALTER TABLE public.ingresos_inventario 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_iva NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_documento TEXT DEFAULT 'Otro',
ADD COLUMN IF NOT EXISTS generar_gasto BOOLEAN DEFAULT false;

-- 2. Crear tabla categorias_gastos
CREATE TABLE IF NOT EXISTS public.categorias_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categorias_gastos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Usuarios ven categorias de su tenant" ON public.categorias_gastos
    FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Solo admin o manager insertan categorias" ON public.categorias_gastos
    FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'manager'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Crear tabla gastos
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    categoria_id UUID REFERENCES public.categorias_gastos(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    monto_neto NUMERIC DEFAULT 0 NOT NULL,
    monto_iva NUMERIC DEFAULT 0 NOT NULL,
    monto_total NUMERIC DEFAULT 0 NOT NULL,
    tipo_documento TEXT DEFAULT 'Otro' NOT NULL,
    fecha_gasto TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ingreso_inventario_id UUID REFERENCES public.ingresos_inventario(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Usuarios ven gastos de su tenant" ON public.gastos
    FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Modificar el RPC procesar_ingreso_inventario
CREATE OR REPLACE FUNCTION public.procesar_ingreso_inventario(
    p_tenant_id UUID,
    p_usuario_id UUID,
    p_detalles public.ingreso_detalle_type[],
    p_observaciones TEXT DEFAULT NULL,
    p_subtotal NUMERIC DEFAULT 0,
    p_monto_iva NUMERIC DEFAULT 0,
    p_total NUMERIC DEFAULT 0,
    p_tipo_documento TEXT DEFAULT 'Otro',
    p_generar_gasto BOOLEAN DEFAULT false
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_nuevo_correlativo INTEGER;
    v_nuevo_codigo TEXT;
    v_ingreso_id UUID;
    v_detalle public.ingreso_detalle_type;
    v_stock_actual NUMERIC;
    v_index INT;
    v_categoria_gasto_id UUID;
BEGIN
    -- Validar usuario/tenant
    IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Usuario no válido para este tenant';
    END IF;

    IF array_length(p_detalles, 1) IS NULL THEN
        RAISE EXCEPTION 'El ingreso debe contener al menos un detalle';
    END IF;

    -- Generar código
    SELECT count(*) INTO v_nuevo_correlativo FROM public.ingresos_inventario WHERE tenant_id = p_tenant_id;
    v_nuevo_correlativo := v_nuevo_correlativo + 1;
    v_nuevo_codigo := 'IN-' || lpad(v_nuevo_correlativo::text, 7, '0');

    -- Insertar Cabecera de Ingreso
    INSERT INTO public.ingresos_inventario (
        tenant_id, usuario_id, codigo, observaciones, 
        subtotal, monto_iva, total, tipo_documento, generar_gasto
    )
    VALUES (
        p_tenant_id, p_usuario_id, v_nuevo_codigo, p_observaciones, 
        p_subtotal, p_monto_iva, p_total, p_tipo_documento, p_generar_gasto
    )
    RETURNING id INTO v_ingreso_id;

    -- Iterar detalles
    FOR v_index IN 1 .. array_length(p_detalles, 1) LOOP
        v_detalle := p_detalles[v_index];

        IF v_detalle.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad procesada para el producto % debe ser mayor a 0', v_detalle.producto_id;
        END IF;

        IF v_detalle.costo_unitario < 0 THEN
            RAISE EXCEPTION 'El costo del producto % no puede ser negativo', v_detalle.producto_id;
        END IF;

        -- Actualizar costo unitario y stock atomically (SELECT FOR UPDATE)
        SELECT stock_actual INTO v_stock_actual 
        FROM public.productos 
        WHERE id = v_detalle.producto_id AND tenant_id = p_tenant_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto % no encontrado o no pertenece al tenant', v_detalle.producto_id;
        END IF;

        UPDATE public.productos
        SET 
            stock_actual = stock_actual + v_detalle.cantidad,
            costo_unitario = v_detalle.costo_unitario 
        WHERE id = v_detalle.producto_id AND tenant_id = p_tenant_id;

        INSERT INTO public.ingreso_inventario_detalles (ingreso_id, producto_id, cantidad, costo_unitario)
        VALUES (v_ingreso_id, v_detalle.producto_id, v_detalle.cantidad, v_detalle.costo_unitario);
    END LOOP;

    -- Generar Gasto automáticamente si aplica
    IF p_generar_gasto THEN
        -- Buscar la categoría de gasto "Compras de Inventario"
        SELECT id INTO v_categoria_gasto_id FROM public.categorias_gastos WHERE tenant_id = p_tenant_id AND nombre = 'Compras de Inventario' LIMIT 1;
        
        -- Si no existe, crearla
        IF v_categoria_gasto_id IS NULL THEN
            INSERT INTO public.categorias_gastos (tenant_id, nombre, descripcion) 
            VALUES (p_tenant_id, 'Compras de Inventario', 'Gastos generados automáticamente por compras de inventario')
            RETURNING id INTO v_categoria_gasto_id;
        END IF;

        -- Insertar el Gasto
        INSERT INTO public.gastos (
            tenant_id, usuario_id, categoria_id, descripcion, 
            monto_neto, monto_iva, monto_total, tipo_documento, 
            fecha_gasto, ingreso_inventario_id
        )
        VALUES (
            p_tenant_id, p_usuario_id, v_categoria_gasto_id, 'Compra de inventario (Ingreso ' || v_nuevo_codigo || ')', 
            p_subtotal, p_monto_iva, p_total, p_tipo_documento, 
            now(), v_ingreso_id
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'ingreso_id', v_ingreso_id,
        'codigo', v_nuevo_codigo,
        'genero_gasto', p_generar_gasto
    );
END;
$$;
