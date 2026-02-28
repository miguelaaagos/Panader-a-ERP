"use server";

import { createClient } from "@/lib/supabase/server";
import { validateRequest } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";

export async function getEstadoAsistencia() {
    const { user_id, profile } = await validateRequest();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("asistencias")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("usuario_id", user_id)
        .is("salida", null)
        .order("entrada", { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 is "No rows found"
        console.error("Error obteniendo estado de asistencia:", error);
        return { success: false, error: "Error al verificar asistencia activa." };
    }

    return { success: true, activeTurn: data || null };
}

export async function marcarEntrada() {
    const { user_id, profile } = await validateRequest();
    const supabase = await createClient();

    // Validate double entry
    const { activeTurn } = await getEstadoAsistencia();
    if (activeTurn) {
        return { success: false, error: "Ya existe un turno activo sin marcar salida." };
    }

    const { data, error } = await supabase
        .from("asistencias")
        .insert({
            tenant_id: profile.tenant_id,
            usuario_id: user_id,
            // entrada is set by default to now() in DB
        })
        .select()
        .single();

    if (error) {
        console.error("Error al marcar entrada:", error);
        return { success: false, error: "Error al registrar la entrada." };
    }

    revalidatePath("/dashboard/asistencia");
    return { success: true, data };
}

export async function marcarSalida(asistenciaId: string) {
    const { user_id, profile } = await validateRequest();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("asistencias")
        .update({ salida: new Date().toISOString() })
        .eq("id", asistenciaId)
        .eq("tenant_id", profile.tenant_id)
        .eq("usuario_id", user_id)
        .is("salida", null)
        .select()
        .single();

    if (error) {
        console.error("Error al marcar salida:", error);
        return { success: false, error: "Error al registrar la salida. Verifique que el turno siga activo." };
    }

    revalidatePath("/dashboard/asistencia");
    return { success: true, data };
}

export async function getAsistenciasRecientes({
    limit = 50,
    offset = 0,
    month,
    year,
}: {
    limit?: number;
    offset?: number;
    month?: number; // 1-12
    year?: number;
}) {
    const { user_id, profile } = await validateRequest();
    const supabase = await createClient();

    let query = supabase
        .from("asistencias")
        .select(`
      *,
      usuarios!asistencias_usuario_id_fkey (
        nombre_completo,
        email,
        rol
      )
    `, { count: "exact" })
        .eq("tenant_id", profile.tenant_id)
        .order("entrada", { ascending: false });

    // Si no es admin, solo ve sus propias asistencias
    if (profile.rol !== "admin") {
        query = query.eq("usuario_id", user_id);
    }

    // Filtrado de Fechas
    if (month && year) {
        // Calculamos el inicio y fin del mes de manera segura en UTC (timezone database tipica)
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString();

        query = query
            .gte("entrada", startDate)
            .lt("entrada", endDate);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error al obtener asistencias:", error);
        return { success: false, error: "No se pudieron cargar las asistencias.", data: [], count: 0 };
    }

    return { success: true, data, count };
}
