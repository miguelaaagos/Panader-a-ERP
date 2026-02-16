-- Add es_pesable and mostrar_en_pos to productos table
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS es_pesable BOOLEAN DEFAULT false;

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS mostrar_en_pos BOOLEAN DEFAULT true;

-- Update existing products to have reasonable defaults if needed
-- (Though DEFAULT clause handles new rows, let's ensure existing ones are set)
UPDATE productos SET es_pesable = false WHERE es_pesable IS NULL;
UPDATE productos SET mostrar_en_pos = true WHERE mostrar_en_pos IS NULL;
