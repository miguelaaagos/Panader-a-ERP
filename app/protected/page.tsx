import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BakeryStats } from "@/components/pos/Stats";

async function WelcomeMessage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-serif text-primary">¡Hola, {profile?.nombre_completo || user.email}!</h1>
      <p className="text-muted-foreground">Bienvenido al sistema de gestión de tu panadería.</p>
    </div>
  );
}

export default async function ProtectedPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <Suspense fallback={<div className="h-20 w-1/3 animate-pulse bg-muted rounded-lg" />}>
        <WelcomeMessage />
      </Suspense>

      <BakeryStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <a href="/protected/pos" className="flex-1 min-w-[200px] p-6 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🍞</div>
              <div className="font-bold text-lg">Abrir POS</div>
              <div className="text-xs text-muted-foreground">Venta rápida al público</div>
            </a>
            <a href="/protected/inventario" className="flex-1 min-w-[200px] p-6 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📋</div>
              <div className="font-bold text-lg">Inventario</div>
              <div className="text-xs text-muted-foreground">Gestión de productos</div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
