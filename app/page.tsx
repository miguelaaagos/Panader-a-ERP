import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-fixed">
      <div className="flex-1 w-full flex flex-col items-center bg-black/40 backdrop-blur-[2px]">
        <nav className="w-full flex justify-center border-b border-white/10 h-20 items-center">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-6">
            <div className="flex gap-2 items-center font-serif text-2xl text-white font-bold">
              <span>🥐</span> Panadería POS
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 space-y-8 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-serif text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Artesanía en cada <span className="text-primary italic">detalle.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md max-w-2xl font-light leading-relaxed">
            Gestiona tu inventario, ventas y clientes con la plataforma diseñada para la panadería chilena moderna.
          </p>
          <div className="flex gap-4 pt-4">
            <Link
              href="/login"
              className="px-10 py-4 bg-primary text-primary-foreground rounded-full text-xl font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>

        <footer className="w-full py-10 flex flex-col md:flex-row items-center justify-between px-10 text-white/60 text-sm gap-4 border-t border-white/10 bg-black/20">
          <p>© 2026 Panadería POS Chile. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            <p>Hecho con ❤️ para panaderos</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
