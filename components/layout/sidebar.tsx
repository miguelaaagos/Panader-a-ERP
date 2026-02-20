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
    FileText
} from "lucide-react";
import { useLogout } from "@refinedev/core";
import { useUserRole } from "@/hooks/useUserRole";
import { Permission } from "@/lib/roles";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { mutate: logout } = useLogout();
    const { can } = useUserRole();

    const routes = [
        {
            label: "Caja",
            icon: ShoppingCart,
            href: "/dashboard/pos",
            active: pathname.startsWith("/dashboard/pos"),
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
            active: pathname.startsWith("/dashboard/inventario"),
            permission: "inventory.view" as Permission,
        },
        {
            label: "Recetas",
            icon: Utensils,
            href: "/dashboard/recetas",
            active: pathname.startsWith("/dashboard/recetas"),
            permission: "recipes.view" as Permission,
        },
        {
            label: "Producción",
            icon: ChefHat,
            href: "/dashboard/produccion",
            active: pathname.startsWith("/dashboard/produccion"),
            permission: "production.view" as Permission,
        },
        {
            label: "Ventas",
            icon: FileText,
            href: "/dashboard/ventas",
            active: pathname.startsWith("/dashboard/ventas"),
            permission: "sales.view_all" as Permission,
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
    ];

    const visibleRoutes = routes.filter(route => !route.permission || can(route.permission));

    return (
        <div className={cn("pb-12 w-64 border-r bg-background h-screen fixed left-0 top-0 overflow-y-auto hidden md:block", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary font-serif">
                        Panadería ERP
                    </h2>
                    <div className="space-y-1">
                        {visibleRoutes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn("w-full justify-start", route.active && "bg-primary/10 text-primary hover:bg-primary/20")}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
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
