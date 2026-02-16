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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, Save, Printer, Settings2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBusinessConfig, updateBusinessConfig } from "@/actions/config"

const configFormSchema = z.object({
    nombre_negocio: z.string().min(2, {
        message: "El nombre del negocio debe tener al menos 2 caracteres.",
    }),
    razon_social: z.string().optional().nullable(),
    rut: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),

    umbral_stock_bajo: z.coerce.number().min(0, "El umbral debe ser mayor o igual a 0").default(10),
    simbolo_moneda: z.string().default("$"),
})

type ConfigFormValues = z.infer<typeof configFormSchema>

export function ConfigForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(configFormSchema) as any,
        defaultValues: {
            nombre_negocio: "Mi Panadería",
            razon_social: "",
            rut: "",
            direccion: "",
            telefono: "",
            email: "",

            umbral_stock_bajo: 10,
            simbolo_moneda: "$",
        },
    })

    useEffect(() => {
        async function loadConfig() {
            try {
                const result = await getBusinessConfig()
                if (result.success && result.data) {
                    const data = result.data
                    form.reset({
                        nombre_negocio: data.nombre_negocio || "Mi Panadería",
                        razon_social: data.razon_social || "",
                        rut: data.rut || "",
                        direccion: data.direccion || "",
                        telefono: data.telefono || "",
                        email: data.email || "",

                        umbral_stock_bajo: Number(data.umbral_stock_bajo) || 10,
                        simbolo_moneda: data.simbolo_moneda || "$",
                    })
                } else if (result.error) {
                    console.error("Error cargando configuración:", result.error)
                    toast.error("Error al cargar la configuración")
                }
            } catch (error) {
                console.error("Error:", error)
            } finally {
                setLoading(false)
            }
        }

        loadConfig()
    }, [form])

    async function onSubmit(data: ConfigFormValues) {
        setSaving(true)
        try {
            const result = await updateBusinessConfig(data)

            if (result.success) {
                toast.success("Configuración guardada correctamente")
            } else {
                throw new Error(result.error)
            }
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sección: Datos del Negocio */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Datos del Negocio
                            </CardTitle>
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
                                            <Input placeholder="Ej: Panadería Los Andes" {...field} value={field.value || ''} />
                                        </FormControl>
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
                                                <Input placeholder="Ej: Importadora de Harinas SPA" {...field} value={field.value || ''} />
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
                                                <Input placeholder="Ej: 76.123.456-7" {...field} value={field.value || ''} />
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
                                            <Input placeholder="Ej: Av. Principal 123, Santiago" {...field} value={field.value || ''} />
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
                                                <Input placeholder="Ej: +56 9 1234 5678" {...field} value={field.value || ''} />
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
                                                <Input placeholder="contacto@panaderia.cl" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección: Configuración de Boleta y Globales */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ajustes Globales</CardTitle>
                                <CardDescription>Configuración general del sistema.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="umbral_stock_bajo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Umbral Stock Bajo (General)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormDescription>Default para nuevos productos.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="simbolo_moneda"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Símbolo de Moneda</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="$" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!saving && <Save className="mr-2 h-4 w-4" />}
                        {saving ? "Guardando..." : "Guardar Toda la Configuración"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
