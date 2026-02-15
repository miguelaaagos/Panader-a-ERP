"use client";

import { useGetIdentity } from "@refinedev/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Topbar() {
    const { data: user } = useGetIdentity<{ name: string; email: string; avatar_url?: string }>();

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 w-full flex items-center justify-end px-6 gap-4">
            <ThemeSwitcher />
            <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Avatar>
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
