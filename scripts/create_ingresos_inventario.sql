-- Migración para Ingreso Masivo de Inventario e Historial
-- Tablas y RPC Funciones

-- Tabla cabecera: ingresos_inventario
CREATE TABLE IF NOT EXISTS public.ingresos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en cabecera
ALTER TABLE public.ingresos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver ingresos de su tenant"
ON public.ingresos_inventario
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));

-- Solo el RPC o usuarios con rol pueden insertar, pero como usaremos SECURITY DEFINER en el RPC, esto es suficiente para select.

-- Tabla detalle: ingreso_inventario_detalles
CREATE TABLE IF NOT EXISTS public.ingreso_inventario_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingreso_id UUID NOT NULL REFERENCES public.ingresos_inventario(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC NOT NULL CHECK (costo_unitario >= 0)
);

-- Habilitar RLS en detalles
ALTER TABLE public.ingreso_inventario_detalles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver detalles de ingresos de su tenant"
ON public.ingreso_inventario_detalles
FOR SELECT
USING (ingreso_id IN (SELECT id FROM public.ingresos_inventario WHERE tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())));


-- Tipo para recibir el array de detalles en el RPC
DROP TYPE IF EXISTS public.ingreso_detalle_type CASCADE;
CREATE TYPE public.ingreso_detalle_type AS (
    producto_id UUID,
    cantidad NUMERIC,
    costo_unitario NUMERIC
);

-- RPC para procesar el ingreso de inventario atómicamente
CREATE OR REPLACE FUNCTION public.procesar_ingreso_inventario(
    p_tenant_id UUID,
    p_usuario_id UUID,
    p_detalles public.ingreso_detalle_type[],
    p_observaciones TEXT DEFAULT NULL
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
BEGIN
    -- Validar que el usuario pertenezca al tenant que está asignando
    IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Usuario no válido para este tenant';
    END IF;

    -- Validar que el arreglo no esté vacío
    IF array_length(p_detalles, 1) IS NULL THEN
        RAISE EXCEPTION 'El ingreso debe contener al menos un detalle';
    END IF;

    -- Generar un código correlativo simple para el tenant (IN-0000001)
    -- Contamos cuántos hay para este tenant y sumamos 1. 
    -- (No es perfectamente concurrente a nivel base de datos sin una tabla de secuencia por tenant, pero suficiente para este caso).
    SELECT count(*) INTO v_nuevo_correlativo FROM public.ingresos_inventario WHERE tenant_id = p_tenant_id;
    v_nuevo_correlativo := v_nuevo_correlativo + 1;
    v_nuevo_codigo := 'IN-' || lpad(v_nuevo_correlativo::text, 7, '0');

    -- Insertar Cabecera
    INSERT INTO public.ingresos_inventario (tenant_id, usuario_id, codigo, observaciones)
    VALUES (p_tenant_id, p_usuario_id, v_nuevo_codigo, p_observaciones)
    RETURNING id INTO v_ingreso_id;

    -- Iterar e Insertar Detalles + Actualizar Stock
    FOR v_index IN 1 .. array_length(p_detalles, 1) LOOP
        v_detalle := p_detalles[v_index];

        -- Verificar que la cantidad sea > 0
        IF v_detalle.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad procesada para el producto % debe ser mayor a 0', v_detalle.producto_id;
        END IF;

        -- 1. Insertar el detalle
        INSERT INTO public.ingreso_inventario_detalles (ingreso_id, producto_id, cantidad, costo_unitario)
        VALUES (v_ingreso_id, v_detalle.producto_id, v_detalle.cantidad, v_detalle.costo_unitario);

        -- 2. Bloquear y Sumar el stock en la tabla productos
        SELECT stock_actual INTO v_stock_actual
        FROM public.productos
        WHERE id = v_detalle.producto_id AND tenant_id = p_tenant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado para este tenant', v_detalle.producto_id;
        END IF;

        UPDATE public.productos
        SET stock_actual = v_stock_actual + v_detalle.cantidad,
            -- Opcional: Actualizar el costo unitario basado en el nuevo costo? 
            -- (Mantenemos el existente a menos que el user cambie, o actualizamos si p_costo es diferente, para simplicidad omitiremos cambiar el costo base de forma automatica)
            updated_at = now()
        WHERE id = v_detalle.producto_id;

    END LOOP;

    RETURN json_build_object(
        'success', true,
        'ingreso_id', v_ingreso_id,
        'codigo', v_nuevo_codigo
    );
EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;
