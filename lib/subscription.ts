import { Database } from "@/types/database.types"

export type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"]

export const SUBSCRIPTION_TIERS = {
    INITIAL: "initial",
    ADVANCED: "advanced",
    PRO: "pro",
} as const

export type Feature =
    | "pos"
    | "inventory"
    | "sales"
    | "recipes"
    | "production"
    | "expenses"
    | "advanced_reports"

const FEATURE_MATRIX: Record<SubscriptionTier, Feature[]> = {
    initial: ["pos", "inventory", "sales"],
    advanced: ["pos", "inventory", "sales", "recipes", "production", "expenses"],
    pro: ["pos", "inventory", "sales", "recipes", "production", "expenses", "advanced_reports"],
}

/**
 * Maps dashboard paths to the required subscription feature.
 */
export function getRequiredFeatureForPath(pathname: string): Feature | null {
    if (pathname.startsWith("/dashboard/reportes/financiero")) return "advanced_reports"
    if (pathname.startsWith("/dashboard/produccion/recetas")) return "recipes"
    if (pathname.startsWith("/dashboard/produccion")) return "production"
    if (pathname.startsWith("/dashboard/gastos")) return "expenses"
    if (pathname.startsWith("/dashboard/inventario")) return "inventory"
    return null
}

/**
 * Verifica si un nivel de suscripción tiene acceso a una funcionalidad específica.
 */
export function hasFeatureAccess(tier: SubscriptionTier | null | undefined, feature: Feature): boolean {
    if (!tier) return FEATURE_MATRIX.initial.includes(feature)
    return FEATURE_MATRIX[tier]?.includes(feature) ?? false
}

/**
 * Retorna el nombre legible del plan.
 */
export function getTierName(tier: SubscriptionTier | null | undefined): string {
    switch (tier) {
        case "advanced": return "Plan Avanzado"
        case "pro": return "Plan Pro"
        default: return "Plan Inicial"
    }
}
