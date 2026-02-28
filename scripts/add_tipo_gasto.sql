-- Añadir columna de tipo de gasto a la tabla gastos
-- 1. Añadimos el tipo Enum 'costo_type' o simplemente un Check Constraint
-- Para máxima compatibilidad con el front optaremos por usar text con un constrain
ALTER TABLE "public"."gastos" 
ADD COLUMN IF NOT EXISTS "tipo_gasto" text NOT NULL DEFAULT 'variable' 
CHECK (tipo_gasto IN ('fijo', 'variable'));

-- Comentario para el metadata
COMMENT ON COLUMN "public"."gastos"."tipo_gasto" IS 'Define si es un costo "fijo" o "variable" mensual.';
