"use client";

import { useRegister } from "@refinedev/core";
import { cn } from "@/lib/utils";
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
import { useState } from "react";

export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { mutate: register, isLoading } = useRegister();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        register({ email, password }, {
            onError: (error: any) => {
                setError(error?.message || "Error al registrarse");
            },
        });
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border-primary/20 shadow-xl shadow-primary/5">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-3xl font-serif text-primary">Crear Cuenta</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Regístrate para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister}>
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
                                <Label htmlFor="password">Contraseña</Label>
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
                            <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Creando cuenta..." : "Registrarse"}
                            </Button>
                        </div>
                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                href="/login"
                                className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
                            >
                                Iniciar sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
