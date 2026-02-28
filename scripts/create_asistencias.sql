-- scripts/create_asistencias.sql

-- Eliminamos la tabla si ya existe para asegurar idempotencia en el script
DROP TABLE IF EXISTS public.asistencias CASCADE;

-- Crear tabla asistencias
CREATE TABLE public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    entrada TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    salida TIMESTAMPTZ NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Políticas de RLS
-- ----------------------------------------------------

-- SELECT: Los usuarios (incluyendo admins) solo pueden ver las asistencias que pertenecen a su propio tenant.
CREATE POLICY "Asistencias Select Policy" 
ON public.asistencias 
FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()));

-- INSERT: Solo se pueden crear asistencias para el tenant del usuario, y el `usuario_id` DEBE ser el del usuario autenticado.
-- Esto protege rutas en los clientes para que no inserten a nombre de otro.
CREATE POLICY "Asistencias Insert Policy" 
ON public.asistencias 
FOR INSERT 
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) 
    AND usuario_id = auth.uid()
);

-- UPDATE: Un usuario solo puede actualizar su propia asistencia, típicamente para marcar la salida.
-- El tenant_id debe coincidir (ya inferido por el WHERE del update, pero protegido porsiacaso).
CREATE POLICY "Asistencias Update Policy" 
ON public.asistencias 
FOR UPDATE 
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) 
    AND (
        usuario_id = auth.uid() 
        OR (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'manager')
    )
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid())
);

-- DELETE: Por seguridad solo admin/manager podrían (y rara vez, es mejor solo soft-delete o ni permitir).
-- Aquí lo permitiremos pero restringido a perfiles altos del Tenant.
CREATE POLICY "Asistencias Delete Policy" 
ON public.asistencias 
FOR DELETE 
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) 
    AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'manager')
);


-- ----------------------------------------------------
-- Índices para Performance de Querys
-- ----------------------------------------------------
CREATE INDEX idx_asistencias_tenant_id ON public.asistencias(tenant_id);
CREATE INDEX idx_asistencias_usuario_id ON public.asistencias(usuario_id);
CREATE INDEX idx_asistencias_entrada ON public.asistencias(entrada);

-- Comentario a la Tabla
COMMENT ON TABLE public.asistencias IS 'Registro de fichaje (reloj de asistencia) por cada empleado, aisaldo por tenant.';
