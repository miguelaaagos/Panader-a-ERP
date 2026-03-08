"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ChefHat,
    Utensils,
    Users,
    Settings,
    LogOut,
    FileText,
    ShoppingBag,
    Wallet,
    TrendingUp,
    User,
    Clock,
    Truck,
    Globe,
    Building2
} from "lucide-react";
import { useLogout } from "@refinedev/core";
import { useUserRole } from "@/hooks/useUserRole";
import { Permission } from "@/lib/roles";
import Image from "next/image";
import { SubscriptionTier, Feature, hasFeatureAccess } from "@/lib/subscription";
import { Lock } from "lucide-react";

interface Route {
    label: string;
    icon: any;
    href: string;
    active: boolean;
    permission?: Permission;
    feature?: Feature;
    children?: Route[];
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    tier: SubscriptionTier;
}

export function Sidebar({ className, tier }: SidebarProps) {
    const pathname = usePathname();
    const { mutate: logout } = useLogout();
    const { can } = useUserRole();

    const routes = [
        {
            label: "Ventas",
            icon: ShoppingCart,
            href: "/dashboard/erp",
            active: pathname.startsWith("/dashboard/erp"),
            permission: "sales.create" as Permission,
        },
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
            permission: "analytics.view_full" as Permission,
        },
        {
            label: "Inventario",
            icon: Package,
            href: "/dashboard/inventario",
            active: pathname === "/dashboard/inventario",
            permission: "inventory.view" as Permission,
            feature: "inventory" as Feature,
        },
        {
            label: "Compras",
            icon: ShoppingBag,
            href: "/dashboard/inventario/ingresos",
            active: pathname.startsWith("/dashboard/inventario/ingresos"),
            permission: "inventory.view" as Permission,
        },
        {
            label: "Proveedores",
            icon: Truck,
            href: "/dashboard/inventario/proveedores",
            active: pathname.startsWith("/dashboard/inventario/proveedores"),
            permission: "inventory.view" as Permission,
        },
        {
            label: "Gastos",
            icon: Wallet,
            href: "/dashboard/gastos",
            active: pathname.startsWith("/dashboard/gastos"),
            permission: "sales.view_all" as Permission,
            feature: "expenses" as Feature,
        },
        {
            label: "Producción",
            icon: ChefHat,
            href: "/dashboard/produccion",
            active: pathname.startsWith("/dashboard/produccion"),
            permission: "production.view" as Permission,
            feature: "production" as Feature,
            children: [
                {
                    label: "Recetas",
                    icon: Utensils,
                    href: "/dashboard/produccion/recetas",
                    active: pathname.startsWith("/dashboard/produccion/recetas"),
                    permission: "recipes.view" as Permission,
                    feature: "recipes" as Feature,
                },
            ]
        },
        {
            label: "Historial Ventas",
            icon: FileText,
            href: "/dashboard/ventas",
            active: pathname.startsWith("/dashboard/ventas"),
            permission: "sales.view_all" as Permission,
        },
        {
            label: "Reportes",
            icon: TrendingUp,
            href: "/dashboard/reportes/financiero",
            active: pathname.startsWith("/dashboard/reportes/financiero"),
            permission: "analytics.view_full" as Permission,
            feature: "advanced_reports" as Feature,
        },
        {
            label: "Asistencia",
            icon: Clock,
            href: "/dashboard/asistencia",
            active: pathname.startsWith("/dashboard/asistencia"),
            // La asistencia la ven todos, pero en la página en sí habrá restricciones por rol si fuera de mantenedor
        },
        {
            label: "Usuarios",
            icon: Users,
            href: "/dashboard/usuarios",
            active: pathname.startsWith("/dashboard/usuarios"),
            permission: "users.view" as Permission,
        },
        {
            label: "Configuración",
            icon: Settings,
            href: "/dashboard/configuracion",
            active: pathname.startsWith("/dashboard/configuracion"),
            permission: "settings.view" as Permission,
        },
        {
            label: "Mi Perfil",
            icon: User,
            href: "/dashboard/perfil",
            active: pathname === "/dashboard/perfil",
        },
    ];

    const adminRoutes = [
        {
            label: "Admin Global",
            icon: Globe,
            href: "/dashboard/admin",
            active: pathname === "/dashboard/admin",
        },
        {
            label: "Tenants",
            icon: Building2,
            href: "/dashboard/admin/tenants",
            active: pathname.startsWith("/dashboard/admin/tenants"),
        },
    ];

    const { isSuperAdmin } = useUserRole();
    const visibleRoutes = routes.filter(route => !route.permission || can(route.permission));

    return (
        <div className={cn("pb-12 w-64 border-r bg-background h-screen fixed left-0 top-0 overflow-y-auto hidden md:block", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex flex-col items-center mb-6 px-4 gap-3">
                        <div className="relative h-20 w-20 overflow-hidden group">
                            <Image
                                src="/brand/logo-lamiga.jpg"
                                alt="Lamiga Logo"
                                width={80}
                                height={80}
                                className="object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                                priority
                            />
                        </div>
                        <div className="text-center space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight text-primary font-serif leading-none">
                                Lamiga
                            </h2>
                            <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/50 font-semibold">
                                Panadería & Pastelería
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {visibleRoutes.map((route) => {
                            const isLocked = route.feature && !hasFeatureAccess(tier, route.feature);

                            return (
                                <div key={route.href} className="space-y-1">
                                    <Button
                                        variant={route.active ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            route.active && "bg-primary/10 text-primary hover:bg-primary/20",
                                            route.children && "font-semibold",
                                            isLocked && "opacity-50 grayscale cursor-not-allowed"
                                        )}
                                        asChild={!isLocked}
                                        disabled={isLocked}
                                    >
                                        {isLocked ? (
                                            <div className="flex items-center w-full">
                                                <route.icon className="mr-2 h-4 w-4" />
                                                {route.label}
                                                <Lock className="ml-auto h-3.5 w-3.5" />
                                            </div>
                                        ) : (
                                            <Link href={route.href}>
                                                <route.icon className="mr-2 h-4 w-4" />
                                                {route.label}
                                            </Link>
                                        )}
                                    </Button>
                                    {route.children && (
                                        <div className="ml-4 pl-2 border-l space-y-1 mt-1">
                                            {route.children
                                                .filter(child => !child.permission || can(child.permission))
                                                .map((child) => {
                                                    const isChildLocked = child.feature && !hasFeatureAccess(tier, child.feature);

                                                    return (
                                                        <Button
                                                            key={child.href}
                                                            variant={child.active ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className={cn(
                                                                "w-full justify-start h-8 text-xs",
                                                                child.active && "bg-primary/10 text-primary hover:bg-primary/20",
                                                                isChildLocked && "opacity-50 grayscale cursor-not-allowed"
                                                            )}
                                                            asChild={!isChildLocked}
                                                            disabled={isChildLocked}
                                                        >
                                                            {isChildLocked ? (
                                                                <div className="flex items-center w-full">
                                                                    <child.icon className="mr-2 h-3.5 w-3.5" />
                                                                    {child.label}
                                                                    <Lock className="ml-auto h-3 w-3" />
                                                                </div>
                                                            ) : (
                                                                <Link href={child.href}>
                                                                    <child.icon className="mr-2 h-3.5 w-3.5" />
                                                                    {child.label}
                                                                </Link>
                                                            )}
                                                        </Button>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isSuperAdmin && (
                            <div className="pt-4 mt-4 border-t px-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-2 px-4 tracking-widest">
                                    ADMIN GLOBAL
                                </p>

                                {adminRoutes.map((route) => (
                                    <Button
                                        key={route.href}
                                        variant={route.active ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            route.active && "bg-primary/10 text-primary hover:bg-primary/20",
                                        )}
                                        asChild
                                    >
                                        <Link href={route.href}>
                                            <route.icon className="mr-2 h-4 w-4" />
                                            {route.label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 left-0 w-full px-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
