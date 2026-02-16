
-- Función para incrementar stock (usada al anular ventas)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual + amount,
        updated_at = NOW()
    WHERE id = product_id;
END;
$$;
