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

import { differenceInMinutes, parseISO } from "date-fns";

export async function marcarEntrada() {
    const { user_id, profile } = await validateRequest();
    const supabase = await createClient();

    // Validate double entry
    const { activeTurn } = await getEstadoAsistencia();
    if (activeTurn) {
        return { success: false, error: "Ya existe un turno activo sin marcar salida." };
    }

    // 1. Obtener día actual de la semana (1-7, Lunes=1)
    const now = new Date();
    const jsDay = now.getDay();
    const dia_semana = jsDay === 0 ? 7 : jsDay;

    // 2. Verificar si hay horario personalizado para este usuario y día
    let horarioEntrada;
    const { data: userHorario } = await supabase
        .from("horarios_usuarios")
        .select("hora_entrada")
        .eq("tenant_id", profile.tenant_id)
        .eq("usuario_id", user_id)
        .eq("dia_semana", dia_semana)
        .maybeSingle();

    if (userHorario && userHorario.hora_entrada) {
        horarioEntrada = userHorario.hora_entrada;
    } else {
        // Fallback: horario del rol
        const { data: rolHorario } = await supabase
            .from("horarios_roles")
            .select("hora_entrada")
            .eq("tenant_id", profile.tenant_id)
            .eq("rol", profile.rol)
            .maybeSingle();
        if (rolHorario) horarioEntrada = rolHorario.hora_entrada;
    }

    let estado = "En hora"; // Por defecto

    if (horarioEntrada) {
        const horaActualString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // Comparación simple de cadenas HH:mm asumiendo timezone local
        if (horaActualString > horarioEntrada) {
            estado = "Atraso";
        }
    }

    const { data, error } = await supabase
        .from("asistencias")
        .insert({
            tenant_id: profile.tenant_id,
            usuario_id: user_id,
            estado: estado
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

    // 1. Obtener la hora actual de salida
    const fechaSalidaIso = new Date().toISOString();

    // 2. Obtener el horario designado para el rol
    const { data: horario } = await supabase
        .from("horarios_roles")
        .select("hora_salida")
        .eq("tenant_id", profile.tenant_id)
        .eq("rol", profile.rol)
        .maybeSingle();

    let horasExtrasCalculadas = 0;
    let estadoFinal = "En hora";

    // Si había un "Atraso" en la entrada, idealmente hay que preservarlo, 
    // pero para mantenerlo simple consultemos el registro actual primero
    const { data: registroActual } = await supabase
        .from("asistencias")
        .select("estado")
        .eq("id", asistenciaId)
        .single();

    if (registroActual?.estado) {
        estadoFinal = registroActual.estado;
    }

    // 3. Calculo de Salida y Horas extras
    if (horario && horario.hora_salida) {
        const now = new Date();
        const horaSalidaRealStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // Si sale antes de la hora estipulada
        if (horaSalidaRealStr < horario.hora_salida) {
            estadoFinal = estadoFinal === "Atraso" ? "Atraso e Incompleto" : "Incompleto";
        }
        // Si sale después de la hora estipulada + tolerancia (digamos 15 mins), calculamos
        else if (horaSalidaRealStr > horario.hora_salida) {
            const [hEsperada, mEsperada] = horario.hora_salida.split(":").map(Number);
            const [hReal, mReal] = horaSalidaRealStr.split(":").map(Number);

            const dateEsperada = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hEsperada, mEsperada);
            const dateReal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hReal, mReal);

            const diffMinutos = differenceInMinutes(dateReal, dateEsperada);

            // Solo contabilizar como hora extra si se quedó más de 15 minutos fuera de la hora
            if (diffMinutos >= 15) {
                // Guarda en la base de datos como fracción de hora con 2 decimales (ej 1.5 horas = 1h 30m)
                horasExtrasCalculadas = Number((diffMinutos / 60).toFixed(2));
            }
        }
    }

    const { data, error } = await supabase
        .from("asistencias")
        .update({
            salida: fechaSalidaIso,
            horas_extra: horasExtrasCalculadas,
            estado: estadoFinal
        })
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
