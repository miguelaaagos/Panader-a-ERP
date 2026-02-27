-- Function to safely complete a production order:
-- 1. Validates order exists and is pending
-- 2. Checks sufficient stock for all ingredients
-- 3. Atomically decreases ingredient stocks (USING CONVERSION FACTOR)
-- 4. Atomically increases resulting product stock
-- 5. Marks order as completed and stores ingredient cost

CREATE OR REPLACE FUNCTION complete_production_v1(
    p_order_id UUID,
    p_tenant_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_recipe RECORD;
    v_factor NUMERIC;
    v_ingredient RECORD;
    v_product RECORD;
    v_required_amount NUMERIC;
    v_missing_ingredients TEXT := '';
    v_total_cost NUMERIC := 0;
BEGIN
    -- 1. Get order and lock it
    SELECT * INTO v_order
    FROM ordenes_produccion
    WHERE id = p_order_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada o no pertenece al tenant.';
    END IF;

    IF v_order.estado != 'pendiente' THEN
        RAISE EXCEPTION 'La orden no está en estado pendiente (actual: %).', v_order.estado;
    END IF;

    -- 2. Get recipe
    SELECT * INTO v_recipe
    FROM recetas
    WHERE id = v_order.receta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receta no encontrada.';
    END IF;

    v_factor := v_order.cantidad_a_producir / v_recipe.rendimiento;

    -- 3. Pre-lock and validate all ingredient stocks
    FOR v_ingredient IN 
        SELECT 
            ri.ingrediente_id,
            ri.cantidad,
            p.nombre,
            p.stock_actual,
            p.costo_unitario,
            p.factor_conversion
        FROM receta_ingredientes ri
        JOIN productos p ON p.id = ri.ingrediente_id
        WHERE ri.receta_id = v_recipe.id
        FOR UPDATE OF p -- Lock products!
    LOOP
        -- La cantidad de la receta referida a la "unidad base". 
        -- Para calcular cuánto se descuenta del "stock_actual" (que está en unidad_compra), dividimos.
        v_required_amount := (v_ingredient.cantidad * v_factor) / COALESCE(v_ingredient.factor_conversion, 1);
        
        IF COALESCE(v_ingredient.stock_actual, 0) < v_required_amount THEN
            IF v_missing_ingredients != '' THEN
                v_missing_ingredients := v_missing_ingredients || ', ';
            END IF;
            v_missing_ingredients := v_missing_ingredients || v_ingredient.nombre;
        END IF;

        -- El costo total utiliza el amount ya convertido a la unidad principal (que es el costo referencial)
        v_total_cost := v_total_cost + (v_required_amount * COALESCE(v_ingredient.costo_unitario, 0));
    END LOOP;

    IF v_missing_ingredients != '' THEN
        RAISE EXCEPTION 'Stock insuficiente para los siguientes ingredientes: %', v_missing_ingredients;
    END IF;

    -- 4. Deduct ingredients
    FOR v_ingredient IN 
        SELECT 
            ri.ingrediente_id, 
            ri.cantidad,
            p.factor_conversion
        FROM receta_ingredientes ri
        JOIN productos p ON p.id = ri.ingrediente_id
        WHERE ri.receta_id = v_recipe.id
    LOOP
        v_required_amount := (v_ingredient.cantidad * v_factor) / COALESCE(v_ingredient.factor_conversion, 1);
        
        UPDATE productos
        SET 
            stock_actual = stock_actual - v_required_amount,
            updated_at = NOW()
        WHERE id = v_ingredient.ingrediente_id;
    END LOOP;

    -- 5. Increase generated product stock
    UPDATE productos
    SET 
        stock_actual = COALESCE(stock_actual, 0) + v_order.cantidad_a_producir,
        updated_at = NOW()
    WHERE id = v_order.producto_id;

    -- 6. Finalize order
    UPDATE ordenes_produccion
    SET 
        estado = 'completada',
        fecha_completada = NOW(),
        cantidad_producida = v_order.cantidad_a_producir,
        costo_ingredientes = COALESCE(v_recipe.costo_total, 0) * v_factor,
        updated_at = NOW()
    WHERE id = p_order_id;
    
END;
$$;
