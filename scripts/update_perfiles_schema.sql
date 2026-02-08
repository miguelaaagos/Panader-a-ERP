-- Add activo column to perfiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'activo') THEN
        ALTER TABLE perfiles ADD COLUMN activo BOOLEAN DEFAULT true;
    END IF;
END $$;
