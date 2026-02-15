"use client";

import { useGetIdentity } from '@refinedev/core';
import { UserRole, Permission, hasPermission } from '@/lib/roles';

interface UserIdentity {
    id: string;
    email: string;
    nombre_completo?: string;
    rol?: UserRole;
}

/**
 * Hook to get the current user's role and check permissions
 * @returns Object with role info and permission check functions
 */
export function useUserRole() {
    const { data: identity, isLoading } = useGetIdentity<UserIdentity>();

    const role: UserRole = identity?.rol ?? 'cajero';

    return {
        role,
        isAdmin: role === 'admin',
        isCajero: role === 'cajero',
        isLoading,
        identity,

        /**
         * Check if current user has a specific permission
         * @param permission - The permission to check
         * @returns true if user has permission
         */
        can: (permission: Permission): boolean => {
            return hasPermission(role, permission);
        },

        /**
         * Check if current user cannot perform an action (opposite of can)
         * @param permission - The permission to check
         * @returns true if user does NOT have permission
         */
        cannot: (permission: Permission): boolean => {
            return !hasPermission(role, permission);
        },
    };
}
