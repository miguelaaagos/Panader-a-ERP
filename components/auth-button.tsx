import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

import { LayoutDashboard } from "lucide-react";

export async function AuthButton() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end mr-2">
        <span className="hidden md:inline text-[10px] text-white/40 uppercase tracking-widest font-bold">Sesión activa</span>
        <span className="hidden md:inline text-sm text-white/70 font-medium">{user.email}</span>
      </div>
      <Button asChild size="sm" variant="default" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
        <Link href="/dashboard">
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Ir a mi negocio</span>
        </Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/login">Ingresar</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="bg-primary hover:bg-primary/90">
        <Link href="/register">Registrarse</Link>
      </Button>
    </div>
  );
}
