-- script para correr en supabase studio
ALTER TABLE public.productos
ADD COLUMN unidad_medida_base public.unidad_medida NULL,
ADD COLUMN factor_conversion NUMERIC DEFAULT 1 NULL;

-- Asegurarse de que si el producto es ingrediente, asuma 1 por defecto al principio
UPDATE public.productos
SET 
  unidad_medida_base = unidad_medida,
  factor_conversion = 1
WHERE tipo IN ('ingrediente', 'ambos');
