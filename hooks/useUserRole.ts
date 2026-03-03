"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { UserRole, Permission, hasPermission } from "@/lib/roles";

export function useUserRole() {
    const { data: currentUser, isLoading } = useCurrentUser();

    const role: UserRole = currentUser?.profile.rol ?? "cajero";

    return {
        role,
        isAdmin: role === "admin",
        isCajero: role === "cajero",
        isLoading,
        identity: currentUser?.profile ?? null,

        can: (permission: Permission): boolean => {
            return hasPermission(role, permission);
        },

        cannot: (permission: Permission): boolean => {
            return !hasPermission(role, permission);
        },
    };
}
