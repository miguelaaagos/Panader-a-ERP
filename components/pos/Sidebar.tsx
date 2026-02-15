"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    FileText,
    BarChart3
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
    { name: "Dashboard", href: "/protected/dashboard", icon: BarChart3 },
    { name: "Venta (POS)", href: "/protected/pos", icon: ShoppingCart },
    { name: "Historial Ventas", href: "/protected/ventas", icon: FileText },
    { name: "Inventario", href: "/protected/productos", icon: Package },
    { name: "Usuarios", href: "/protected/usuarios", icon: Users, adminOnly: true },
    { name: "Configuración", href: "/protected/config", icon: Settings, adminOnly: true },
];

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className={cn("flex flex-col h-full bg-background border-r border-primary/10 w-64", className)}>
            <div className="p-6">
                <h2 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
                    <span>🥐</span> Panadería POS
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                            <span className="font-medium">{item.name}</span>
                            {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-primary/10">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:bg-destructive/5 hover:text-destructive rounded-lg transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}
