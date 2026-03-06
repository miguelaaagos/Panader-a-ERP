-- Migración: Agregar proveedor_id a ingresos_inventario y actualizar RPC
-- NOTA: Ejecutar DESPUÉS de create_proveedores.sql

-- 1. Agregar columna proveedor_id a ingresos_inventario
ALTER TABLE public.ingresos_inventario
ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;

-- 2. Actualizar el RPC procesar_ingreso_inventario para aceptar proveedor_id
CREATE OR REPLACE FUNCTION public.procesar_ingreso_inventario(
    p_tenant_id UUID,
    p_usuario_id UUID,
    p_detalles public.ingreso_detalle_type[],
    p_observaciones TEXT DEFAULT NULL,
    p_subtotal NUMERIC DEFAULT 0,
    p_monto_iva NUMERIC DEFAULT 0,
    p_total NUMERIC DEFAULT 0,
    p_tipo_documento TEXT DEFAULT 'Otro',
    p_generar_gasto BOOLEAN DEFAULT false,
    p_proveedor_id UUID DEFAULT NULL
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

    -- Validar proveedor si se especificó
    IF p_proveedor_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.proveedores WHERE id = p_proveedor_id AND tenant_id = p_tenant_id) THEN
            RAISE EXCEPTION 'Proveedor no válido para este tenant';
        END IF;
    END IF;

    -- Generar código
    SELECT count(*) INTO v_nuevo_correlativo FROM public.ingresos_inventario WHERE tenant_id = p_tenant_id;
    v_nuevo_correlativo := v_nuevo_correlativo + 1;
    v_nuevo_codigo := 'IN-' || lpad(v_nuevo_correlativo::text, 7, '0');

    -- Insertar Cabecera de Ingreso (ahora incluye proveedor_id)
    INSERT INTO public.ingresos_inventario (
        tenant_id, usuario_id, codigo, observaciones,
        subtotal, monto_iva, total, tipo_documento, generar_gasto, proveedor_id
    )
    VALUES (
        p_tenant_id, p_usuario_id, v_nuevo_codigo, p_observaciones,
        p_subtotal, p_monto_iva, p_total, p_tipo_documento, p_generar_gasto, p_proveedor_id
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
        SELECT id INTO v_categoria_gasto_id FROM public.categorias_gastos WHERE tenant_id = p_tenant_id AND nombre = 'Compras de Inventario' LIMIT 1;

        IF v_categoria_gasto_id IS NULL THEN
            INSERT INTO public.categorias_gastos (tenant_id, nombre, descripcion)
            VALUES (p_tenant_id, 'Compras de Inventario', 'Gastos generados automáticamente por compras de inventario')
            RETURNING id INTO v_categoria_gasto_id;
        END IF;

        INSERT INTO public.gastos (
            tenant_id, usuario_id, categoria_id, descripcion,
            monto_neto, monto_iva, monto_total, tipo_documento,
            fecha_gasto, ingreso_inventario_id
        )
        VALUES (
            p_tenant_id, p_usuario_id, v_categoria_gasto_id, 'Compra de inventario (Compra ' || v_nuevo_codigo || ')',
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
