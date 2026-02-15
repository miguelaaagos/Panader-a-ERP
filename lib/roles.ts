export type UserRole = 'admin' | 'cajero' | 'panadero';

export const PERMISSIONS = {
    // Inventory permissions
    'inventory.create': ['admin'],
    'inventory.edit': ['admin'],
    'inventory.delete': ['admin'],
    'inventory.view': ['admin', 'cajero', 'panadero'],
    'inventory.adjust_stock': ['admin'],

    // Sales permissions
    'sales.create': ['admin', 'cajero'],
    'sales.view_all': ['admin'],
    'sales.view_own': ['admin', 'cajero'],
    'sales.annul': ['admin'],

    // Recipes permissions
    'recipes.manage': ['admin'],
    'recipes.view': ['admin', 'panadero'],

    // Production permissions
    'production.manage': ['admin', 'panadero'],
    'production.view': ['admin', 'panadero'],

    // Analytics permissions
    'analytics.view_full': ['admin'],
    'analytics.view_own': ['cajero'],

    // User management
    'users.manage': ['admin'],
    'users.view': ['admin'],

    // Settings
    'settings.view': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 * @param userRole - The role of the user ('admin' or 'cajero')
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 */
export function hasPermission(
    userRole: UserRole,
    permission: Permission
): boolean {
    const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
    return allowedRoles.includes(userRole);
}

/**
 * Check if a user role has ALL of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
    userRole: UserRole,
    permissions: Permission[]
): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has ANY of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(
    userRole: UserRole,
    permissions: Permission[]
): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}
