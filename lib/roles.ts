export type UserRole = 'super_admin' | 'admin' | 'cajero' | 'panadero' | 'pastelero';

export const PERMISSIONS = {
    // Inventory permissions
    'inventory.create': ['admin', 'super_admin'],
    'inventory.edit': ['admin', 'super_admin'],
    'inventory.delete': ['admin', 'super_admin'],
    'inventory.view': ['admin', 'cajero', 'panadero', 'pastelero', 'super_admin'],
    'inventory.adjust_stock': ['admin', 'super_admin'],
    'inventory.restock': ['admin', 'cajero', 'super_admin'],

    // Sales permissions
    'sales.create': ['admin', 'cajero', 'super_admin'],
    'sales.view_all': ['admin', 'super_admin'],
    'sales.view_own': ['admin', 'cajero', 'super_admin'],
    'sales.annul': ['admin', 'super_admin'],

    // Recipes permissions
    'recipes.manage': ['admin', 'super_admin'],
    'recipes.view': ['admin', 'panadero', 'pastelero', 'super_admin'],

    // Production permissions
    'production.manage': ['admin', 'panadero', 'pastelero', 'super_admin'],
    'production.view': ['admin', 'panadero', 'pastelero', 'super_admin'],

    // Analytics permissions
    'analytics.view_full': ['admin', 'super_admin'],
    'analytics.view_own': ['cajero', 'super_admin'],

    // User management
    'users.manage': ['admin', 'super_admin'],
    'users.view': ['admin', 'super_admin'],

    // Settings
    'settings.view': ['admin', 'super_admin'],

    // Shift management
    'shifts.manage': ['admin', 'cajero', 'super_admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 * @param userRole - The role of the user
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 */
export function hasPermission(
    userRole: UserRole,
    permission: Permission
): boolean {
    // Super admin has all permissions
    if (userRole === 'super_admin') return true;
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
    if (userRole === 'super_admin') return true;
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
    if (userRole === 'super_admin') return true;
    return permissions.some(permission => hasPermission(userRole, permission));
}
