"use server"
import { validateRequest } from "@/lib/server/auth"

export async function getSession() {
    try {
        const { profile, user_id } = await validateRequest()
        return { success: true, profile, user_id }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
}
