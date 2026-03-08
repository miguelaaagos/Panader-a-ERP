-- Drop existing FK if it points to auth.users (common in some setups but breaks public joins)
ALTER TABLE "public"."horarios_usuarios" 
DROP CONSTRAINT IF EXISTS "horarios_usuarios_usuario_id_fkey";

-- Add correct FK relationship between horarios_usuarios and public.usuarios
ALTER TABLE "public"."horarios_usuarios" 
ADD CONSTRAINT "horarios_usuarios_usuario_id_fkey" 
FOREIGN KEY ("usuario_id") 
REFERENCES "public"."usuarios"("id") 
ON DELETE CASCADE;

-- Add index for performance on joins
CREATE INDEX IF NOT EXISTS "idx_horarios_usuarios_usuario_id" ON "public"."horarios_usuarios" ("usuario_id");
