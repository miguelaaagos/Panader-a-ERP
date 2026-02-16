"use client";

import { useLogin } from "@refinedev/core";

import { cn } from "@/lib/utils";
// import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    console.log("[LoginForm] MOUNTED AND READY");
    setMounted(true);

    // Add a global click listener just to prove JS is alive
    const tracker = (e: MouseEvent) => {
      console.log("[LoginForm] GLOBAL CLICK DETECTED", e.target);
    };
    window.addEventListener('click', tracker);
    return () => window.removeEventListener('click', tracker);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("!!! [LoginForm] SUBMIT TRIGGERED !!!");
    console.log("Email:", email, "Refine Ready:", !!login);
    setError(null);
    if (!login) {
      console.error("!!! [LoginForm] login mutation is UNDEFINED !!!");
      setError("Error de sistema: Refine Context no listo.");
      return;
    }
    login({ email, password }, {
      onError: (error: any) => {
        console.error("[LoginForm] Mutation error:", error);
        setError(error?.message || "Error de autenticación");
      },
      onSuccess: () => {
        console.log("[LoginForm] Mutation success, letting Refine/Middleware handle redirect");
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-primary/20 shadow-xl shadow-primary/5">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-serif text-primary">Bienvenido</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Ingresa tus credenciales para acceder al POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@panaderia.cl"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-xs text-primary/80 hover:text-primary underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive text-center">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isPending}>
                {!mounted ? "Inicializando..." : isPending ? "Cargando..." : "Ingresar al POS"}
              </Button>
              <div className="text-[10px] text-center text-muted-foreground/30 mt-2">
                Debug: {mounted ? "Sistema Listo" : "Esperando Hidratación"} | Pending: {isPending ? "Sí" : "No"}
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/register"
                className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
              >
                Regístrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
