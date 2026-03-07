"use server";

import { createClient } from "@/lib/supabase/server";
import { validateRequest } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";

export type HorarioRole = {
    id: string;
    rol: string;
    hora_entrada: string;
    hora_salida: string;
    tenant_id: string;
};

export async function getHorariosRoles() {
    const { profile } = await validateRequest();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("horarios_roles")
        .select("*")
        .eq("tenant_id", profile.tenant_id);

    if (error) {
        console.error("Error al obtener horarios_roles:", error);
        return { success: false, data: [] };
    }

    return { success: true, data: data as HorarioRole[] };
}

export async function upsertHorarioRol(rol: string, horaEntrada: string, horaSalida: string) {
    const { profile } = await validateRequest();

    if (profile.rol !== 'admin') {
        return { success: false, error: "No autorizado." };
    }

    const supabase = await createClient();

    // Consultamos si ya existe para este rol y tenant
    const { data: existente } = await supabase
        .from("horarios_roles")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("rol", rol)
        .maybeSingle();

    let result;

    if (existente) {
        // Actualizar
        result = await supabase
            .from("horarios_roles")
            .update({
                hora_entrada: horaEntrada,
                hora_salida: horaSalida,
                updated_at: new Date().toISOString()
            })
            .eq("id", existente.id)
            .eq("tenant_id", profile.tenant_id);
    } else {
        // Insertar
        result = await supabase
            .from("horarios_roles")
            .insert({
                tenant_id: profile.tenant_id,
                rol,
                hora_entrada: horaEntrada,
                hora_salida: horaSalida
            });
    }

    if (result.error) {
        console.error("Error al guardar horario:", result.error);
        return { success: false, error: "No se pudo guardar el horario asignado al rol." };
    }

    revalidatePath("/dashboard/asistencia");
    return { success: true };
}

export type HorarioUsuario = {
    id: string;
    usuario_id: string;
    dia_semana: number;
    hora_entrada: string;
    hora_salida: string;
    tenant_id: string;
};

export async function getHorariosUsuario(usuarioId: string) {
    const { profile } = await validateRequest();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("horarios_usuarios")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("usuario_id", usuarioId);

    if (error) {
        console.error("Error al obtener horarios_usuarios:", error);
        return { success: false, data: [] };
    }

    return { success: true, data: data as HorarioUsuario[] };
}

export async function upsertHorariosUsuario(usuarioId: string, horariosPorDia: { dia_semana: number, hora_entrada: string, hora_salida: string }[]) {
    const { profile } = await validateRequest();

    if (profile.rol !== 'admin') {
        return { success: false, error: "No autorizado." };
    }

    const supabase = await createClient();

    const payloads = horariosPorDia.map(h => ({
        tenant_id: profile.tenant_id,
        usuario_id: usuarioId,
        dia_semana: h.dia_semana,
        hora_entrada: h.hora_entrada,
        hora_salida: h.hora_salida
    }));

    const { error } = await supabase
        .from("horarios_usuarios")
        .upsert(payloads, { onConflict: "tenant_id,usuario_id,dia_semana" });

    if (error) {
        console.error("Error al guardar horarios del usuario:", error);
        return { success: false, error: "No se pudo guardar el horario personalizado del usuario." };
    }

    revalidatePath("/dashboard/asistencia");
    return { success: true };
}
