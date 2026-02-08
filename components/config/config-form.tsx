"use client"

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
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const configFormSchema = z.object({
    nombre_negocio: z.string().min(2, {
        message: "El nombre del negocio debe tener al menos 2 caracteres.",
    }),
    razon_social: z.string().optional(),
    rut: z.string().optional(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
})

type ConfigFormValues = z.infer<typeof configFormSchema>

export function ConfigForm() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(configFormSchema),
        defaultValues: {
            nombre_negocio: "Mi Panadería",
            razon_social: "",
            rut: "",
            direccion: "",
            telefono: "",
            email: "",
        },
    })

    useEffect(() => {
        async function loadConfig() {
            try {
                const { data, error } = await supabase
                    .from("configuracion")
                    .select("*")
                    .single()

                if (data) {
                    form.reset({
                        nombre_negocio: data.nombre_negocio || "Mi Panadería",
                        razon_social: data.razon_social || "",
                        rut: data.rut || "",
                        direccion: data.direccion || "",
                        telefono: data.telefono || "",
                        email: data.email || "",
                    })
                } else if (error && error.code !== "PGRST116") {
                    // Ignorar error si es "no rows returned" (PGRST116), usaremos defaults
                    console.error("Error cargando configuración:", error)
                    toast.error("Error al cargar la configuración")
                }
            } catch (error) {
                console.error("Error:", error)
            } finally {
                setLoading(false)
            }
        }

        loadConfig()
    }, [form, supabase])

    async function onSubmit(data: ConfigFormValues) {
        setSaving(true)
        try {
            // Check if row exists
            const { data: existingData } = await supabase
                .from("configuracion")
                .select("id")
                .single()

            let error
            if (existingData) {
                // Update
                const { error: updateError } = await supabase
                    .from("configuracion")
                    .update(data)
                    .eq("id", existingData.id)
                error = updateError
            } else {
                // Insert (force ID 1)
                const { error: insertError } = await supabase
                    .from("configuracion")
                    .insert({ id: 1, ...data })
                error = insertError
            }

            if (error) throw error

            toast.success("Configuración guardada correctamente")
        } catch (error: any) {
            console.error("Error guardando configuración:", error)
            toast.error("Error al guardar: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Datos del Negocio</CardTitle>
                        <CardDescription>
                            Esta información aparecerá en los documentos y reportes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre_negocio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Comercial</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Panadería Los Andes" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        El nombre público de tu negocio.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="razon_social"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razón Social</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Importadora de Harinas SPA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RUT</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 76.123.456-7" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="direccion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Av. Principal 123, Santiago" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: +56 9 1234 5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contacto@panaderia.cl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!saving && <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </form>
        </Form>
    )
}
