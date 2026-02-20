"use server"

import { validateRequest } from "@/lib/server/auth"
import { revalidatePath } from "next/cache"

export async function getCurrentCashSession() {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("arqueos_caja")
            .select("*, usuarios(nombre_completo)")
            .eq("tenant_id", profile.tenant_id)
            .eq("usuario_id", profile.id)
            .eq("estado", "abierto")
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows found"

        return { success: true, session: data || null }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function openCashSession(montoInicial: number, observaciones?: string) {
    try {
        const { supabase, profile } = await validateRequest()

        // 1. Verificar si ya hay una sesión abierta
        const res = await getCurrentCashSession()
        if (res.success && res.session) {
            throw new Error("Ya tienes una sesión de caja abierta.")
        }

        // 2. Crear nueva sesión
        const { data, error } = await supabase
            .from("arqueos_caja")
            .insert({
                tenant_id: profile.tenant_id,
                usuario_id: profile.id,
                monto_inicial: montoInicial,
                observaciones: observaciones,
                estado: 'abierto'
            })
            .select("*, usuarios(nombre_completo)")
            .single()

        if (error) throw error

        revalidatePath("/dashboard")
        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function closeCashSession(montoFinalReal: number, observaciones?: string) {
    try {
        const { supabase, profile } = await validateRequest()

        // 1. Obtener sesión actual
        const { session } = await getCurrentCashSession()
        if (!session) {
            throw new Error("No hay una sesión abierta para cerrar.")
        }

        // 2. Cerrar sesión
        const { error } = await supabase
            .from("arqueos_caja")
            .update({
                fecha_cierre: new Date().toISOString(),
                monto_final_real: montoFinalReal,
                estado: 'cerrado',
                observaciones: session.observaciones ? `${session.observaciones} | Cierre: ${observaciones}` : observaciones
            })
            .eq("id", session.id)

        if (error) throw error

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getSessionSummary(sessionId: string) {
    try {
        const { supabase } = await validateRequest()

        // Obtener totales por método de pago
        const { data, error } = await supabase
            .from("ventas")
            .select("total, metodo_pago")
            .eq("arqueo_id", sessionId) // Asumiendo que las ventas guardan el arqueo_id
            .eq("estado", "completada")

        if (error) throw error

        interface CashSummary {
            efectivo: number
            tarjeta_debito: number
            tarjeta_credito: number
            transferencia: number
            total: number
        }

        const summary = (data || []).reduce((acc: CashSummary, sale: { total: number | null, metodo_pago: string | null }) => {
            const metodo = sale.metodo_pago as keyof CashSummary
            if (metodo in acc) {
                acc[metodo] = (acc[metodo] || 0) + Number(sale.total)
            }
            acc.total = (acc.total || 0) + Number(sale.total)
            return acc
        }, { efectivo: 0, tarjeta_debito: 0, tarjeta_credito: 0, transferencia: 0, total: 0 })

        return { success: true, summary }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getRecentShiftSales(sessionId: string, limit = 5) {
    try {
        const { supabase } = await validateRequest()

        const { data, error } = await supabase
            .from("ventas")
            .select("*")
            .eq("arqueo_id", sessionId)
            .order("fecha", { ascending: false })
            .limit(limit)

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getPastCashSessions(limit = 10) {
    try {
        const { supabase, profile } = await validateRequest()

        const { data, error } = await supabase
            .from("arqueos_caja")
            .select("*, usuarios(nombre_completo)")
            .eq("tenant_id", profile.tenant_id)
            .eq("usuario_id", profile.id)
            .eq("estado", "cerrado")
            .order("fecha_apertura", { ascending: false })
            .limit(limit)

        if (error) throw error

        return { success: true, sessions: data || [] }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}
