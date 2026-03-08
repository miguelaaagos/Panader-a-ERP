"use client";

import { useGetIdentity } from "@refinedev/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import Link from "next/link";
import { SubscriptionTier } from "@/lib/subscription";
import { type TenantBranding } from "@/lib/server/subscription";

export function Topbar({ branding }: { branding: TenantBranding }) {
    const { tier } = branding;
    const { data: user } = useGetIdentity<{ name: string; email: string; avatar_url?: string }>();

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 w-full flex items-center justify-between px-6 gap-4">
            <div className="flex items-center gap-2">
                <MobileSidebar branding={branding} />
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
