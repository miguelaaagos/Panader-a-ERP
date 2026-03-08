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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    login({ email, password }, {
      onSuccess: (data: any) => {
        if (!data.success) {
          console.error("[LoginForm] Login failed:", data.error);
          const message = data.error?.message || "Error de autenticación";
          setError(message);

          toast.error("Error de Acceso", {
            description: message === "Invalid login credentials"
              ? "Credenciales incorrectas"
              : message
          });
          return;
        }
      },
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
              <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isPending || !mounted}>
                {isPending ? 'Ingresando...' : 'Ingresar al ERP'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent className="sm:max-w-md border-destructive/20 outline-none">
          <DialogHeader className="flex flex-col items-center gap-2 pt-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-destructive">Error de Acceso</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2 px-2">
              {error === "Invalid login credentials" || error === "Error de autenticación"
                ? "Las credenciales ingresadas no son correctas. Por favor, verifica tu correo y contraseña e intenta nuevamente."
                : error}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button
              type="button"
              variant="default"
              onClick={() => setError(null)}
              className="px-8 w-full sm:w-auto font-medium"
            >
              Reintentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
