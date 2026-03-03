"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";

export function Topbar() {
    const { data: currentUser } = useCurrentUser();
    const user = currentUser
        ? { name: currentUser.profile.nombre_completo, email: currentUser.profile.email, avatar_url: undefined }
        : null;

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 w-full flex items-center justify-between px-6 gap-4">
            <div className="flex items-center gap-2">
                <MobileSidebar />
            </div>

            <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <Link href="/dashboard/perfil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Avatar>
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
