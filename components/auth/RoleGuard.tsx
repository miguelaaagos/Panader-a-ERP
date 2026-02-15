"use client";

import { useUserRole } from '@/hooks/useUserRole';
import { Permission } from '@/lib/roles';

interface RoleGuardProps {
    /**
     * The permission required to see the children
     */
    permission: Permission;

    /**
     * Content to show when user has permission
     */
    children: React.ReactNode;

    /**
     * Optional content to show when user lacks permission
     * @default null (nothing shown)
     */
    fallback?: React.ReactNode;

    /**
     * If true, shows a loading state while checking permissions
     * @default false
     */
    showLoading?: boolean;

    /**
     * Custom loading component
     */
    loadingComponent?: React.ReactNode;
}

/**
 * Guard component that conditionally renders children based on user permissions
 * 
 * @example
 * ```tsx
 * <RoleGuard permission="inventory.create">
 *   <Button>Create Product</Button>
 * </RoleGuard>
 * ```
 * 
 * @example With fallback
 * ```tsx
 * <RoleGuard 
 *   permission="sales.view_all"
 *   fallback={<p>You can only view your own sales</p>}
 * >
 *   <AllSalesList />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
    permission,
    children,
    fallback = null,
    showLoading = false,
    loadingComponent = <div className="text-muted-foreground">Verificando permisos...</div>
}: RoleGuardProps) {
    const { can, isLoading } = useUserRole();

    if (isLoading && showLoading) {
        return <>{loadingComponent}</>;
    }

    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface MultiPermissionGuardProps {
    /**
     * Multiple permissions - user must have ALL to see content
     */
    permissions: Permission[];

    /**
     * If true, user needs ANY permission (OR logic)
     * If false, user needs ALL permissions (AND logic)
     * @default false (AND logic)
     */
    requireAny?: boolean;

    children: React.ReactNode;
    fallback?: React.ReactNode;
    showLoading?: boolean;
    loadingComponent?: React.ReactNode;
}

/**
 * Guard component for multiple permissions
 * 
 * @example Require ALL permissions
 * ```tsx
 * <MultiPermissionGuard permissions={['inventory.edit', 'inventory.delete']}>
 *   <Button>Edit & Delete Product</Button>
 * </MultiPermissionGuard>
 * ```
 * 
 * @example Require ANY permission
 * ```tsx
 * <MultiPermissionGuard 
 *   permissions={['sales.view_all', 'sales.view_own']}
 *   requireAny
 * >
 *   <SalesList />
 * </MultiPermissionGuard>
 * ```
 */
export function MultiPermissionGuard({
    permissions,
    requireAny = false,
    children,
    fallback = null,
    showLoading = false,
    loadingComponent = <div className="text-muted-foreground">Verificando permisos...</div>
}: MultiPermissionGuardProps) {
    const { can, isLoading } = useUserRole();

    if (isLoading && showLoading) {
        return <>{loadingComponent}</>;
    }

    const hasAccess = requireAny
        ? permissions.some(p => can(p))
        : permissions.every(p => can(p));

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
