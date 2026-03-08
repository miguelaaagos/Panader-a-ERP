"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-orange-500/10 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="container px-6 mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                    Nueva versión 2.0 disponible
                </div>

                <h1 className="text-5xl md:text-8xl font-serif text-white mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Artesanía en cada <br />
                    <span className="text-primary italic relative">
                        detalle.
                        <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    La plataforma integral diseñada para el negocio gastronómico moderno.
                    Gestiona inventario, producción y ventas con elegancia y precisión.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <Link
                        href="/register"
                        className="group px-8 py-4 bg-primary text-primary-foreground rounded-full text-xl font-medium hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 hover:scale-105 flex items-center gap-2"
                    >
                        Comenzar prueba gratuita
                        <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#pricing"
                        className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full text-xl font-medium hover:bg-white/10 transition-all backdrop-blur-md"
                    >
                        Ver planes
                    </Link>
                </div>

                <div className="mt-20 relative max-w-5xl mx-auto p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 shadow-2xl">
                    <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center relative group">
                        {/* Placeholder for Product Screenshot */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
                        <div className="text-white/20 font-serif text-4xl">Dashboard Preview</div>

                        {/* Floating UI Elements Mockup */}
                        <div className="absolute top-10 right-10 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">📈</div>
                                <div>
                                    <div className="text-xs text-white/50">Ventas Hoy</div>
                                    <div className="text-lg font-bold text-white">$245.000</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
