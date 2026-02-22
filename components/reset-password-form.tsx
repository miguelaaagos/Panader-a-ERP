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
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ResetPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Contraseña actualizada exitosamente");
                // Esperamos un segundo para que el usuario vea el mensaje antes de redirigir
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            }
        } catch (err) {
            toast.error("Ocurrió un error inesperado");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border-primary/20 shadow-xl shadow-primary/5">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-3xl font-serif text-primary">Nueva Contraseña</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Ingresa tu nueva contraseña para completar el proceso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Nueva Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background/50 border-border/50 focus:border-primary/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-background/50 border-border/50 focus:border-primary/50"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
