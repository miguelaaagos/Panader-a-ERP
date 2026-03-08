"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

const contactSchema = z.object({
    name: z.string().min(2, "Nombre demasiado corto"),
    email: z.string().email("Email inválido"),
    business: z.string().min(2, "Nombre de negocio inválido"),
    message: z.string().min(10, "Mensaje demasiado corto (mínimo 10 caracteres)")
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema)
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        // Simulación de envío
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Formulario de contacto:", data);
        toast.success("¡Mensaje enviado con éxito!", {
            description: "Nos pondremos en contacto contigo a la brevedad."
        });
        reset();
        setIsSubmitting(false);
    };

    return (
        <section id="contact" className="py-24 bg-muted/40">
            <div className="container px-6 mx-auto">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 text-left">
                        <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4 italic">Conectemos</h2>
                        <h3 className="text-4xl md:text-5xl font-serif text-foreground mb-6 italic">¿Necesitas una solución a medida?</h3>
                        <p className="text-xl text-muted-foreground mb-8 font-light">
                            Sabemos que cada negocio es único. Cuéntanos sobre tu panadería y cómo podemos ayudarte a digitalizarte.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-muted-foreground font-medium">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    📍
                                </div>
                                <span>Calama & Antofagasta, Chile</span>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground font-medium">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    ✉️
                                </div>
                                <span>contacto@simpleerp.cl</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-md">
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="p-8 rounded-[2rem] border border-border bg-card backdrop-blur-xl space-y-5"
                        >
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Nombre Completo</label>
                                <input
                                    {...register("name")}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                                    placeholder="Juan Pérez"
                                />
                                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Correo Electrónico</label>
                                <input
                                    {...register("email")}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                                    placeholder="juan@mipanaderia.cl"
                                />
                                {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Nombre del Negocio</label>
                                <input
                                    {...register("business")}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                                    placeholder="Panadería El Sol"
                                />
                                {errors.business && <p className="text-rose-500 text-xs mt-1">{errors.business.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Mensaje</label>
                                <textarea
                                    {...register("message")}
                                    rows={4}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder:text-muted-foreground/40"
                                    placeholder="Cuéntanos un poco más..."
                                />
                                {errors.message && <p className="text-rose-500 text-xs mt-1">{errors.message.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Enviar Mensaje
                                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
