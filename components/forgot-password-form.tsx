"use client";

import { createClient } from "@/lib/supabase/client";
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
import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
            });

            if (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                toast.error(errorMessage);
            } else {
                setIsSubmitted(true);
                toast.success("Correo de recuperación enviado exitosamente");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card className="border-primary/20 shadow-xl shadow-primary/5">
                    <CardHeader className="text-center space-y-1">
                        <CardTitle className="text-3xl font-serif text-primary">Revisa tu correo</CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                            Hemos enviado un enlace de recuperación a:
                            <br />
                            <span className="font-medium text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Si no lo recibes en unos minutos, revisa tu carpeta de spam.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Volver al inicio de sesión</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border-primary/20 shadow-xl shadow-primary/5">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-3xl font-serif text-primary">Recuperar Contraseña</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Ingresa tu correo electrónico para recibir un enlace de recuperación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
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
                            <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Enviando..." : "Enviar Enlace"}
                            </Button>
                        </div>
                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            ¿Recordaste tu contraseña?{" "}
                            <Link
                                href="/login"
                                className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
                            >
                                Inicia sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
