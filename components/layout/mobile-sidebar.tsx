"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, ShoppingCart, Package, ChefHat, Utensils, Users, Settings, LogOut, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@refinedev/core";
import { useUserRole } from "@/hooks/useUserRole";
import { Permission } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b text-left">
                    <SheetTitle className="font-serif text-xl tracking-tight text-primary">Panadería ERP</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-3 space-y-1">
                        {visibleRoutes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn("w-full justify-start", route.active && "bg-primary/10 text-primary hover:bg-primary/20")}
                                onClick={() => setOpen(false)}
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
                <div className="p-4 border-t mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                            setOpen(false);
                            logout();
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
