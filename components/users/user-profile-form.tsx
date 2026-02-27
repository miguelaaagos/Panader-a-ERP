"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Save, KeyRound, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProfile, updatePassword } from "@/actions/user-settings"

const profileSchema = z.object({
    nombre_completo: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

const passwordSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
})

interface UserProfileFormProps {
    initialData: {
        nombre_completo: string;
        email: string;
    }
}

export function UserProfileForm({ initialData }: UserProfileFormProps) {
    const [profileLoading, setProfileLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            nombre_completo: initialData.nombre_completo || "",
        },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onProfileSubmit(data: z.infer<typeof profileSchema>) {
        setProfileLoading(true)
        try {
            const result = await updateProfile(data)
            if (result.success) {
                toast.success("Perfil actualizado correctamente")
            } else {
                toast.error(result.error || "Error al actualizar perfil")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setProfileLoading(false)
        }
    }

    async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
        setPasswordLoading(true)
        try {
            const result = await updatePassword(data)
            if (result.success) {
                toast.success("Contraseña actualizada correctamente")
                passwordForm.reset()
            } else {
                toast.error(result.error || "Error al actualizar contraseña")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información del Perfil
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu nombre público y revisa tu correo electrónico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input value={initialData.email} disabled className="bg-muted" />
                                    </FormControl>
                                    <FormDescription>El correo no puede ser cambiado.</FormDescription>
                                </FormItem>
                                <FormField
                                    control={profileForm.control}
                                    name="nombre_completo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tu nombre" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={profileLoading}>
                                    {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Perfil
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Cambiar Contraseña
                    </CardTitle>
                    <CardDescription>
                        Asegúrate de usar una contraseña segura que no uses en otros sitios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nueva Contraseña</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar Contraseña</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" variant="destructive" disabled={passwordLoading}>
                                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
